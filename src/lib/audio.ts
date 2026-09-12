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

function playOscillator(freq: number, durationMs: number, volume: number, type: OscillatorType = "sine", delayMs = 0) {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    // fire-and-forget di sini (panggil ensureAudio() dari user gesture saat Start agar sudah resumed)
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  // envelope: quick attack, sustain, release — dijadwalkan di AudioContext time
  // (bukan setTimeout) agar tetap akurat saat tab ter-throttle / layar terkunci.
  const t0 = ctx.currentTime + delayMs / 1000;
  const dur = durationMs / 1000;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.setValueAtTime(volume, t0 + Math.max(0.02, dur - 0.05));
  gain.gain.linearRampToValueAtTime(0, t0 + dur);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function updateMediaSession(action: string) {
  try {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: action === "run" ? "RunEase — LARI!" : action === "walk" ? "RunEase — JALAN" : "RunEase Timer",
        artist: "RunEase",
        album: "Run-Walk Interval",
      });
    }
  } catch {
    // ignore — MediaSession opsional, hanya untuk pegang audio focus saat lock
  }
}

export function playRunSound(volumePct: number) {
  const v = Math.max(0, Math.min(1, volumePct / 100));
  updateMediaSession("run");
  // Run: double beep 800Hz + 1000Hz — dijadwalkan sekaligus, tanpa setTimeout
  playOscillator(800, 250, v * 0.6, "square", 0);
  playOscillator(1000, 250, v * 0.6, "square", 300);
}

export function playWalkSound(volumePct: number) {
  const v = Math.max(0, Math.min(1, volumePct / 100));
  updateMediaSession("walk");
  // Walk: single beep 600Hz
  playOscillator(600, 400, v * 0.5, "sine");
}

export function playWarmupSound(volumePct: number) {
  const v = Math.max(0, Math.min(1, volumePct / 100));
  updateMediaSession("warmup");
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
