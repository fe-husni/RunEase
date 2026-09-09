import { useEffect, useRef, useState, useCallback } from "react";

type WakeLockSentinel = { release: () => Promise<void>; addEventListener: (type: string, cb: () => void) => void };

export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const [isSupported] = useState(() => typeof navigator !== "undefined" && "wakeLock" in navigator);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async () => {
    if (!isSupported || !enabled) return;
    try {
      const sentinel: WakeLockSentinel = await (navigator as unknown as { wakeLock: { request: (s: string) => Promise<WakeLockSentinel> } }).wakeLock.request(
        "screen"
      );
      sentinelRef.current = sentinel;
      setActive(true);
      setError(null);
      sentinel.addEventListener("release", () => {
        setActive(false);
        sentinelRef.current = null;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // NotAllowedError is common if not triggered by user gesture
      if (!msg.includes("NotAllowedError")) setError(msg);
      setActive(false);
    }
  }, [isSupported, enabled]);

  const release = useCallback(async () => {
    try {
      if (sentinelRef.current) {
        await sentinelRef.current.release();
        sentinelRef.current = null;
        setActive(false);
      }
    } catch {
      // ignore
    }
  }, []);

  // handle visibility change — re-request when visible again
  useEffect(() => {
    if (!enabled || !isSupported) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !sentinelRef.current) {
        request();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, isSupported, request]);

  // auto request/release based on enabled
  useEffect(() => {
    if (enabled) request();
    else release();
    return () => {
      release();
    };
  }, [enabled, request, release]);

  return { isSupported, active, error, request, release };
}
