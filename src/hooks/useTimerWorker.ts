import { useEffect, useRef, useCallback } from "react";
import { useTimerStore } from "@/stores/timerStore";
import type { TimerConfig, Phase } from "@/types/timer";
import { saveActiveTimer, clearActiveTimer } from "@/lib/activeTimer";

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
  | { type: "finished" }
  | { type: "stopped" };

export function useTimerWorker() {
  const workerRef = useRef<Worker | null>(null);
  const tick = useTimerStore((s) => s.tick);
  const setPhase = useTimerStore((s) => s.setPhase);
  const setRunning = useTimerStore((s) => s.setRunning);

  // callback for phaseChange (to trigger audio/vibrate)
  const onPhaseChangeRef = useRef<((from: string, to: string) => void) | null>(null);
  // callback for natural finish (target tercapai) — untuk simpan sesi "completed"
  const onFinishedRef = useRef<(() => void) | null>(null);
  const persistRef = useRef<number>(0);

  const setOnPhaseChange = useCallback((cb: (from: string, to: string) => void) => {
    onPhaseChangeRef.current = cb;
  }, []);

  const setOnFinished = useCallback((cb: (() => void) | null) => {
    onFinishedRef.current = cb;
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
        // persist sesi berjalan (throttleniosk: tiap tick 250ms, tulis secukupnya)
        try {
          const st = useTimerStore.getState();
          if (st.isRunning) {
            const now = Date.now();
            const last = (persistRef.current ?? 0);
            if (now - last >= 1000) {
              persistRef.current = now;
              saveActiveTimer({
                config: st.config,
                phase: msg.phase as Phase,
                phaseDuration: msg.phaseDuration,
                phaseStartTime: now - (msg.phaseDuration - msg.remainingSec) * 1000,
                startedAt: st.startedAt ?? now - msg.totalElapsedSec * 1000,
                setsCompleted: msg.setsCompleted,
                totalElapsedSec: msg.totalElapsedSec,
                isPaused: st.isPaused,
                pausedRemaining: st.isPaused ? msg.remainingSec : 0,
                updatedAt: now,
              });
            }
          }
        } catch {
          // ignore persist error
        }
      } else if (msg.type === "phaseChange") {
        // tick already handled next tick, but also notify
        if (onPhaseChangeRef.current) onPhaseChangeRef.current(msg.from, msg.to);
      } else if (msg.type === "started") {
        setPhase(msg.phase as never, msg.remainingSec);
        setRunning(true, false);
      } else if (msg.type === "finished") {
        setRunning(false, false);
        clearActiveTimer();
        if (onFinishedRef.current) onFinishedRef.current();
      } else if (msg.type === "stopped") {
        setRunning(false, false);
        clearActiveTimer();
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
    // persist awal agar reload detik berikutnya bisa resume
    try {
      const now = Date.now();
      persistRef.current = now;
      const st = useTimerStore.getState();
      saveActiveTimer({
        config,
        phase: st.phase,
        phaseDuration: st.phaseDuration,
        phaseStartTime: now,
        startedAt: st.startedAt ?? now,
        setsCompleted: 0,
        totalElapsedSec: 0,
        isPaused: false,
        pausedRemaining: 0,
        updatedAt: now,
      });
    } catch {
      // ignore
    }
  }, []);

  const restore = useCallback((snapshot: Parameters<typeof saveActiveTimer>[0]) => {
    workerRef.current?.postMessage({ type: "restore", snapshot });
    // sinkronkan store agar UI langsung lanjut (worker akan kirim started+tick)
    const st = useTimerStore.getState();
    st.tick({
      phase: snapshot.phase,
      remainingSec: snapshot.isPaused
        ? snapshot.pausedRemaining
        : Math.max(0, snapshot.phaseDuration - Math.floor((Date.now() - snapshot.phaseStartTime) / 1000)),
      totalElapsedSec: snapshot.totalElapsedSec,
      setsCompleted: snapshot.setsCompleted,
      phaseDuration: snapshot.phaseDuration,
    });
    useTimerStore.setState({
      config: snapshot.config,
      isRunning: true,
      isPaused: snapshot.isPaused,
      startedAt: snapshot.startedAt,
    });
  }, []);

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ type: "pause" });
    useTimerStore.getState().pause();
    // persist status paused + sisa waktu agar resume setelah reload tepat
    try {
      const st = useTimerStore.getState();
      const now = Date.now();
      saveActiveTimer({
        config: st.config,
        phase: st.phase,
        phaseDuration: st.phaseDuration,
        phaseStartTime: now - (st.phaseDuration - st.remainingSec) * 1000,
        startedAt: st.startedAt ?? now - st.totalElapsedSec * 1000,
        setsCompleted: st.setsCompleted,
        totalElapsedSec: st.totalElapsedSec,
        isPaused: true,
        pausedRemaining: st.remainingSec,
        updatedAt: now,
      });
    } catch {
      // ignore
    }
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
    clearActiveTimer();
  }, []);

  return { start, restore, pause, resume, skip, stop, setOnPhaseChange, setOnFinished };
}
