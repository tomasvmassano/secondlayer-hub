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

  try {
    // Scrape creator info using Anthropic with web search
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
          content: `Research this creator: ${url}
${name ? `Their name is ${name}.` : ''}

Do multiple searches to find:
1. Their name and bio
2. Exact follower counts on Instagram, TikTok, YouTube
3. What they sell (courses, workshops, products, ebooks)
4. Their niche/category
5. Engagement rate
6. Reputation (TV, press, awards, books)

After your research, output EXACTLY in this format (fill in what you find, leave empty if unknown):

NAME: [full name]
NICHE: [their niche, e.g. "Food / Baking", "Fitness", "Photography"]
PRIMARY_PLATFORM: [Instagram or TikTok or YouTube]
INSTAGRAM_FOLLOWERS: [number only, e.g. 181000]
INSTAGRAM_URL: [url]
TIKTOK_FOLLOWERS: [number only]
TIKTOK_LIKES: [number only]
TIKTOK_URL: [url]
YOUTUBE_SUBSCRIBERS: [number only]
YOUTUBE_URL: [url]
ENGAGEMENT: [percentage, e.g. 3.5%]
PRODUCTS: [comma-separated list]
REPUTATION: [brief summary of press, TV, awards]
RESEARCH: [full research text with all details found]`,
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

    // Parse structured data from research
    const parsed = _parseResearch(researchText, name);

    // Save to database
    const { id } = await saveCreator(parsed);

    return NextResponse.json({ id, creator: { id, ...parsed } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

function _parseResearch(text, fallbackName) {
  const get = (key) => {
    const match = text.match(new RegExp(`${key}:\\s*(.+)`, 'i'));
    return match ? match[1].trim() : '';
  };

  const getNum = (key) => {
    const val = get(key);
    if (!val) return 0;
    const num = parseInt(val.replace(/[,.\s]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const name = get('NAME') || fallbackName || 'Unknown';
  const niche = get('NICHE');
  const primaryPlatform = get('PRIMARY_PLATFORM') || 'Instagram';
  const engagement = get('ENGAGEMENT');
  const productsRaw = get('PRODUCTS');
  const products = productsRaw ? productsRaw.split(',').map(p => p.trim()).filter(Boolean) : [];
  const reputation = get('REPUTATION');

  // Extract research block (everything after RESEARCH:)
  const researchMatch = text.match(/RESEARCH:\s*([\s\S]+)/i);
  const research = researchMatch ? researchMatch[1].trim() : text;

  const platforms = {};

  const igFollowers = getNum('INSTAGRAM_FOLLOWERS');
  const igUrl = get('INSTAGRAM_URL');
  if (igFollowers || igUrl) {
    platforms.instagram = { followers: igFollowers, url: igUrl };
  }

  const ttFollowers = getNum('TIKTOK_FOLLOWERS');
  const ttLikes = getNum('TIKTOK_LIKES');
  const ttUrl = get('TIKTOK_URL');
  if (ttFollowers || ttUrl) {
    platforms.tiktok = { followers: ttFollowers, likes: ttLikes, url: ttUrl };
  }

  const ytSubs = getNum('YOUTUBE_SUBSCRIBERS');
  const ytUrl = get('YOUTUBE_URL');
  if (ytSubs || ytUrl) {
    platforms.youtube = { subscribers: ytSubs, url: ytUrl };
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
