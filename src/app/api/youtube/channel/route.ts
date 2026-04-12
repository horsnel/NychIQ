import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const handle = searchParams.get('handle') || '';
  const id = searchParams.get('id') || '';

  if (!handle && !id) {
    return NextResponse.json(
      { error: 'Either "handle" or "id" parameter is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    const channelName = handle?.replace('@', '') || 'Unknown Channel';
    return NextResponse.json(generateMockChannel(channelName, handle));
  }

  try {
    let channelId = id;

    if (!channelId && handle) {
      const searchQuery = handle.startsWith('@') ? handle : `@${handle}`;
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: searchQuery,
        type: 'channel',
        maxResults: '1',
      });

      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`,
        { next: { revalidate: 60 } }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items?.length > 0) {
          channelId = searchData.items[0].snippet?.channelId;
        }
      }

      if (!channelId) {
        const forHandleParams = new URLSearchParams({
          part: 'snippet,statistics,brandingSettings',
          forHandle: handle.startsWith('@') ? handle.slice(1) : handle,
        });

        const handleRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?${forHandleParams.toString()}`,
          { next: { revalidate: 60 } }
        );

        if (handleRes.ok) {
          const handleData = await handleRes.json();
          if (handleData.items?.length > 0) {
            channelId = handleData.items[0].id;
          }
        }
      }
    }

    if (!channelId) {
      const channelName = handle?.replace('@', '') || 'Unknown Channel';
      return NextResponse.json(generateMockChannel(channelName, handle));
    }

    const channelParams = new URLSearchParams({
      part: 'snippet,statistics,brandingSettings,contentDetails',
      id: channelId,
    });

    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${channelParams.toString()}`,
      { next: { revalidate: 120 } }
    );

    if (!channelRes.ok) {
      const channelName = handle?.replace('@', '') || 'Unknown Channel';
      return NextResponse.json(generateMockChannel(channelName, handle));
    }

    const channelData = await channelRes.json();

    if (!channelData.items?.length) {
      const channelName = handle?.replace('@', '') || 'Unknown Channel';
      return NextResponse.json(generateMockChannel(channelName, handle));
    }

    const ch = channelData.items[0];
    const snippet = ch.snippet || {};
    const stats = ch.statistics || {};
    const branding = ch.brandingSettings || {};
    const thumbnails = snippet.thumbnails || {};

    return NextResponse.json({
      id: ch.id,
      name: snippet.title || '',
      handle: handle || '',
      customUrl: snippet.customUrl || '',
      description: snippet.description || '',
      avatarUrl: thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '',
      bannerUrl: branding.image?.bannerExternalUrl || '',
      country: snippet.country || '',
      publishedAt: snippet.publishedAt || '',
      keywords: branding.channel?.keywords || '',
      subscribers: parseInt(stats.subscriberCount || '0', 10),
      videoCount: parseInt(stats.videoCount || '0', 10),
      totalViews: parseInt(stats.viewCount || '0', 10),
      hiddenSubscriberCount: stats.hiddenSubscriberCount === true,
    });
  } catch (err) {
    console.error('YouTube channel fetch error:', err);
    const channelName = handle?.replace('@', '') || 'Unknown Channel';
    return NextResponse.json(generateMockChannel(channelName, handle));
  }
}

/* ── Mock channel data ── */
function generateMockChannel(name: string, handle: string) {
  const seed = hashString(name);
  const subscribers = 5000 + (seed % 500000);
  const videoCount = 20 + (seed % 500);
  const totalViews = Math.floor(subscribers * (15 + (seed % 200)));

  return {
    id: `mock-ch-${seed}`,
    name: capitalizeWords(name),
    handle: handle || `@${name.toLowerCase().replace(/\s+/g, '')}`,
    customUrl: `https://www.youtube.com/@${name.toLowerCase().replace(/\s+/g, '')}`,
    description: `Welcome to ${capitalizeWords(name)}! We create engaging content about technology, tutorials, and more. Subscribe for the latest updates and high-quality videos every week.`,
    avatarUrl: '',
    bannerUrl: '',
    country: 'US',
    publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3).toISOString(),
    keywords: 'technology, tutorials, youtube, content creator',
    subscribers,
    videoCount,
    totalViews,
    hiddenSubscriberCount: false,
    _mock: true,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function capitalizeWords(str: string): string {
  return str
    .replace(/[@_\-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
