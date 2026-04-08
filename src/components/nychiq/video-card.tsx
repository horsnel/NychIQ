'use client';

import React, { useState } from 'react';
import { Play, MoreVertical, ExternalLink, Copy, SearchCode, MessageSquare } from 'lucide-react';
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
        <span className="text-[#00C48C]">VIRAL</span>
      </span>
    );
  }
  if (score >= 70) {
    return (
      <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-xs font-bold">
        <span>⚡</span>
        <span className="text-[#F5A623]">HOT</span>
      </span>
    );
  }
  return null;
}

function VideoCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-[#111111] border border-[#222222]">
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="absolute top-2 right-2 z-20 p-1 rounded-md bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/80 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
          aria-label="Video options"
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        className="bg-[#111] border-[#222] min-w-[200px]"
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
          <VideoContextMenu video={video} />
        </div>
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <h3 className="text-sm font-medium text-[#E8E8E8] line-clamp-2 group-hover:text-[#F5A623] transition-colors">
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
        'group cursor-pointer rounded-lg overflow-hidden bg-[#111111] border border-[#222222]',
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
          <div className="w-10 h-10 rounded-full bg-[#F5A623]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 scale-75 group-hover:scale-100">
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
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[#E8E8E8] line-clamp-2 group-hover:text-[#F5A623] transition-colors leading-snug">
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
