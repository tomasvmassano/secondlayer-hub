import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request) {
  const token = process.env.APIFY_TOKEN;
  if (!token) return NextResponse.json({ error: 'No APIFY_TOKEN' });

  try {
    // Start the run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: ['_andre.teixeira'] }),
      }
    );
    const run = await startRes.json();
    const runId = run.data?.id;
    const datasetId = run.data?.defaultDatasetId;

    // Poll for completion
    let status = run.data?.status;
    for (let i = 0; i < 30 && status !== 'SUCCEEDED' && status !== 'FAILED'; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
      const pollData = await pollRes.json();
      status = pollData.data?.status;
    }

    if (status !== 'SUCCEEDED') return NextResponse.json({ error: `Run ${status}`, runId });

    // Get dataset
    const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`);
    const items = await dataRes.json();

    // Return ALL fields from the first item so we can see what's available
    const first = items[0] || {};
    const fieldNames = Object.keys(first);

    return NextResponse.json({
      fieldNames,
      biography: first.biography,
      bio: first.bio,
      externalUrl: first.externalUrl,
      externalUrlShimmed: first.externalUrlShimmed,
      fullName: first.fullName,
      username: first.username,
      followersCount: first.followersCount,
      // Show first 500 chars of stringified full object
      rawPreview: JSON.stringify(first).slice(0, 2000),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message });
  }
}
