import { useCallback } from "react";

export function useVibration() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }, []);

  const vibrateForPhase = useCallback(
    (phase: string) => {
      switch (phase) {
        case "run":
          vibrate([400, 100, 400]);
          break;
        case "walk":
          vibrate([200, 100, 200, 100, 200]);
          break;
        case "warmup":
        case "cooldown":
          vibrate([600]);
          break;
        default:
          vibrate([200]);
      }
    },
    [vibrate]
  );

  const isSupported = typeof navigator !== "undefined" && "vibrate" in navigator;

  return { vibrate, vibrateForPhase, isSupported };
}
