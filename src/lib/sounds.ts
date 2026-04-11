/* ── NychIQ Sound System ──
 * Uses Web Audio API to generate UI sounds without external audio files.
 * All sounds are synthesized in real-time.
 */

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/* ── Ensure audio context is resumed (browsers require user gesture) ── */
export function initAudio(): void {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch {
    // Audio not available
  }
}

/* ── Play a tone with optional envelope ── */
function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1, delay: number = 0): void {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {
    // Silently fail
  }
}

/* ── UI Click sound — short, crisp tap ── */
export function playClick(): void {
  playTone(800, 0.05, 'sine', 0.06);
}

/* ── Notification sound — pleasant two-tone chime ── */
export function playNotification(): void {
  playTone(880, 0.15, 'sine', 0.1, 0);
  playTone(1100, 0.2, 'sine', 0.1, 0.12);
}

/* ── Success sound — ascending three-note arpeggio ── */
export function playSuccess(): void {
  playTone(523, 0.12, 'sine', 0.08, 0);       // C5
  playTone(659, 0.12, 'sine', 0.08, 0.1);      // E5
  playTone(784, 0.2, 'sine', 0.1, 0.2);        // G5
}

/* ── Error sound — descending two-tone buzz ── */
export function playError(): void {
  playTone(300, 0.15, 'square', 0.06, 0);
  playTone(220, 0.2, 'square', 0.06, 0.12);
}

/* ── Token spend sound — coin-like ding ── */
export function playTokenSpend(): void {
  playTone(1200, 0.08, 'sine', 0.07, 0);
  playTone(900, 0.12, 'sine', 0.05, 0.06);
}

/* ── Token warning sound — two low tones ── */
export function playTokenWarning(): void {
  playTone(440, 0.2, 'triangle', 0.08, 0);
  playTone(330, 0.3, 'triangle', 0.08, 0.18);
}

/* ── Token exhausted sound — alarm-like triple beep ── */
export function playTokenExhausted(): void {
  playTone(400, 0.15, 'square', 0.06, 0);
  playTone(400, 0.15, 'square', 0.06, 0.2);
  playTone(300, 0.3, 'square', 0.08, 0.4);
}

/* ── Navigation sound — soft swoosh ── */
export function playNav(): void {
  playTone(600, 0.06, 'sine', 0.04, 0);
  playTone(700, 0.06, 'sine', 0.04, 0.04);
}

/* ── Upgrade chime — pleasant ascending ── */
export function playUpgrade(): void {
  playTone(523, 0.1, 'sine', 0.08, 0);
  playTone(659, 0.1, 'sine', 0.08, 0.08);
  playTone(784, 0.1, 'sine', 0.08, 0.16);
  playTone(1047, 0.25, 'sine', 0.1, 0.24);
}
