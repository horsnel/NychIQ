'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Activity, Cpu, Target, Play, ChevronRight, FileText, Tag, Key, Copy } from 'lucide-react';
import { cn, thumbUrl, vidDuration, fmtV, copyToClipboard } from '@/lib/utils';
import { useNychIQStore } from '@/lib/store';
import { showToast } from '@/lib/toast';

/* ══════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════ */

export interface SciFiVideoData {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount?: number;
  likeCount?: number;
  duration?: string;
  viralScore?: number;
  thumbnail?: string;
  publishedAt?: string;
}

interface SciFiVideoCardProps {
  video: SciFiVideoData;
  showAnalysis?: boolean;
  onClick?: (video: SciFiVideoData) => void;
  className?: string;
}

/* ══════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════ */

/** Pulsing green "live" indicator dot */
function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#888888] opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#888888]" />
    </span>
  );
}

/** Tiny waveform bars icon for retention display */
function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" fill="none" className={cn('w-4 h-4', className)} aria-hidden="true">
      <rect x="1"  y="5"  width="2" height="6"  rx="1" fill="currentColor" opacity="0.5" />
      <rect x="5"  y="2"  width="2" height="12" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="9"  y="4"  width="2" height="8"  rx="1" fill="currentColor" />
      <rect x="13" y="1"  width="2" height="14" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="17" y="5"  width="2" height="6"  rx="1" fill="currentColor" opacity="0.8" />
      <rect x="21" y="3"  width="2" height="10" rx="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** Signal score that flickers for 2 s then settles */
function SignalScore({ score }: { score: number }) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <span
      className="font-mono text-xs tabular-nums"
      style={!settled ? { animation: 'flickerDigit 0.4s steps(1) infinite' } : undefined}
    >
      {score}
    </span>
  );
}

/** Faint grid overlay drawn with CSS gradients */
function GridOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(253,186,45,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(253,186,45,0.3) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    />
  );
}

/* ── Overlay button: HookLab Pulse (top-left) ── */

function HookLabButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div
      className="absolute top-2 left-2 z-20"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <button
        onClick={onClick}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-[#FDBA2D]/30 hover:border-[#FDBA2D]/70 transition-all duration-300"
        style={{ '--glow-color': 'rgba(253,186,45,0.4)' } as React.CSSProperties}
        aria-label="HookLab Pulse — Retention Scan"
      >
        {/* Pulse ring */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}
        />
        <Activity className="w-4 h-4 text-[#FDBA2D]" />

        {showTip && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded bg-[#1A1A1A] border border-[#FDBA2D]/30 text-[11px] text-[#FFFFFF] whitespace-nowrap pointer-events-none shadow-lg shadow-black/40 z-30">
            Retention Scanned: <span className="text-[#888888] font-mono font-semibold">87%</span>{' '}
            predicted retention
          </div>
        )}
      </button>
    </div>
  );
}

/* ── Overlay button: Extraction Hub (top-right) ── */

