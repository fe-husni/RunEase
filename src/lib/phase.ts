import type { Phase, TimerConfig } from "@/types/timer";

export const MIN_TARGET_SETS = 1;
export const MAX_TARGET_SETS = 50;

/**
 * Target set yang valid, atau null = mode bebas (infinite).
 * 1 set = 1x lari + 1x jalan (setsCompleted naik tiap fase walk selesai).
 */
export function targetSetsOf(cfg: TimerConfig): number | null {
  if (cfg.mode !== "sets") return null;
  const t = cfg.targetSets;
  if (typeof t !== "number" || !Number.isInteger(t) || t < MIN_TARGET_SETS || t > MAX_TARGET_SETS) return null;
  return t;
}

/**
 * Fase berikutnya. `setsDone` = setsCompleted SETELAH increment fase walk
 * yang baru selesai (panggil dengan nilai terbaru).
 * Mode Target: setelah walk set terakhir → cooldown (bila >0) else selesai (idle).
 * Mode Bebas: loop run↔walk selamanya, cooldown tidak pernah auto-masuk.
 */
export function getNextPhase(current: Phase, cfg: TimerConfig, setsDone: number): Phase {
  if (current === "warmup") return "run";
  if (current === "run") return "walk";
  if (current === "walk") {
    const target = targetSetsOf(cfg);
    if (target !== null && setsDone >= target) {
      return cfg.cooldownSec > 0 ? "cooldown" : "idle";
    }
    return "run";
  }
  if (current === "cooldown") return "idle";
  return "run";
}

/** Samakan targetSets mentah dari input UI menjadi nilai valid 1-50. */
export function sanitizeTargetSets(t: unknown, fallback = 3): number {
  if (typeof t === "number" && Number.isInteger(t)) {
    return Math.max(MIN_TARGET_SETS, Math.min(MAX_TARGET_SETS, t));
  }
  return fallback;
}
