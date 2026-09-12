import { create } from "zustand";
import type { Phase, TimerConfig } from "@/types/timer";
import { sanitizeTargetSets } from "@/lib/phase";

export { MIN_TARGET_SETS, MAX_TARGET_SETS } from "@/lib/phase";
export const DEFAULT_TARGET_SETS = 3;

export interface TimerStoreState {
  phase: Phase;
  remainingSec: number;
  phaseDuration: number;
  totalElapsedSec: number;
  setsCompleted: number;
  isRunning: boolean;
  isPaused: boolean;
  config: TimerConfig;
  startedAt: number | null;
}

interface TimerStoreActions {
  setConfig: (cfg: Partial<TimerConfig>) => void;
  setPhase: (phase: Phase, remainingSec: number) => void;
  setRunning: (running: boolean, paused: boolean) => void;
  tick: (payload: { phase: Phase; remainingSec: number; totalElapsedSec: number; setsCompleted: number; phaseDuration: number }) => void;
  start: (config?: TimerConfig) => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  stop: () => void;
  reset: () => void;
}

const defaultConfig: TimerConfig = {
  runSec: 120,
  walkSec: 60,
  warmupSec: 0,
  cooldownSec: 0,
  mode: "infinite",
  targetSets: undefined,
};

function getInitialRemaining(cfg: TimerConfig): { phase: Phase; remaining: number } {
  if (cfg.warmupSec > 0) return { phase: "warmup", remaining: cfg.warmupSec };
  return { phase: "run", remaining: cfg.runSec };
}

export const useTimerStore = create<TimerStoreState & TimerStoreActions>((set, get) => ({
  phase: "idle",
  remainingSec: defaultConfig.runSec,
  phaseDuration: defaultConfig.runSec,
  totalElapsedSec: 0,
  setsCompleted: 0,
  isRunning: false,
  isPaused: false,
  config: defaultConfig,
  startedAt: null,

  setConfig: (partial) => {
    const current = get();
    if (current.isRunning) return; // don't allow change while running
    const nextConfig = { ...current.config, ...partial };
    // validation: run/walk >=10
    if (nextConfig.runSec < 10) nextConfig.runSec = 10;
    if (nextConfig.walkSec < 10) nextConfig.walkSec = 10;
    if (nextConfig.warmupSec < 0) nextConfig.warmupSec = 0;
    if (nextConfig.cooldownSec < 0) nextConfig.cooldownSec = 0;
    if (nextConfig.warmupSec > 600) nextConfig.warmupSec = 600;
    if (nextConfig.cooldownSec > 600) nextConfig.cooldownSec = 600;
    if (nextConfig.runSec > 600) nextConfig.runSec = 600;
    if (nextConfig.walkSec > 600) nextConfig.walkSec = 600;
    // mode target: targetSets wajib 1-50, else fallback; mode bebas = undefined
    if (nextConfig.mode !== "sets") {
      nextConfig.targetSets = undefined;
    } else {
      nextConfig.targetSets = sanitizeTargetSets(nextConfig.targetSets, DEFAULT_TARGET_SETS);
    }

    const { remaining } = getInitialRemaining(nextConfig);
    set({
      config: nextConfig,
      // Selalu refresh preview display saat tidak running (setConfig sudah
      // early-return saat isRunning). Phase dipertahankan "idle" sebagai status
      // preview agar tiap klik preset / edit manual langsung tercermin di <h1>.
      phase: "idle",
      remainingSec: remaining,
      phaseDuration: remaining,
    });
  },

  setPhase: (phase, remainingSec) => set({ phase, remainingSec, phaseDuration: remainingSec }),

  setRunning: (isRunning, isPaused) => set({ isRunning, isPaused }),

  tick: ({ phase, remainingSec, totalElapsedSec, setsCompleted, phaseDuration }) =>
    set({ phase, remainingSec, totalElapsedSec, setsCompleted, phaseDuration }),

  start: (config) => {
    const cfg = config ?? get().config;
    const { phase, remaining } = getInitialRemaining(cfg);
    set({
      config: cfg,
      phase,
      remainingSec: remaining,
      phaseDuration: remaining,
      totalElapsedSec: 0,
      setsCompleted: 0,
      isRunning: true,
      isPaused: false,
      startedAt: Date.now(),
    });
  },

  pause: () => {
    if (!get().isRunning || get().isPaused) return;
    set({ isPaused: true });
  },

  resume: () => {
    if (!get().isRunning || !get().isPaused) return;
    set({ isPaused: false });
  },

  skip: () => {
    // This is a request — actual phase change is handled by worker
    // Store just marks that skip was requested; worker will handle.
    // For now, we don't mutate here; worker will send next tick.
  },

  stop: () => {
    const remaining = getInitialRemaining(get().config).remaining;
    set({
      isRunning: false,
      isPaused: false,
      phase: "idle",
      remainingSec: remaining,
      phaseDuration: remaining,
    });
  },

  reset: () => {
    const cfg = get().config;
    const { remaining } = getInitialRemaining(cfg);
    set({
      phase: "idle",
      remainingSec: remaining,
      phaseDuration: remaining,
      totalElapsedSec: 0,
      setsCompleted: 0,
      isRunning: false,
      isPaused: false,
      startedAt: null,
    });
  },
}));

// helper for formatting
export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getPhaseLabel(phase: Phase): string {
  switch (phase) {
    case "warmup":
      return "WARMUP";
    case "run":
      return "LARI";
    case "walk":
      return "JALAN";
    case "cooldown":
      return "COOLDOWN";
    default:
      return "SIAP";
  }
}

export function getPhaseColor(phase: Phase): string {
  switch (phase) {
    case "warmup":
      return "bg-bauhaus-yellow text-bauhaus-black";
    case "run":
      return "bg-bauhaus-red text-white";
    case "walk":
      return "bg-bauhaus-blue text-white";
    case "cooldown":
      return "bg-bauhaus-yellow text-bauhaus-black";
    default:
      return "bg-white text-bauhaus-black";
  }
}
