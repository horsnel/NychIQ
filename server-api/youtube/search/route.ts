import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const part = searchParams.get('part') || 'snippet';
  const q = searchParams.get('q') || '';
  const maxResults = searchParams.get('maxResults') || '20';
  const type = searchParams.get('type') || 'video';
  const pageToken = searchParams.get('pageToken') || '';

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const regionCode = searchParams.get('regionCode') || '';

  const params = new URLSearchParams({
    part,
    q,
    maxResults,
    type,
  });

  if (regionCode) {
    params.set('regionCode', regionCode);
  }
  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    // Return mock data if no API key is configured
    return NextResponse.json(generateMockSearch(q, type, parseInt(maxResults, 10)));
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      { next: { revalidate: 60 } } // Cache for 1 minute
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('YouTube Search API error:', res.status, errorData);
      return NextResponse.json(
        { error: errorData.error?.message || `YouTube API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('YouTube search fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch from YouTube API' },
      { status: 500 }
    );
  }
}

/* ── Mock search data ── */
function generateMockSearch(query: string, type: string, count: number) {
  const channels = [
    'TechVision Africa', 'Naija Trends', 'CodeMaster NG', 'Comedy Central Naija',
    'Africa Facts Zone', 'Startup Grind Lagos', 'Music Vibes NG', 'Foodie Queen',
    'Travel Africa', 'Gaming Zone Africa',
  ];

  if (type === 'channel') {
    const items = Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      id: { channelId: `mock-ch-${i}` },
      snippet: {
        title: `${query} - ${channels[i % channels.length]}`,
        channelId: `mock-ch-${i}`,
        description: `Channel about ${query}. Creating amazing content for the community. Subscribe for updates!`,
        thumbnails: {
          high: { url: `https://picsum.photos/seed/avatar${i + 1}/200/200` },
          medium: { url: `https://picsum.photos/seed/avatar${i + 1}/150/150` },
          default: { url: `https://picsum.photos/seed/avatar${i + 1}/88/88` },
        },
      },
    }));

    return { items, pageInfo: { totalResults: items.length, resultsPerPage: items.length } };
  }

  const items = Array.from({ length: count }, (_, i) => ({
    id: { videoId: `mock-vid-${i}` },
    snippet: {
      title: `${query} - Episode ${i + 1} | Amazing ${query} Content`,
      channelTitle: channels[i % channels.length],
      channelId: `ch-${i}`,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      thumbnails: {
        high: { url: `https://picsum.photos/seed/search${i + 1}/480/360` },
        medium: { url: `https://picsum.photos/seed/search${i + 1}/320/180` },
        default: { url: `https://picsum.photos/seed/search${i + 1}/120/90` },
      },
    },
  }));

  return { items, pageInfo: { totalResults: items.length, resultsPerPage: items.length } };
}
