export type Phase = "idle" | "warmup" | "run" | "walk" | "cooldown";

export type TimerMode = "infinite" | "duration" | "sets";

export interface TimerConfig {
  runSec: number;
  walkSec: number;
  warmupSec: number;
  cooldownSec: number;
  mode: TimerMode;
  targetDurationSec?: number;
  targetSets?: number;
}

export interface TimerState {
  phase: Phase;
  remainingSec: number;
  totalElapsedSec: number;
  setsCompleted: number;
  isRunning: boolean;
  isPaused: boolean;
  config: TimerConfig;
}
