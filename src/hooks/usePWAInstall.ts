import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setDeferred(null);
      setCanInstall(false);
      localStorage.setItem("runease:pwaInstalled", "1");
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const prompt = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setDeferred(null);
      setCanInstall(false);
      localStorage.setItem("runease:pwaInstalled", "1");
      // analytics log (fire-and-forget, tidak boleh crash install flow)
      try {
        const { track } = await import("@/lib/analytics");
        track("pwa_installed");
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  }, [deferred]);

  const [sessionCount, setSessionCount] = useState(() => {
    try {
      const raw = localStorage.getItem("runease:installSessions");
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  });

  const shouldShowBanner = (() => {
    if (isStandalone) return false;
    if (localStorage.getItem("runease:pwaInstalled") === "1") return false;
    if (localStorage.getItem("runease:pwaDismissed") === "1") return false;
    if (sessionCount < 2 && !isIOS) return false;
    return canInstall || isIOS;
  })();

  const dismiss = useCallback(() => {
    localStorage.setItem("runease:pwaDismissed", "1");
    setCanInstall(false);
  }, []);

  const incrementSessionCount = useCallback(() => {
    try {
      const raw = localStorage.getItem("runease:installSessions");
      const n = raw ? parseInt(raw, 10) : 0;
      const next = n + 1;
      localStorage.setItem("runease:installSessions", String(next));
      setSessionCount(next);
    } catch {
      // ignore
    }
  }, []);

  return { deferred, isIOS, isStandalone, canInstall, shouldShowBanner, prompt, dismiss, incrementSessionCount };
}
