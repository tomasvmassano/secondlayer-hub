import { NextResponse } from 'next/server';
import { saveCreator, listCreators, searchCreators } from '../../lib/creators';
import { scrapeCreator, apifyToCreatorProfile } from '../../lib/apify';

// Allow up to 60 seconds for Apify scraping
export const maxDuration = 60;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (q) {
      const results = await searchCreators(q);
      return NextResponse.json({ creators: results });
    }

    const creators = await listCreators();
    return NextResponse.json({ creators });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { url, name } = body;
  if (!url) {
    return NextResponse.json({ error: 'Missing "url" field' }, { status: 400 });
  }

  try {
    // Step 1: Try Apify for structured data (fast, cheap, accurate)
    const apifyData = await scrapeCreator(url);
    let profile = null;

    if (apifyData.source === 'apify' && !apifyData.error) {
      profile = apifyToCreatorProfile(apifyData, url);

      // Step 2: Use Claude to analyze the raw data (niche, products, reputation)
      if (apiKey && profile) {
        try {
          const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1500,
              messages: [{
                role: 'user',
                content: `Analyze this creator's profile data and respond with ONLY these lines:

NICHE: [their niche, e.g. "Food / Baking", "Fitness", "Photography", "Business"]
PRODUCTS: [comma-separated list of anything they sell: courses, workshops, ebooks, merch, or "None found"]
REPUTATION: [any notable achievements, or "No notable mentions"]

Creator data:
Name: ${profile.name}
Bio: ${profile.bio || 'No bio'}
External URL: ${profile.externalUrl || 'None'}
Platform: ${profile.primaryPlatform}
Followers: ${apifyData.followers || 0}
Engagement: ${profile.engagement || 'Unknown'}
Is verified: ${profile.isVerified}
Is business account: ${profile.isBusinessAccount}
Recent posts: ${(apifyData.recentPosts || apifyData.recentVideos || []).slice(0, 5).map(p => p.caption).join(' | ')}`,
              }],
            }),
          });

          const analysisData = await analysisResponse.json();
          if (analysisResponse.ok) {
            const analysisText = (analysisData.content || [])
              .filter(b => b.type === 'text')
              .map(b => b.text)
              .join('\n');

            const getNiche = analysisText.match(/^NICHE:\s*(.+)/mi);
            const getProducts = analysisText.match(/^PRODUCTS:\s*(.+)/mi);
            const getReputation = analysisText.match(/^REPUTATION:\s*(.+)/mi);

            if (getNiche) profile.niche = getNiche[1].trim();
            if (getProducts && getProducts[1].trim() !== 'None found') {
              profile.products = getProducts[1].trim().split(',').map(p => p.trim()).filter(Boolean);
            }
            if (getReputation && getReputation[1].trim() !== 'No notable mentions') {
              profile.reputation = getReputation[1].trim();
            }
          }
        } catch {
          // Analysis failed, we still have the raw Apify data
        }
      }
    } else {
      // Apify not available or failed — fallback to Claude web search
      if (!apiKey) {
        return NextResponse.json({ error: 'Neither APIFY_TOKEN nor ANTHROPIC_API_KEY configured' }, { status: 500 });
      }

      const usernameMatch = url.match(/(?:instagram\.com|tiktok\.com)\/[@]?([^/?]+)/i);
      const username = usernameMatch ? usernameMatch[1] : '';
      const platform = url.includes('tiktok') ? 'TikTok' : url.includes('youtube') ? 'YouTube' : 'Instagram';

      const researchResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Search for this ${platform} creator: ${url}
${name ? `Name: ${name}` : `Username: ${username}`}

Search for "${username} ${platform}" and "${username} followers".

Respond with ONLY these lines:

NAME: ${name || '[full name]'}
NICHE: [e.g. Food / Baking, Fitness, Photography]
PRIMARY_PLATFORM: ${platform}
INSTAGRAM_FOLLOWERS: [number, e.g. 181000]
INSTAGRAM_URL: ${platform === 'Instagram' ? url : ''}
TIKTOK_FOLLOWERS: [number]
TIKTOK_LIKES: [number]
TIKTOK_URL: ${platform === 'TikTok' ? url : ''}
YOUTUBE_SUBSCRIBERS: [number]
YOUTUBE_URL: ${platform === 'YouTube' ? url : ''}
ENGAGEMENT: [e.g. 3.5%]
PRODUCTS: [comma-separated, or "None found"]
REPUTATION: [brief summary, or "No notable mentions"]
RESEARCH: [2-3 paragraph summary]`,
          }],
        }),
      });

      const researchData = await researchResponse.json();
      if (!researchResponse.ok) {
        return NextResponse.json({ error: researchData.error?.message || 'Research failed' }, { status: 500 });
      }

      const researchText = (researchData.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n\n');

      profile = parseClaudeResearch(researchText, name, username, url, platform);
    }

    if (name && profile) profile.name = name;

    const { id } = await saveCreator(profile);
    return NextResponse.json({ id, creator: { id, ...profile } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

function parseClaudeResearch(text, fallbackName, username, url, platform) {
  const get = (key) => {
    const match = text.match(new RegExp(`^${key}:\\s*(.+)`, 'mi'));
    return match ? match[1].trim().replace(/^\[.*\]$/, '') : '';
  };

  const getNum = (key) => {
    const val = get(key);
    if (!val || val === '0') return 0;
    let cleaned = val.replace(/[,\s]/g, '');
    if (/(\d+(?:\.\d+)?)\s*[kK]/.test(cleaned)) return Math.round(parseFloat(RegExp.$1) * 1000);
    if (/(\d+(?:\.\d+)?)\s*[mM]/.test(cleaned)) return Math.round(parseFloat(RegExp.$1) * 1000000);
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  };

  const researchMatch = text.match(/^RESEARCH:\s*([\s\S]+)/mi);
  const productsRaw = get('PRODUCTS');

  const platforms = {};
  if (platform === 'Instagram' || getNum('INSTAGRAM_FOLLOWERS')) {
    platforms.instagram = { followers: getNum('INSTAGRAM_FOLLOWERS'), url: get('INSTAGRAM_URL') || (platform === 'Instagram' ? url : '') };
  }
  if (platform === 'TikTok' || getNum('TIKTOK_FOLLOWERS')) {
    platforms.tiktok = { followers: getNum('TIKTOK_FOLLOWERS'), totalLikes: getNum('TIKTOK_LIKES'), url: get('TIKTOK_URL') || (platform === 'TikTok' ? url : '') };
  }
  if (platform === 'YouTube' || getNum('YOUTUBE_SUBSCRIBERS')) {
    platforms.youtube = { subscribers: getNum('YOUTUBE_SUBSCRIBERS'), url: get('YOUTUBE_URL') || (platform === 'YouTube' ? url : '') };
  }

  return {
    name: get('NAME') || fallbackName || username || 'Unknown',
    niche: get('NICHE') || '',
    primaryPlatform: get('PRIMARY_PLATFORM') || platform || 'Instagram',
    platforms,
    engagement: get('ENGAGEMENT') || '',
    products: productsRaw && productsRaw !== 'None found' ? productsRaw.split(',').map(p => p.trim()).filter(Boolean) : [],
    reputation: get('REPUTATION') || '',
    research: researchMatch ? researchMatch[1].trim() : text,
  };
}
