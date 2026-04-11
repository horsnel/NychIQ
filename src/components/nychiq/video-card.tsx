'use client';

import React, { useState } from 'react';
import { Play, MoreVertical, ExternalLink, Copy, SearchCode, MessageSquare, Link2, FileDown, Hash, FileText } from 'lucide-react';
import { cn, thumbUrl, vidDuration, fmtV, timeAgo, viralScore, sanitizeText, scoreClass, copyToClipboard } from '@/lib/utils';
import { useNychIQStore } from '@/lib/store';
import { showToast } from '@/lib/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface VideoData {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
  viralScore?: number;
  thumbnail?: string;
}

interface VideoCardProps {
  video: VideoData;
  compact?: boolean;
  showViralScore?: boolean;
  onClick?: (video: VideoData) => void;
  className?: string;
}

function ViralBadge({ score }: { score: number }) {
  if (score >= 85) {
    return (
      <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-xs font-bold">
        <span>🔥</span>
        <span className="text-[#10B981]">VIRAL</span>
      </span>
    );
  }
  if (score >= 70) {
    return (
      <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-xs font-bold">
        <span>⚡</span>
        <span className="text-[#FDBA2D]">HOT</span>
      </span>
    );
  }
  return null;
}

function VideoCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-[#141414] border border-[#222222]">
      <div className="aspect-video bg-[#1A1A1A] animate-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#1A1A1A] rounded animate-shimmer w-full" />
        <div className="h-3 bg-[#1A1A1A] rounded animate-shimmer w-3/4" />
        <div className="h-3 bg-[#1A1A1A] rounded animate-shimmer w-1/2" />
      </div>
    </div>
  );
}

export { VideoCardSkeleton };

function CopyLinkButton({ videoId }: { videoId: string }) {
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://youtube.com/watch?v=${videoId}`;
    const ok = await copyToClipboard(url);
    showToast(ok ? 'Link copied!' : 'Failed to copy link', ok ? 'success' : 'error');
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 left-2 z-20 p-1 rounded-md bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/80 focus:outline-none"
      aria-label="Copy video link"
    >
      <Link2 className="w-3.5 h-3.5 text-white" />
    </button>
  );
}

