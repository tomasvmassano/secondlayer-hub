/**
 * Apify integration for scraping Instagram and TikTok profiles.
 *
 * Uses:
 * - apify/instagram-profile-scraper for Instagram
 * - clockworks/tiktok-profile-scraper for TikTok (profile data from first few posts)
 *
 * Falls back to Claude web search if Apify is not configured.
 */

const APIFY_TOKEN = process.env.APIFY_TOKEN;

function hasApify() {
  return !!APIFY_TOKEN;
}

async function runApifyActor(actorId, input) {
  // Use sync API with 45-second timeout (fits within Vercel's 60s limit)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50000);

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=45`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Apify error ${res.status}: ${err.slice(0, 200)}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Scrape Instagram profile via Apify
 * Returns structured creator data
 */
async function scrapeInstagram(username) {
  // Use apify/instagram-scraper with resultsType "details" to get full profile including bio
  const items = await runApifyActor('apify~instagram-scraper', {
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsType: 'details',
    resultsLimit: 1,
  });

  if (!items || items.length === 0) return null;
  const p = items[0];

  // Calculate engagement from recent posts
  const posts = p.latestPosts || p.recentPosts || [];
  let avgLikes = 0, avgComments = 0;
  if (posts.length > 0) {
    avgLikes = Math.round(posts.reduce((s, post) => s + (post.likesCount || post.likes || 0), 0) / posts.length);
    avgComments = Math.round(posts.reduce((s, post) => s + (post.commentsCount || post.comments || 0), 0) / posts.length);
  }
  const followers = p.followersCount || p.followers || 0;
  const following = p.followsCount || p.followingCount || p.following || 0;
  const engagementRate = followers > 0 ? (((avgLikes + avgComments) / followers) * 100).toFixed(2) + '%' : '0%';

  return {
    name: p.fullName || p.name || p.username || username,
    bio: p.biography || p.bio || p.description || '',
    followers,
    following,
    postCount: p.postsCount || p.mediaCount || p.postCount || 0,
    isVerified: p.verified || p.isVerified || false,
    isBusinessAccount: p.isBusinessAccount || p.isBusiness || false,
    externalUrl: p.externalUrl || p.externalUrlShimmed || p.website || '',
    profilePicUrl: p.profilePicUrlHD || p.profilePicUrl || p.profilePic || '',
    engagementRate,
    avgLikes,
    avgComments,
    followerFollowingRatio: following > 0 ? (followers / following).toFixed(1) : '0',
    recentPosts: posts.slice(0, 12).map(post => ({
      caption: (post.caption || '').slice(0, 200),
      likes: post.likesCount || post.likes || 0,
      comments: post.commentsCount || post.comments || 0,
      timestamp: post.timestamp || '',
      type: post.type || 'image',
    })),
    // Debug: raw field names for troubleshooting
    _debug: Object.keys(p).filter(k => !['latestPosts', 'recentPosts'].includes(k)),
  };
}

/**
 * Scrape TikTok profile via Apify
 * Returns structured creator data
 */
async function scrapeTikTok(username) {
  const items = await runApifyActor('clockworks~tiktok-profile-scraper', {
    profiles: [username],
    resultsPerPage: 5,
    profileScrapeSections: ['videos'],
  });

  if (!items || items.length === 0) return null;

  // TikTok scraper returns video items — extract profile info from the first one
  const first = items[0];
  const authorMeta = first.authorMeta || {};

  // Calculate avg views from videos
  const avgViews = items.length > 0
    ? Math.round(items.reduce((s, v) => s + (v.playCount || 0), 0) / items.length)
    : 0;

  return {
    name: authorMeta.name || authorMeta.nickName || username,
    bio: authorMeta.signature || '',
    followers: authorMeta.fans || 0,
    following: authorMeta.following || 0,
    totalLikes: authorMeta.heart || 0,
    videoCount: authorMeta.video || 0,
    isVerified: authorMeta.verified || false,
    profilePicUrl: authorMeta.avatar || '',
    avgViews,
    recentVideos: items.slice(0, 5).map(v => ({
      caption: (v.text || '').slice(0, 200),
      views: v.playCount || 0,
      likes: v.diggCount || 0,
      comments: v.commentCount || 0,
      shares: v.shareCount || 0,
    })),
  };
}

/**
 * Scrape YouTube channel via Apify
 * Returns structured channel data with recent videos
 */
async function scrapeYouTube(channelUrl) {
  const items = await runApifyActor('streamers~youtube-channel-scraper', {
    startUrls: [{ url: channelUrl }],
    maxResults: 3,
    maxResultsShorts: 0,
    maxResultStreams: 0,
  });

  if (!items || items.length === 0) return null;

  // Extract channel info from first video
  const first = items[0];
  const subscribers = first.channelSubscribers || 0;
  const channelName = first.channelName || '';

  return {
    name: channelName,
    subscribers,
    videoCount: first.channelVideoCount || 0,
    channelUrl: first.channelUrl || channelUrl,
    recentVideos: items.map(v => ({
      title: (v.title || '').slice(0, 150),
      views: v.viewCount || 0,
      likes: v.likes || 0,
      comments: v.commentsCount || 0,
      date: v.date || '',
      url: v.url || '',
      duration: v.duration || '',
    })),
  };
}

/**
 * Main scrape function — detects platform from URL and scrapes accordingly
 */
export async function scrapeCreator(url) {
  if (!hasApify()) return { error: 'APIFY_TOKEN not configured', source: 'none' };

  const isInstagram = /instagram\.com/i.test(url);
  const isTikTok = /tiktok\.com/i.test(url);

  // Extract username from URL
  let username = '';
  if (isInstagram) {
    const match = url.match(/instagram\.com\/([^/?]+)/i);
    username = match ? match[1].replace(/^@/, '') : '';
  } else if (isTikTok) {
    const match = url.match(/tiktok\.com\/@?([^/?]+)/i);
    username = match ? match[1].replace(/^@/, '') : '';
  }

  if (!username) return { error: 'Could not extract username from URL', source: 'none' };

  try {
    if (isInstagram) {
      const data = await scrapeInstagram(username);
      if (!data) return { error: 'No data returned', source: 'apify' };
      return {
        source: 'apify',
        platform: 'Instagram',
        username,
        ...data,
      };
    }

    if (isTikTok) {
      const data = await scrapeTikTok(username);
      if (!data) return { error: 'No data returned', source: 'apify' };
      return {
        source: 'apify',
        platform: 'TikTok',
        username,
        ...data,
      };
    }

    return { error: 'Unsupported platform', source: 'none' };
  } catch (err) {
    return { error: err.message, source: 'apify' };
  }
}

/**
 * Scrape multiple platforms in parallel and merge into one profile.
 * Returns a merged creator profile object (not raw scrape data).
 */
export async function scrapeMultiplePlatforms(instagramUrl, tiktokUrl, youtubeUrl) {
  if (!hasApify()) return { error: 'APIFY_TOKEN not configured', source: 'none' };

  const tasks = [];

  if (instagramUrl) {
    const match = instagramUrl.match(/instagram\.com\/([^/?]+)/i);
    const username = match ? match[1].replace(/^@/, '') : '';
    if (username) tasks.push(scrapeInstagram(username).then(d => ({ platform: 'instagram', data: d, url: instagramUrl })).catch(() => ({ platform: 'instagram', data: null, url: instagramUrl })));
  }

  if (tiktokUrl) {
    const match = tiktokUrl.match(/tiktok\.com\/@?([^/?]+)/i);
    const username = match ? match[1].replace(/^@/, '') : '';
    if (username) tasks.push(scrapeTikTok(username).then(d => ({ platform: 'tiktok', data: d, url: tiktokUrl })).catch(() => ({ platform: 'tiktok', data: null, url: tiktokUrl })));
  }

  if (youtubeUrl) {
    tasks.push(scrapeYouTube(youtubeUrl).then(d => ({ platform: 'youtube', data: d, url: youtubeUrl })).catch(() => ({ platform: 'youtube', data: null, url: youtubeUrl })));
  }

  if (tasks.length === 0) return { error: 'No valid URLs provided', source: 'none' };

  const results = await Promise.all(tasks);

  // Build merged profile
  const igResult = results.find(r => r.platform === 'instagram');
  const tkResult = results.find(r => r.platform === 'tiktok');
  const ytResult = results.find(r => r.platform === 'youtube');
  const igData = igResult?.data;
  const tkData = tkResult?.data;
  const ytData = ytResult?.data;

  // Pick name/bio from whichever platform returned data (prefer Instagram)
  const name = igData?.name || tkData?.name || ytData?.name || 'Unknown';
  const bio = igData?.bio || tkData?.bio || '';
  const profilePicUrl = igData?.profilePicUrl || tkData?.profilePicUrl || '';

  const profile = {
    name,
    niche: '',
    primaryPlatform: igData ? 'Instagram' : 'TikTok',
    engagement: igData?.engagementRate || '',
    bio,
    externalUrl: igData?.externalUrl || '',
    isVerified: igData?.isVerified || tkData?.isVerified || false,
    isBusinessAccount: igData?.isBusinessAccount || false,
    profilePicUrl,
    platforms: {},
    products: [],
    reputation: '',
    research: '',
    _apifyDebug: igData?._debug || null,
    _rawBioCheck: {
      bio: igData?.bio || '(empty)',
      biography: 'checked in scraper',
      externalUrl: igData?.externalUrl || '(empty)',
    },
  };

  if (igData) {
    profile.platforms.instagram = {
      followers: igData.followers || 0,
      following: igData.following || 0,
      postCount: igData.postCount || 0,
      avgLikes: igData.avgLikes || 0,
      avgComments: igData.avgComments || 0,
      followerFollowingRatio: igData.followerFollowingRatio || '0',
      engagementRate: igData.engagementRate || '',
      url: instagramUrl,
      recentPosts: igData.recentPosts || [],
    };
  }

  if (tkData) {
    profile.platforms.tiktok = {
      followers: tkData.followers || 0,
      following: tkData.following || 0,
      totalLikes: tkData.totalLikes || 0,
      videoCount: tkData.videoCount || 0,
      avgViews: tkData.avgViews || 0,
      url: tiktokUrl,
      recentVideos: tkData.recentVideos || [],
    };
  }

  if (ytData) {
    profile.platforms.youtube = {
      subscribers: ytData.subscribers || 0,
      videoCount: ytData.videoCount || 0,
      url: ytData.channelUrl || youtubeUrl,
      recentVideos: ytData.recentVideos || [],
    };
  }

  // Return both profile and raw data for Claude analysis
  return {
    source: 'apify',
    profile,
    igRaw: igData,
    tkRaw: tkData,
    ytRaw: ytData,
  };
}

/**
 * Convert Apify scrape data into our creator profile format
 */
export function apifyToCreatorProfile(scrapeData, url) {
  if (scrapeData.error || scrapeData.source === 'none') return null;

  const profile = {
    name: scrapeData.name || scrapeData.username || 'Unknown',
    niche: '', // Will be filled by Claude analysis
    primaryPlatform: scrapeData.platform,
    engagement: scrapeData.engagementRate || '',
    bio: scrapeData.bio || '',
    externalUrl: scrapeData.externalUrl || '',
    isVerified: scrapeData.isVerified || false,
    isBusinessAccount: scrapeData.isBusinessAccount || false,
    profilePicUrl: scrapeData.profilePicUrl || '',
    platforms: {},
    products: [],
    reputation: '',
    research: '',
  };

  if (scrapeData.platform === 'Instagram') {
    profile.platforms.instagram = {
      followers: scrapeData.followers || 0,
      following: scrapeData.following || 0,
      postCount: scrapeData.postCount || 0,
      avgLikes: scrapeData.avgLikes || 0,
      avgComments: scrapeData.avgComments || 0,
      followerFollowingRatio: scrapeData.followerFollowingRatio || '0',
      url,
      recentPosts: scrapeData.recentPosts || [],
    };
    profile.engagement = scrapeData.engagementRate || '';
  }

  if (scrapeData.platform === 'TikTok') {
    profile.platforms.tiktok = {
      followers: scrapeData.followers || 0,
      following: scrapeData.following || 0,
      totalLikes: scrapeData.totalLikes || 0,
      videoCount: scrapeData.videoCount || 0,
      avgViews: scrapeData.avgViews || 0,
      url,
      recentVideos: scrapeData.recentVideos || [],
    };
  }

  return profile;
}
