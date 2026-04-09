import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET() {
  const token = process.env.APIFY_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'APIFY_TOKEN not set', hasToken: false });
  }

  try {
    // Try to call Apify directly
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: ['instagram'] }),
      }
    );

    const data = await res.json();

    return NextResponse.json({
      hasToken: true,
      tokenPrefix: token.substring(0, 8) + '...',
      apifyStatus: res.status,
      apifyResponse: data,
    });
  } catch (err) {
    return NextResponse.json({
      hasToken: true,
      tokenPrefix: token.substring(0, 8) + '...',
      error: err.message,
    });
  }
}
