/**
 * Optional soft UI sounds, OFF by default. Synthesised with the Web Audio
 * API (no audio files). The AudioContext is created only after the visitor
 * turns sound on (a user gesture), so nothing ever autoplays.
 */
const KEY = 'am-sound';
let ctx: AudioContext | null = null;
let enabled = false;
let lastHover = 0;

function blip(freq: number, endFreq: number, ms: number, gain: number, type: OscillatorType) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + ms / 1000);
  // Quick attack, soft exponential release = a gentle "tick", not a beep.
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.02);
}

const hoverSound = () => {
  const now = performance.now();
  if (now - lastHover < 70) return; // throttle when sweeping across links
  lastHover = now;
  blip(1900, 1300, 45, 0.018, 'sine');
};
const pressSound = () => blip(560, 320, 110, 0.05, 'triangle');

function readSaved(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

export function initSound() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-sound-toggle]');
  if (!toggle) return;
  const stateText = toggle.querySelector<HTMLElement>('[data-sound-state]');

  const render = () => {
    toggle.setAttribute('aria-pressed', String(enabled));
    if (stateText) stateText.textContent = enabled ? 'on' : 'off';
  };

  // A saved "on" still waits for the first click anywhere before the
  // AudioContext starts (browsers require a gesture).
  enabled = readSaved();
  render();
  toggle.hidden = false;

  const ensureContext = () => {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  };

  toggle.addEventListener('click', () => {
    enabled = !enabled;
    try {
      localStorage.setItem(KEY, enabled ? 'on' : 'off');
    } catch {
      /* private mode: preference just won't persist */
    }
    if (enabled) ensureContext();
    render();
  });

  const INTERACTIVE = 'a, button, [role="button"]';
  document.addEventListener('pointerover', (e) => {
    if (!enabled || !ctx) return;
    const el = (e.target as Element).closest(INTERACTIVE);
    if (el && !el.contains(e.relatedTarget as Node)) hoverSound();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!enabled) return;
    ensureContext();
    if ((e.target as Element).closest(INTERACTIVE)) pressSound();
  });
}
