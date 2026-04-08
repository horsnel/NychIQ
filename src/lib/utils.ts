import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* ── Shadcn cn helper ── */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Format large numbers: 1.2M, 45K, etc. ── */
export function fmtV(n: number): string {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

/* ── Relative time ago ── */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

/* ── Viral score classification ── */
export function viralScore(score: number): { label: string; class: string; color: string } {
  if (score >= 80) return { label: 'Viral', class: 'text-green', color: '#00C48C' };
  if (score >= 60) return { label: 'Hot', class: 'text-amber', color: '#F5A623' };
  if (score >= 40) return { label: 'Warm', class: 'text-blue', color: '#4A9EFF' };
  return { label: 'Cold', class: 'text-text-secondary', color: '#888888' };
}

/* ── Score CSS class for Tailwind ── */
export function scoreClass(score: number): string {
  if (score >= 80) return 'score-viral';
  if (score >= 60) return 'score-hot';
  if (score >= 40) return 'score-warm';
  return 'score-cold';
}

/* ── Sanitize text (strip HTML, limit length) ── */
export function sanitizeText(text: string, maxLen: number = 200): string {
  if (!text) return '';
  const stripped = text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  return stripped.length > maxLen ? stripped.slice(0, maxLen) + '...' : stripped;
}

/* ── Debounce utility ── */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ── Format video duration (ISO 8601 → mm:ss or h:mm:ss) ── */
export function vidDuration(iso: string): string {
  if (!iso) return '0:00';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '0:00';
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const sec = parseInt(m[3] || '0', 10);
  if (h > 0) {
    return `${h}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/* ── YouTube thumbnail URL ── */
export function thumbUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const map = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${map[quality]}.jpg`;
}

/* ── Truncate text ── */
export function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

/* ── Copy to clipboard ── */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ── Format percentage ── */
export function fmtPct(n: number): string {
  if (n == null || isNaN(n)) return '0%';
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

/* ── Get initials from name ── */
export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
