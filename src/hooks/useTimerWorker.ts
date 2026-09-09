import { useEffect, useRef, useCallback } from "react";
import { useTimerStore } from "@/stores/timerStore";
import type { TimerConfig } from "@/types/timer";

type WorkerResponse =
  | {
      type: "tick";
      phase: string;
      remainingSec: number;
      totalElapsedSec: number;
      setsCompleted: number;
      phaseDuration: number;
    }
  | { type: "phaseChange"; from: string; to: string; setsCompleted: number }
  | { type: "started"; phase: string; remainingSec: number }
  | { type: "stopped" };

export function useTimerWorker() {
  const workerRef = useRef<Worker | null>(null);
  const tick = useTimerStore((s) => s.tick);
  const setPhase = useTimerStore((s) => s.setPhase);
  const setRunning = useTimerStore((s) => s.setRunning);

  // callback for phaseChange (to trigger audio/vibrate)
  const onPhaseChangeRef = useRef<((from: string, to: string) => void) | null>(null);

  const setOnPhaseChange = useCallback((cb: (from: string, to: string) => void) => {
    onPhaseChangeRef.current = cb;
  }, []);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/timer.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === "tick") {
        tick({
          phase: msg.phase as never,
          remainingSec: msg.remainingSec,
          totalElapsedSec: msg.totalElapsedSec,
          setsCompleted: msg.setsCompleted,
          phaseDuration: msg.phaseDuration,
        });
      } else if (msg.type === "phaseChange") {
        // tick already handled next tick, but also notify
        if (onPhaseChangeRef.current) onPhaseChangeRef.current(msg.from, msg.to);
      } else if (msg.type === "started") {
        setPhase(msg.phase as never, msg.remainingSec);
        setRunning(true, false);
      } else if (msg.type === "stopped") {
        setRunning(false, false);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [tick, setPhase, setRunning]);

  const start = useCallback((config: TimerConfig) => {
    workerRef.current?.postMessage({ type: "start", config });
    // also update store immediately for UI responsiveness
    const { start: storeStart } = useTimerStore.getState();
    storeStart(config);
  }, []);

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ type: "pause" });
    useTimerStore.getState().pause();
  }, []);

  const resume = useCallback(() => {
    workerRef.current?.postMessage({ type: "resume" });
    useTimerStore.getState().resume();
  }, []);

  const skip = useCallback(() => {
    workerRef.current?.postMessage({ type: "skip" });
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: "stop" });
    useTimerStore.getState().stop();
  }, []);

  return { start, pause, resume, skip, stop, setOnPhaseChange };
}
