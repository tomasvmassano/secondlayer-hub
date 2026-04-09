import { NextResponse } from 'next/server';
import { saveCreator, listCreators, searchCreators } from '../../lib/creators';

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
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
  }

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

  // Extract username from URL for better searching
  const usernameMatch = url.match(/(?:instagram\.com|tiktok\.com)\/[@]?([^/?]+)/i);
  const username = usernameMatch ? usernameMatch[1] : '';
  const platform = url.includes('tiktok') ? 'TikTok' : url.includes('youtube') ? 'YouTube' : 'Instagram';

  try {
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

Search for "${username} ${platform}" and "${username} followers" to find their profile data.

After researching, you MUST respond with ONLY these lines, filled with what you found. Use 0 for unknown numbers. Do NOT skip any line:

NAME: ${name || '[their full name]'}
NICHE: [e.g. Food / Baking, Fitness, Photography]
PRIMARY_PLATFORM: ${platform}
INSTAGRAM_FOLLOWERS: [number, e.g. 181000]
INSTAGRAM_URL: ${platform === 'Instagram' ? url : '[url or empty]'}
TIKTOK_FOLLOWERS: [number]
TIKTOK_LIKES: [number]
TIKTOK_URL: ${platform === 'TikTok' ? url : '[url or empty]'}
YOUTUBE_SUBSCRIBERS: [number]
YOUTUBE_URL: ${platform === 'YouTube' ? url : '[url or empty]'}
ENGAGEMENT: [e.g. 3.5%]
PRODUCTS: [comma-separated: workshops, courses, ebooks, etc. or "None found"]
REPUTATION: [TV, press, awards, books, or "No notable mentions found"]
RESEARCH: [2-3 paragraph summary of everything you found about this creator]`,
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

    // Parse structured data
    const parsed = parseResearch(researchText, name, username, url, platform);

    const { id } = await saveCreator(parsed);

    return NextResponse.json({ id, creator: { id, ...parsed } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

function parseResearch(text, fallbackName, username, url, platform) {
  const get = (key) => {
    const match = text.match(new RegExp(`^${key}:\\s*(.+)`, 'mi'));
    return match ? match[1].trim().replace(/^\[.*\]$/, '') : '';
  };

  const getNum = (key) => {
    const val = get(key);
    if (!val || val === '0') return 0;
    // Handle formats like "181,000" or "181000" or "181K" or "2.6M"
    let cleaned = val.replace(/[,\s]/g, '');
    if (/(\d+(?:\.\d+)?)\s*[kK]/.test(cleaned)) {
      return Math.round(parseFloat(RegExp.$1) * 1000);
    }
    if (/(\d+(?:\.\d+)?)\s*[mM]/.test(cleaned)) {
      return Math.round(parseFloat(RegExp.$1) * 1000000);
    }
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  };

  const name = get('NAME') || fallbackName || username || 'Unknown';
  const niche = get('NICHE') || '';
  const primaryPlatform = get('PRIMARY_PLATFORM') || platform || 'Instagram';
  const engagement = get('ENGAGEMENT') || '';
  const productsRaw = get('PRODUCTS');
  const products = productsRaw && productsRaw !== 'None found'
    ? productsRaw.split(',').map(p => p.trim()).filter(Boolean)
    : [];
  const reputation = get('REPUTATION') || '';

  const researchMatch = text.match(/^RESEARCH:\s*([\s\S]+)/mi);
  const research = researchMatch ? researchMatch[1].trim() : text;

  const platforms = {};

  // Always set the platform from the URL
  if (platform === 'Instagram' || get('INSTAGRAM_URL') || getNum('INSTAGRAM_FOLLOWERS')) {
    platforms.instagram = {
      followers: getNum('INSTAGRAM_FOLLOWERS'),
      url: get('INSTAGRAM_URL') || (platform === 'Instagram' ? url : ''),
    };
  }

  if (platform === 'TikTok' || get('TIKTOK_URL') || getNum('TIKTOK_FOLLOWERS')) {
    platforms.tiktok = {
      followers: getNum('TIKTOK_FOLLOWERS'),
      likes: getNum('TIKTOK_LIKES'),
      url: get('TIKTOK_URL') || (platform === 'TikTok' ? url : ''),
    };
  }

  if (platform === 'YouTube' || get('YOUTUBE_URL') || getNum('YOUTUBE_SUBSCRIBERS')) {
    platforms.youtube = {
      subscribers: getNum('YOUTUBE_SUBSCRIBERS'),
      url: get('YOUTUBE_URL') || (platform === 'YouTube' ? url : ''),
    };
  }

  return {
    name,
    niche,
    primaryPlatform,
    platforms,
    engagement,
    products,
    reputation,
    research,
  };
}