function VideoContextMenu({ video }: { video: VideoData }) {
  const { setActiveTool, setPage } = useNychIQStore();
  const youtubeUrl = `https://youtube.com/watch?v=${video.videoId}`;

  const handleOpenYouTube = () => {
    window.open(youtubeUrl, '_blank', 'noopener');
  };

  const handleCopyTitle = async () => {
    const ok = await copyToClipboard(video.title);
    showToast(ok ? 'Title copied!' : 'Failed to copy title', ok ? 'success' : 'error');
  };

  const handleCopyUrl = async () => {
    const ok = await copyToClipboard(youtubeUrl);
    showToast(ok ? 'URL copied!' : 'Failed to copy URL', ok ? 'success' : 'error');
  };

  const handleCopyDescription = async () => {
    const ok = await copyToClipboard(video.title);
    showToast(ok ? 'Description copied!' : 'Failed to copy description', ok ? 'success' : 'error');
  };

  const handleGenerateSeo = () => {
    setActiveTool('seo');
    setPage('app');
  };

  const handleDeepChat = () => {
    setActiveTool('deepchat');
    setPage('app');
  };

  const handleCopyTags = async () => {
    const tag = `#${video.title.replace(/\s+/g, '')}`;
    const ok = await copyToClipboard(tag);
    showToast(ok ? 'Tag copied!' : 'Failed to copy tag', ok ? 'success' : 'error');
  };

  const handleCopyHashtags = async () => {
    const words = video.title.split(/\s+/).filter(w => w.length > 3);
    const tags = words.slice(0, 5).map(w => `#${w.replace(/[^a-zA-Z0-9]/g, '')}`);
    const text = tags.join(' ');
    const ok = await copyToClipboard(text);
    showToast(ok ? 'Hashtags copied!' : 'Failed to copy hashtags', ok ? 'success' : 'error');
  };

  const handleCopyTranscript = async () => {
    showToast('Transcript not available for this video', 'warning');
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Channel', 'Views', 'Likes', 'Comments', 'Viral Score', 'URL'];
    const row = [
      `"${video.title}"`, `"${video.channelTitle}"`,
      String(video.viewCount || 0), String(video.likeCount || 0),
      String(video.commentCount || 0), String(video.viralScore || 0),
      `https://youtube.com/watch?v=${video.videoId}`
    ];
    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.videoId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(`https://youtube.com/watch?v=${video.videoId}`);
    showToast(ok ? 'Link copied!' : 'Failed to copy link', ok ? 'success' : 'error');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="absolute bottom-2 right-2 z-20 p-1 rounded-md bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/80 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
          aria-label="Video options"
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        className="bg-[#141414] border-[#222] min-w-[200px]"
      >
        <DropdownMenuItem
          onClick={handleOpenYouTube}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          Open on YouTube
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#222]" />
        <DropdownMenuItem
          onClick={handleCopyTitle}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <Copy className="w-4 h-4" />
          Copy Title
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCopyUrl}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <Copy className="w-4 h-4" />
          Copy URL
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCopyDescription}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <Copy className="w-4 h-4" />
          Copy Description
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#222]" />
        <DropdownMenuItem
          onClick={handleGenerateSeo}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <SearchCode className="w-4 h-4" />
          Generate SEO
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDeepChat}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          Analyse with Deep Chat
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#222]" />
        <DropdownMenuItem
          onClick={handleCopyTags}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <Hash className="w-4 h-4" />
          Copy Tags
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCopyHashtags}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <Hash className="w-4 h-4" />
          Copy Hashtags
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCopyTranscript}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          Copy Transcript
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#222]" />
        <DropdownMenuItem
          onClick={handleExportCSV}
          className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:text-[#E8E8E8] cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          Export CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function VideoCard({ video, compact = false, showViralScore = false, onClick, className }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const vs = video.viralScore ? viralScore(video.viralScore) : null;

  const handleClick = () => {
    if (onClick) {
      onClick(video);
    } else {
      window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank', 'noopener');
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex gap-3 p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors cursor-pointer group',
          className
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
      >
        <div className="relative w-40 aspect-video rounded-md overflow-hidden bg-[#1A1A1A] shrink-0">
          {!imgError ? (
            <img
              src={video.thumbnail || thumbUrl(video.videoId)}
              alt={sanitizeText(video.title, 80)}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
              <Play className="w-5 h-5 text-[#444]" />
            </div>
          )}
          {video.duration && (
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-medium bg-black/80 rounded text-white">
              {vidDuration(video.duration)}
            </span>
          )}
          {showViralScore && video.viralScore && video.viralScore >= 70 && (
            <ViralBadge score={video.viralScore} />
          )}
            <CopyLinkButton videoId={video.videoId} />
          <VideoContextMenu video={video} />
        </div>
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <h3 className="text-sm font-medium text-[#E8E8E8] line-clamp-2 group-hover:text-[#FDBA2D] transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-[#888888] mt-1">{video.channelTitle}</p>
          <div className="flex items-center gap-2 text-[11px] text-[#666666] mt-1">
            {video.viewCount != null && <span>{fmtV(video.viewCount)} views</span>}
            {video.publishedAt && <span>· {timeAgo(video.publishedAt)}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group cursor-pointer rounded-lg overflow-hidden bg-[#141414] border border-[#222222]',
        'transition-all duration-200',
        'hover:-translate-y-[3px] hover:shadow-lg hover:shadow-black/30 hover:border-[#2A2A2A]',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#1A1A1A] overflow-hidden">
        {!imgError ? (
          <img
            src={video.thumbnail || thumbUrl(video.videoId)}
            alt={sanitizeText(video.title, 80)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
            <Play className="w-8 h-8 text-[#444]" />
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#FDBA2D]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 scale-75 group-hover:scale-100">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[11px] font-medium bg-black/80 rounded text-white z-10">
            {vidDuration(video.duration)}
          </span>
        )}

        {/* Viral badge */}
        {showViralScore && video.viralScore && video.viralScore >= 70 && (
          <ViralBadge score={video.viralScore} />
        )}

        {/* 3-dots context menu */}
        <VideoContextMenu video={video} />

        {/* Copy link button */}
        <CopyLinkButton videoId={video.videoId} />
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[#E8E8E8] line-clamp-2 group-hover:text-[#FDBA2D] transition-colors leading-snug">
          {video.title}
        </h3>
        <p className="text-xs text-[#888888] mt-1.5">{video.channelTitle}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-[11px] text-[#666666]">
            {video.viewCount != null && <span>{fmtV(video.viewCount)} views</span>}
            {video.publishedAt && <span>· {timeAgo(video.publishedAt)}</span>}
          </div>
          {showViralScore && vs && video.viralScore && video.viralScore < 70 && (
            <span className={cn('text-[10px] font-semibold', scoreClass(video.viralScore))}>
              {video.viralScore}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
