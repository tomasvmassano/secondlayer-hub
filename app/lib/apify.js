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

async function runApifyActor(actorId, input, timeoutSecs = 120) {
  // Start the run
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );
  if (!startRes.ok) {
    const err = await startRes.text().catch(() => '');
    throw new Error(`Apify start error ${startRes.status}: ${err}`);
  }
  const run = await startRes.json();
  const runId = run.data?.id;
  if (!runId) throw new Error('No run ID returned');

  // Poll for completion
  const deadline = Date.now() + timeoutSecs * 1000;
  let status = run.data?.status;
  let datasetId = run.data?.defaultDatasetId;

  while (status !== 'SUCCEEDED' && status !== 'FAILED' && status !== 'ABORTED' && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    if (pollRes.ok) {
      const pollData = await pollRes.json();
      status = pollData.data?.status;
      datasetId = pollData.data?.defaultDatasetId || datasetId;
    }
  }

  if (status !== 'SUCCEEDED') throw new Error(`Apify run ${status || 'TIMEOUT'}`);

  // Get dataset items
  const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`);
  if (!dataRes.ok) throw new Error(`Apify dataset error ${dataRes.status}`);
  return dataRes.json();
}

/**
 * Scrape Instagram profile via Apify
 * Returns structured creator data
 */
async function scrapeInstagram(username) {
  const items = await runApifyActor('apify/instagram-profile-scraper', {
    usernames: [username],
  });

  if (!items || items.length === 0) return null;
  const p = items[0];

  // Calculate engagement from recent posts
  const posts = p.latestPosts || [];
  let avgLikes = 0, avgComments = 0;
  if (posts.length > 0) {
    avgLikes = Math.round(posts.reduce((s, post) => s + (post.likesCount || 0), 0) / posts.length);
    avgComments = Math.round(posts.reduce((s, post) => s + (post.commentsCount || 0), 0) / posts.length);
  }
  const followers = p.followersCount || 0;
  const engagementRate = followers > 0 ? (((avgLikes + avgComments) / followers) * 100).toFixed(2) + '%' : '0%';

  return {
    name: p.fullName || p.username || username,
    bio: p.biography || '',
    followers,
    following: p.followsCount || 0,
    postCount: p.postsCount || 0,
    isVerified: p.verified || false,
    isBusinessAccount: p.isBusinessAccount || false,
    externalUrl: p.externalUrl || '',
    profilePicUrl: p.profilePicUrlHD || p.profilePicUrl || '',
    engagementRate,
    avgLikes,
    avgComments,
    followerFollowingRatio: p.followsCount > 0 ? (followers / p.followsCount).toFixed(1) : '0',
    recentPosts: posts.slice(0, 12).map(post => ({
      caption: (post.caption || '').slice(0, 200),
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      timestamp: post.timestamp || '',
      type: post.type || 'image',
    })),
  };
}

/**
 * Scrape TikTok profile via Apify
 * Returns structured creator data
 */
async function scrapeTikTok(username) {
  const items = await runApifyActor('clockworks/tiktok-profile-scraper', {
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