function ExtractionHubButton({ onNavigate, videoTitle, videoId }: { onNavigate: (tool: string) => void; videoTitle: string; videoId: string }) {
  const [expanded, setExpanded] = useState(false);

  const handleCopyTitle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(videoTitle);
    if (ok) {
      showToast('Title copied to clipboard', 'success');
    } else {
      showToast('Failed to copy title', 'error');
    }
  }, [videoTitle]);

  const handleCopyVideoId = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(videoId);
    if (ok) {
      showToast('Video ID copied to clipboard', 'success');
    } else {
      showToast('Failed to copy video ID', 'error');
    }
  }, [videoId]);

  return (
    <div
      className="absolute top-2 right-2 z-20"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <button
        className="flex items-center justify-center w-8 h-8 rounded-md bg-black/60 backdrop-blur-sm border border-[#888888]/30 hover:border-[#888888]/70 transition-all duration-300 hover:scale-110"
        aria-label="Extraction Hub"
      >
        <Cpu className="w-4 h-4 text-[#888888]" />
      </button>

      {/* Mini-panel on hover */}
      {expanded && (
        <div className="absolute right-0 top-full mt-1.5 p-1.5 rounded-lg bg-[#0f0f0f]/95 backdrop-blur-md border border-[rgba(255,255,255,0.03)] shadow-xl shadow-black/50 flex flex-col gap-1 z-30 animate-fade-in-up">
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('deepchat'); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#888888]" />
            Transcript
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('keywords'); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-[#FDBA2D]" />
            Tags
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('keywords'); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-[#888888]" />
            Keywords
          </button>
          <button
            onClick={handleCopyTitle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-[#888888]" />
            Copy Title
          </button>
          <button
            onClick={handleCopyVideoId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-[#888888]" />
            Copy Video ID
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Overlay button: Smart Copy (bottom-right) ── */

function SmartCopyButton({ videoUrl }: { videoUrl: string }) {
  const [glitch, setGlitch] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(videoUrl);
    if (ok) {
      setGlitch(true);
      showToast('URL copied to clipboard', 'success');
      setTimeout(() => setGlitch(false), 800);
    } else {
      showToast('Failed to copy URL', 'error');
    }
  }, [videoUrl]);

  return (
    <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5">
      {glitch && (
        <span
          className="text-[9px] font-mono font-bold text-[#888888] tracking-wider"
          style={{ animation: 'glitchText 0.3s steps(1) forwards' }}
        >
          DATA TRANSFERRED
        </span>
      )}
      <button
        onClick={handleCopy}
        className="flex items-center justify-center w-7 h-7 rounded-md bg-black/60 backdrop-blur-sm border border-[#666666]/50 hover:border-[#888888]/70 transition-all duration-200"
        aria-label="Copy video URL"
      >
        <Target className="w-3.5 h-3.5 text-[#a0a0a0] hover:text-[#888888]" />
      </button>
    </div>
  );
}

/* ── Deep Analysis Teaser ── */

function AnalysisTeaser({ viralPoints, onNavigate }: { viralPoints: number; onNavigate: () => void }) {
  const [visible, setVisible] = useState(false);
  const [chars, setChars] = useState(0);

  const fullText = useMemo(
    () => `SCAN COMPLETE: ${viralPoints} Viral Points Detected. View Tactical Breakdown \u2192`,
    [viralPoints]
  );

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible || chars >= fullText.length) return;
    const t = setTimeout(() => setChars((c) => c + 1), 18);
    return () => clearTimeout(t);
  }, [visible, chars, fullText.length]);

  if (!visible) return null;

  const linkStart = fullText.indexOf('View Tactical Breakdown');

  return (
    <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.03)]/60">
      <p className="text-[10px] font-mono text-[#666666] leading-relaxed select-none">
        {chars <= linkStart ? (
          fullText.slice(0, chars)
        ) : (
          <>
            {fullText.slice(0, linkStart)}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onNavigate(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(); }}
              className="text-[#FDBA2D]/80 hover:text-[#FDBA2D] cursor-pointer transition-colors underline decoration-[#FDBA2D]/30 hover:decoration-[#FDBA2D]/60"
            >
              {fullText.slice(linkStart, chars)}
            </span>
          </>
        )}
        {chars < fullText.length && (
          <span className="inline-block w-[6px] h-[10px] bg-[#FDBA2D]/60 ml-[1px] animate-pulse align-middle" />
        )}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT — SciFiVideoCard
   ══════════════════════════════════════════════════════════ */

export function SciFiVideoCard({
  video,
  showAnalysis = true,
  onClick,
  className,
}: SciFiVideoCardProps) {
  const [thumbHover, setThumbHover] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { setActiveTool, setPage } = useNychIQStore();
  const youtubeUrl = `https://youtube.com/watch?v=${video.videoId}`;

  /* Deterministic viral points & coordinates from videoId */
  const viralPoints = useMemo(() => {
    const h = video.videoId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return (h % 13) + 8; // 8–20
  }, [video.videoId]);

  const cornerCoords = useMemo(() => {
    const h = video.videoId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const lat = ((h * 7.3) % 180 - 90).toFixed(2);
    const lon = ((h * 13.7) % 360 - 180).toFixed(2);
    return `[${lat}, ${lon}]`;
  }, [video.videoId]);

  const retentionProb = useMemo(() => {
    const h = video.videoId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return (h % 20) + 75; // 75–94%
  }, [video.videoId]);

  /* Navigation helper */
  const goTo = useCallback((tool: string) => {
    setActiveTool(tool);
    setPage('app');
  }, [setActiveTool, setPage]);

  const handleClick = () => {
    if (onClick) { onClick(video); } else { window.open(youtubeUrl, '_blank', 'noopener'); }
  };

  return (
    <div
      className={cn(
        'group cursor-pointer rounded-lg overflow-hidden bg-[#0f0f0f] relative',
        'transition-all duration-300',
        'hover:-translate-y-[2px]',
        /* Gradient top accent edge */
        'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:z-30',
        'before:bg-gradient-to-r before:from-[#888888] before:via-[#FDBA2D] before:to-transparent',
        className
      )}
      style={thumbHover
        ? { boxShadow: '0 0 20px rgba(253,186,45,0.12), 0 8px 24px rgba(0,0,0,0.4)' }
        : { boxShadow: '0 0 0 transparent' }
      }
      onClick={handleClick}
      onMouseEnter={() => setThumbHover(true)}
      onMouseLeave={() => setThumbHover(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      {/* ── Breathing border on hover ── */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg pointer-events-none z-10 transition-opacity duration-500',
          thumbHover ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          border: '1px solid rgba(253,186,45,0.25)',
          borderRadius: 'inherit',
          animation: thumbHover ? 'breathe 2.5s ease-in-out infinite' : 'none',
        }}
      />

      {/* ════ Thumbnail ════ */}
      <div className="relative aspect-video bg-[#1A1A1A] overflow-hidden">
        {/* Image */}
        {!imgError ? (
          <img
            src={video.thumbnail || thumbUrl(video.videoId)}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
            <Play className="w-8 h-8 text-[#444]" />
          </div>
        )}

        {/* Grid overlay */}
        <GridOverlay />

        {/* Scan line — visible on hover only */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-300',
            thumbHover ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className="absolute left-0 right-0 h-[2px] z-20"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(253,186,45,0.05) 10%, rgba(253,186,45,0.8) 50%, rgba(253,186,45,0.05) 90%, transparent 100%)',
              boxShadow: '0 0 8px rgba(253,186,45,0.5), 0 0 20px rgba(253,186,45,0.2)',
              animation: 'scanLineMove 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Corner coordinates — top-right */}
        <span
          className="absolute top-2 right-2 z-[15] font-mono text-[9px] text-[#FDBA2D]/50 tracking-wider pointer-events-none select-none"
          style={{ textShadow: '0 0 4px rgba(253,186,45,0.3)' }}
        >
          {cornerCoords}
        </span>

        {/* Duration badge — bottom-left */}
        {video.duration && (
          <span className="absolute bottom-2 left-2 z-[15] px-1.5 py-0.5 text-[10px] font-mono font-medium bg-black/80 rounded text-white/90 backdrop-blur-sm">
            {vidDuration(video.duration)}
          </span>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-[#FDBA2D]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-lg shadow-[#FDBA2D]/20">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Viral score badge */}
        {video.viralScore != null && video.viralScore >= 70 && (
          <span className="absolute bottom-2 left-2 z-[15] ml-14 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-[10px] font-bold">
            {video.viralScore >= 85 ? (
              <><span>🔥</span><span className="text-[#888888]">VIRAL</span></>
            ) : (
              <><span>⚡</span><span className="text-[#FDBA2D]">HOT</span></>
            )}
            <span className="font-mono text-white/80 ml-0.5">{video.viralScore}</span>
          </span>
        )}

        {/* ── Three overlay buttons ── */}
        <HookLabButton onClick={(e) => { e.stopPropagation(); goTo('hooklab'); }} />
        <ExtractionHubButton onNavigate={goTo} videoTitle={video.title} videoId={video.videoId} />
        <SmartCopyButton videoUrl={youtubeUrl} />
      </div>

      {/* ════ Info Section ════ */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-sm font-medium text-[#FFFFFF] line-clamp-2 group-hover:text-[#FDBA2D] transition-colors duration-200 leading-snug">
          {video.title}
        </h3>

        {/* Channel */}
        <p className="text-xs text-[#a0a0a0] mt-1.5">{video.channelTitle}</p>

        {/* Live metadata row */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {/* Views with pulsing green dot */}
          {video.viewCount != null && (
            <div className="flex items-center gap-1.5">
              <LiveDot />
              <span className="text-[11px] font-mono text-[#888888] tabular-nums">
                {fmtV(video.viewCount)}
              </span>
            </div>
          )}

          {/* Signal score with flicker */}
          {video.viralScore != null && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#666666] uppercase tracking-wider">SIG</span>
              <SignalScore score={video.viralScore} />
            </div>
          )}

          {/* Retention waveform */}
          <div className="flex items-center gap-1">
            <WaveformIcon className="text-[#FDBA2D]/60" />
            <span className="text-[11px] font-mono text-[#a0a0a0] tabular-nums">
              {retentionProb}%
            </span>
          </div>
        </div>

        {/* Deep analysis teaser */}
        {showAnalysis && (
          <AnalysisTeaser viralPoints={viralPoints} onNavigate={() => goTo('studio')} />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Skeleton
   ══════════════════════════════════════════════════════════ */

export function SciFiVideoCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] animate-pulse">
      <div className="h-[2px] bg-gradient-to-r from-[#888888] via-[#FDBA2D] to-transparent opacity-40" />
      <div className="aspect-video bg-[#1A1A1A]" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#1A1A1A] rounded w-full" />
        <div className="h-3 bg-[#1A1A1A] rounded w-3/4" />
        <div className="flex items-center gap-3">
          <div className="h-3 bg-[#1A1A1A] rounded w-16" />
          <div className="h-3 bg-[#1A1A1A] rounded w-12" />
          <div className="h-3 bg-[#1A1A1A] rounded w-14" />
        </div>
      </div>
    </div>
  );
}
