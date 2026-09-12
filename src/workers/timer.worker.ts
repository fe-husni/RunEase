import type { TimerConfig, Phase } from "@/types/timer";
import { getNextPhase } from "@/lib/phase";

type WorkerRequest =
  | { type: "start"; config: TimerConfig }
  | { type: "restore"; snapshot: { config: TimerConfig; phase: Phase; phaseDuration: number; phaseStartTime: number; startedAt: number; setsCompleted: number; isPaused: boolean; pausedRemaining: number } }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "skip" }
  | { type: "stop" };

type WorkerResponse =
  | {
      type: "tick";
      phase: Phase;
      remainingSec: number;
      totalElapsedSec: number;
      setsCompleted: number;
      phaseDuration: number;
    }
  | { type: "phaseChange"; from: Phase; to: Phase; setsCompleted: number }
  | { type: "started"; phase: Phase; remainingSec: number }
  | { type: "finished" }
  | { type: "stopped" };

let config: TimerConfig | null = null;
let phase: Phase = "idle";
let phaseDuration = 0;
let phaseStartTime = 0; // Date.now() when current phase started
let startedAt = 0;
let setsCompleted = 0;
let totalElapsedSec = 0;
let isRunning = false;
let isPaused = false;
let pausedRemaining = 0;
let intervalId: number | null = null;

function getPhaseDuration(p: Phase, cfg: TimerConfig): number {
  switch (p) {
    case "warmup":
      return cfg.warmupSec;
    case "run":
      return cfg.runSec;
    case "walk":
      return cfg.walkSec;
    case "cooldown":
      return cfg.cooldownSec;
    default:
      return 0;
  }
}

function clearIntervalIfNeeded() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function sendTick() {
  if (!config || phase === "idle") return;
  const now = Date.now();
  const elapsedInPhase = Math.floor((now - phaseStartTime) / 1000);
  let remaining = phaseDuration - elapsedInPhase;
  if (remaining < 0) remaining = 0;
  totalElapsedSec = Math.floor((now - startedAt) / 1000);

  const response: WorkerResponse = {
    type: "tick",
    phase,
    remainingSec: remaining,
    totalElapsedSec,
    setsCompleted,
    phaseDuration,
  };
  (self as unknown as Worker).postMessage(response);

  if (remaining <= 0) {
    // phase finished, transition
    const from = phase;
    if (from === "walk") setsCompleted += 1;
    const next = getNextPhase(phase, config, setsCompleted);

    if (next === "idle") {
      // selesai alami (target tercapai) — bedakan dari stop manual
      isRunning = false;
      phase = "idle";
      clearIntervalIfNeeded();
      (self as unknown as Worker).postMessage({ type: "finished" } as WorkerResponse);
      return;
    }

    phase = next;
    phaseDuration = getPhaseDuration(phase, config);
    phaseStartTime = now;
    (self as unknown as Worker).postMessage({
      type: "phaseChange",
      from,
      to: phase,
      setsCompleted,
    } as WorkerResponse);
  }
}

function startInterval() {
  clearIntervalIfNeeded();
  // Use 250ms for smooth UI + drift correction via Date.now
  intervalId = self.setInterval(sendTick, 250);
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  switch (msg.type) {
    case "start": {
      config = msg.config;
      phase = config.warmupSec > 0 ? "warmup" : "run";
      phaseDuration = getPhaseDuration(phase, config);
      phaseStartTime = Date.now();
      startedAt = Date.now();
      setsCompleted = 0;
      totalElapsedSec = 0;
      isRunning = true;
      isPaused = false;
      pausedRemaining = 0;
      startInterval();
      (self as unknown as Worker).postMessage({
        type: "started",
        phase,
        remainingSec: phaseDuration,
      } as WorkerResponse);
      // immediate tick
      sendTick();
      break;
    }
    case "restore": {
      config = msg.snapshot.config;
      phase = msg.snapshot.phase;
      phaseDuration = msg.snapshot.phaseDuration;
      startedAt = msg.snapshot.startedAt;
      setsCompleted = msg.snapshot.setsCompleted;
      isRunning = true;
      isPaused = msg.snapshot.isPaused;
      pausedRemaining = msg.snapshot.pausedRemaining;
      if (isPaused) {
        phaseStartTime = msg.snapshot.phaseStartTime;
        (self as unknown as Worker).postMessage({
          type: "started",
          phase,
          remainingSec: pausedRemaining,
        } as WorkerResponse);
        sendTick();
        break;
      }
      // Kejar fase yang terlewat selama tab tertutup (reload / pindah halaman lama)
      let psTime = msg.snapshot.phaseStartTime;
      let guard = 0;
      for (;;) {
        guard += 1;
        if (guard > 500) break; // pengaman loop
        const now = Date.now();
        const elapsed = Math.floor((now - psTime) / 1000);
        const remaining = phaseDuration - elapsed;
        if (remaining > 0) {
          phaseStartTime = psTime;
          break;
        }
        // fase selesai saat tab mati — maju seperti sendTick
        const from = phase;
        if (from === "walk") setsCompleted += 1;
        const next = getNextPhase(phase, config, setsCompleted);
        if (next === "idle") {
          isRunning = false;
          phase = "idle";
          (self as unknown as Worker).postMessage({ type: "finished" } as WorkerResponse);
          return;
        }
        phase = next;
        phaseDuration = getPhaseDuration(phase, config);
        psTime = now;
        (self as unknown as Worker).postMessage({
          type: "phaseChange",
          from,
          to: phase,
          setsCompleted,
        } as WorkerResponse);
      }
      phaseStartTime = psTime;
      startInterval();
      (self as unknown as Worker).postMessage({
        type: "started",
        phase,
        remainingSec: Math.max(0, phaseDuration - Math.floor((Date.now() - phaseStartTime) / 1000)),
      } as WorkerResponse);
      sendTick();
      break;
    }
    case "pause": {
      if (!isRunning || isPaused) break;
      isPaused = true;
      const now = Date.now();
      const elapsedInPhase = Math.floor((now - phaseStartTime) / 1000);
      pausedRemaining = Math.max(0, phaseDuration - elapsedInPhase);
      clearIntervalIfNeeded();
      break;
    }
    case "resume": {
      if (!isRunning || !isPaused) break;
      isPaused = false;
      // recalc phaseStartTime so remaining stays correct
      phaseStartTime = Date.now() - (phaseDuration - pausedRemaining) * 1000;
      startInterval();
      break;
    }
    case "skip": {
      if (!isRunning || !config) break;
      const from = phase;
      if (from === "walk") setsCompleted += 1;
      const next = getNextPhase(phase, config, setsCompleted);
      if (next === "idle") {
        isRunning = false;
        phase = "idle";
        clearIntervalIfNeeded();
        (self as unknown as Worker).postMessage({ type: "finished" } as WorkerResponse);
        break;
      }
      phase = next;
      phaseDuration = getPhaseDuration(phase, config);
      phaseStartTime = Date.now();
      (self as unknown as Worker).postMessage({
        type: "phaseChange",
        from,
        to: phase,
        setsCompleted,
      } as WorkerResponse);
      // immediate tick after skip
      sendTick();
      break;
    }
    case "stop": {
      isRunning = false;
      isPaused = false;
      phase = "idle";
      clearIntervalIfNeeded();
      (self as unknown as Worker).postMessage({ type: "stopped" } as WorkerResponse);
      break;
    }
  }
};

export {};
