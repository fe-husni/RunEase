let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

export async function ensureAudio(): Promise<AudioContext | null> {
  const ctx = getContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // ignore
    }
  }
  return ctx;
}

function playOscillator(freq: number, durationMs: number, volume: number, type: OscillatorType = "sine") {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  // envelope: quick attack, sustain, release
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.setValueAtTime(volume, now + durationMs / 1000 - 0.05);
  gain.gain.linearRampToValueAtTime(0, now + durationMs / 1000);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.05);
}

export function playRunSound(volumePct: number) {
  const v = Math.max(0, Math.min(1, volumePct / 100));
  // Run: double beep 800Hz + 1000Hz
  playOscillator(800, 250, v * 0.6, "square");
  setTimeout(() => playOscillator(1000, 250, v * 0.6, "square"), 300);
}

export function playWalkSound(volumePct: number) {
  const v = Math.max(0, Math.min(1, volumePct / 100));
  // Walk: single beep 600Hz
  playOscillator(600, 400, v * 0.5, "sine");
}

export function playWarmupSound(volumePct: number) {
  const v = Math.max(0, Math.min(1, volumePct / 100));
  playOscillator(500, 600, v * 0.5, "sine");
}

export function playBeep(volumePct: number, freq = 800) {
  const v = Math.max(0, Math.min(1, volumePct / 100));
  playOscillator(freq, 200, v * 0.6, "square");
}

export function playVoice(text: string, volumePct: number) {
  const v = Math.max(0, Math.min(1, volumePct / 100));
  if (!("speechSynthesis" in window)) {
    playBeep(volumePct);
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.volume = v;
    utter.rate = 1.1;
    utter.lang = "id-ID";
    window.speechSynthesis.speak(utter);
  } catch {
    playBeep(volumePct);
  }
}

export async function testSound(soundId: string, volumePct: number) {
  await ensureAudio();
  switch (soundId) {
    case "beep":
      playRunSound(volumePct);
      break;
    case "bell":
      playWalkSound(volumePct);
      break;
    case "voice":
      playVoice("Tes suara", volumePct);
      break;
    default:
      playBeep(volumePct);
  }
}
