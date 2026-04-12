import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const part = searchParams.get('part') || 'snippet';
  const chart = searchParams.get('chart') || 'mostPopular';
  const regionCode = searchParams.get('regionCode') || 'US';
  const maxResults = searchParams.get('maxResults') || '20';
  const id = searchParams.get('id') || '';
  const pageToken = searchParams.get('pageToken') || '';

  const params = new URLSearchParams({
    part,
    chart,
    regionCode,
    maxResults,
  });

  if (id) {
    params.set('id', id);
    params.delete('chart');
  }
  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    // Return mock data if no API key is configured
    return NextResponse.json(generateMockVideos(parseInt(maxResults, 10)));
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('YouTube API error:', res.status, errorData);
      return NextResponse.json(
        { error: errorData.error?.message || `YouTube API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('YouTube fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch from YouTube API' },
      { status: 500 }
    );
  }
}

/* ── Mock data generator ── */
function generateMockVideos(count: number) {
  const channels = [
    'TechVision Africa', 'Naija Trends', 'CodeMaster NG', 'Comedy Central Naija',
    'Africa Facts Zone', 'Startup Grind Lagos', 'Music Vibes NG', 'Foodie Queen',
    'Travel Africa', 'Gaming Zone Africa', 'Science Explained', 'DIY Crafts NG',
    'Fitness with Ada', 'Fashion Forward', 'News Daily Africa',
  ];

  const titles = [
    'How AI is Changing Nigeria in 2025', 'Top 10 Programming Languages to Learn',
    'Lagos Street Food Tour - Must Try!', 'Building a Startup in Africa - Full Guide',
    'Comedy Skit: When Your Code Works First Time', 'React 19 New Features Explained',
    'Best Phones Under 100K Naira 2025', 'How I Made $10K from YouTube in 30 Days',
    'African Tech Ecosystem Growth', 'Python for Data Science - Complete Course',
    'Nigerian Jollof Rice Recipe', 'Web Development Roadmap 2025',
    'Top Viral TikTok Trends This Week', 'How to Start a YouTube Channel',
    'AI Tools Every Creator Needs', 'Electric Cars in Africa - The Future',
  ];

  const items = Array.from({ length: count }, (_, i) => ({
    id: `mock-${i + 1}`,
    snippet: {
      title: titles[i % titles.length],
      channelTitle: channels[i % channels.length],
      channelId: `ch-${i}`,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      thumbnails: {
        high: { url: `https://picsum.photos/seed/yt${i + 1}/480/360` },
        medium: { url: `https://picsum.photos/seed/yt${i + 1}/320/180` },
        default: { url: `https://picsum.photos/seed/yt${i + 1}/120/90` },
      },
    },
    statistics: {
      viewCount: String(Math.floor(Math.random() * 5000000) + 1000),
      likeCount: String(Math.floor(Math.random() * 200000) + 100),
      commentCount: String(Math.floor(Math.random() * 10000) + 10),
    },
    contentDetails: {
      duration: `PT${Math.floor(Math.random() * 20) + 3}M${Math.floor(Math.random() * 60)}S`,
    },
  }));

  return { items, pageInfo: { totalResults: count, resultsPerPage: count } };
}
