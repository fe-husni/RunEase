import type { Phase, TimerConfig } from "@/types/timer";

export interface ActiveTimerSnapshot {
  config: TimerConfig;
  phase: Phase;
  phaseDuration: number;
  phaseStartTime: number;
  startedAt: number;
  setsCompleted: number;
  totalElapsedSec: number;
  isPaused: boolean;
  pausedRemaining: number;
  updatedAt: number;
}

const KEY = "runease:activeTimer";

export function saveActiveTimer(snap: ActiveTimerSnapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(snap));
  } catch {
    // storage penuh / diblokir — abaikan, sesi tetap jalan di memori
  }
}

export function loadActiveTimer(): ActiveTimerSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveTimerSnapshot;
    if (!parsed || !parsed.config || typeof parsed.startedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveTimer(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
