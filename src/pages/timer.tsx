import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { useTimerStore, formatTime, DEFAULT_TARGET_SETS, MIN_TARGET_SETS, MAX_TARGET_SETS } from "@/stores/timerStore";
import { useTimerWorker } from "@/hooks/useTimerWorker";
import { useVibration } from "@/hooks/useVibration";
import { useWakeLock } from "@/hooks/useWakeLock";
import { ensureAudio, playRunSound, playWalkSound, playWarmupSound } from "@/lib/audio";
import { loadActiveTimer, clearActiveTimer } from "@/lib/activeTimer";
import { notifyViaSW } from "@/lib/notifications";
import { TimerDisplay } from "@/components/timer/timer-display";
import { TimerControls } from "@/components/timer/timer-controls";
import { TimeInput } from "@/components/timer/time-input";
import { PresetChips, builtinPresets } from "@/components/timer/preset-chips";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PresetDoc } from "@/types/preset";
import { Clock, Settings2, Volume2, Minus, Plus } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { useSessionStore } from "@/stores/sessionStore";
import { usePresetStore } from "@/stores/presetStore";
import { MAX_CUSTOM_PRESETS } from "@/lib/presets";
import { saveSession } from "@/lib/session";
import { updateUserAfterSession, evaluateAndAwardBadges, buildBadgeContext } from "@/lib/userStats";
import { getBadgeDef } from "@/lib/badges";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { track } from "@/lib/analytics";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { fetchSettings, defaultSettings } from "@/lib/settings";
import type { SessionDoc } from "@/types/session";
import type { SessionStatus } from "@/types/session";

export default function TimerPage() {
  const { phase, remainingSec, phaseDuration, totalElapsedSec, setsCompleted, isRunning, isPaused, config, setConfig, startedAt } = useTimerStore();
  const { start, restore, pause, resume, skip, stop, setOnPhaseChange, setOnFinished } = useTimerWorker();
  const { vibrateForPhase } = useVibration();
  const user = useUserStore((s) => s.user);
  const { sessions, addLocal } = useSessionStore();
  const customs = usePresetStore((s) => s.customs);
  const fetchCustoms = usePresetStore((s) => s.fetch);
  const addCustom = usePresetStore((s) => s.add);
  const activePresetId = usePresetStore((s) => s.activePresetId);
  const setActivePresetId = usePresetStore((s) => s.setActive);
  const presetsLoading = usePresetStore((s) => s.loading);
  const allPresets = useMemo(() => [...builtinPresets, ...customs], [customs]);
  // #5: estimasi total aktivitas — 1 set = 1x lari + 1x jalan (lihat phase.ts)
  const estimate = useMemo(() => {
    const sets = config.targetSets ?? DEFAULT_TARGET_SETS;
    const perSet = config.runSec + config.walkSec;
    if (config.mode !== "sets") {
      return { label: `1 set ≈ ${formatTime(perSet)}`, detail: `${formatTime(config.runSec)} + ${formatTime(config.walkSec)}` };
    }
    const totalSec = config.warmupSec + sets * perSet + config.cooldownSec;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const totalLabel = mins > 0 ? `≈ ${mins} mnt${secs > 0 ? ` ${secs} dtk` : ""}` : `≈ ${secs} dtk`;
    return {
      label: `${totalLabel} • ${sets} set`,
      detail: `${sets}×(${formatTime(config.runSec)}+${formatTime(config.walkSec)})${config.warmupSec > 0 ? ` + W${formatTime(config.warmupSec)}` : ""}${config.cooldownSec > 0 ? ` + C${formatTime(config.cooldownSec)}` : ""}`,
      totalSec,
    };
  }, [config]);
  const { incrementSessionCount } = usePWAInstall();
  const { notify, confirm } = useConfirmDialog();
  const [settings, setSettings] = useState(defaultSettings);
  const { active: wakeActive } = useWakeLock(isRunning && !isPaused && settings.wakeLock);

  const [showSummary, setShowSummary] = useState(false);
  const [restored, setRestored] = useState(false);
  const [wasResumed, setWasResumed] = useState(false);
  const [lastSession, setLastSession] = useState<SessionDoc | null>(null);
  const [saving, setSaving] = useState(false);
  const [customName, setCustomName] = useState("");
  const [presetError, setPresetError] = useState<string | null>(null);
  const [savingPreset, setSavingPreset] = useState(false);
  const volume = settings.volume;
  const vibrateEnabled = settings.vibrate;
  const soundId = settings.soundId;
  const notifEnabled = settings.notifications;
  // cegah simpan sesi ganda (STOP manual vs selesai alami target)
  const finishGuardRef = useRef(false);

  useEffect(() => {
    fetchSettings(user?.uid ?? null).then(setSettings);
    const onStorage = () => fetchSettings(user?.uid ?? null).then(setSettings);
    window.addEventListener("storage", onStorage);
    // also poll localStorage changes via interval for same-tab updates from settings page
    const id = setInterval(() => {
      const raw = localStorage.getItem("runease:settings");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setSettings((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify({ ...prev, ...parsed })) {
              return { ...prev, ...parsed };
            }
            return prev;
          });
        } catch {
          // ignore
        }
      }
    }, 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, [user?.uid]);

  // preset custom: fetch saat user berubah (sekaligus migrasi guest -> cloud)
  useEffect(() => {
    fetchCustoms(user?.uid ?? null);
  }, [user?.uid, fetchCustoms]);

  // Bug 8: auto-resume sesi yang ter-interupsi reload / pindah halaman.
  // Snapshot tersimpan tiap detik di localStorage (lihat useTimerWorker).
  useEffect(() => {
    if (restored) return;
    const snap = loadActiveTimer();
    if (!snap) {
      setRestored(true);
      return;
    }
    // snapshot basi (>12 jam) → buang, jangan resume sesi kemarin
    if (Date.now() - snap.updatedAt > 12 * 60 * 60 * 1000) {
      clearActiveTimer();
      setRestored(true);
      return;
    }
    // beri worker waktu init (Dedicated Worker dibuat di useTimerWorker)
    const t = setTimeout(() => {
      try {
        restore(snap);
        setWasResumed(true);
        setShowSummary(false);
        finishGuardRef.current = false;
      } catch {
        // ignore
      } finally {
        setRestored(true);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [restored, restore]);

  // Bug 8: cegah reload tak sengaja saat sesi berjalan
  useEffect(() => {
    if (!isRunning || showSummary) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isRunning, showSummary]);

  // Bug 8: cegah pindah halaman (React Router) saat sesi berjalan
  const blocker = useBlocker(isRunning && !showSummary);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    (async () => {
      const ok = await confirm({
        title: "Sesi masih berjalan",
        message: "Pindah halaman akan tetap melanjutkan sesi di background (auto-resume). Lanjut pindah?",
        confirmLabel: "Pindah",
        variant: "yellow",
      });
      if (ok) blocker.proceed();
      else blocker.reset();
    })();
  }, [blocker, confirm]);

  // jika preset aktif terhapus (mis. dari Settings), kembali ke bawaan.
  // Tunggu fetch selesai agar tidak reset preset yang baru di-add / belum load.
  useEffect(() => {
    if (isRunning) return;
    if (presetsLoading) return;
    if (!activePresetId || activePresetId === "custom") return;
    if (!allPresets.some((p) => p.id === activePresetId)) {
      const fallback = builtinPresets.find((p) => p.id === "builtin_2_1")!;
      setActivePresetId(fallback.id);
      setConfig({ runSec: fallback.runSec, walkSec: fallback.walkSec, warmupSec: fallback.warmupSec, cooldownSec: fallback.cooldownSec, mode: "infinite", targetSets: undefined });
    }
  }, [allPresets, activePresetId, isRunning, presetsLoading, setConfig, setActivePresetId]);

  // Sinkronisasi config dari preset aktif saat daftar preset selesai load
  // (mis. setelah reload: activePresetId ter-restore dari localStorage, customs baru datang async).
  // Hanya saat idle + preset non-custom agar edit manual tidak tertimpa.
  const syncedPresetRef = useRef<string | null>(null);
  useEffect(() => {
    if (isRunning) return;
    if (presetsLoading) return;
    if (!activePresetId || activePresetId === "custom") return;
    if (syncedPresetRef.current === activePresetId) return;
    const p = allPresets.find((x) => x.id === activePresetId);
    if (!p) return;
    syncedPresetRef.current = activePresetId;
    setConfig({
      runSec: p.runSec,
      walkSec: p.walkSec,
      warmupSec: p.warmupSec,
      cooldownSec: p.cooldownSec,
      mode: p.mode === "sets" ? "sets" : "infinite",
      targetSets: p.mode === "sets" ? (p.targetSets ?? DEFAULT_TARGET_SETS) : undefined,
    });
  }, [allPresets, activePresetId, isRunning, presetsLoading, setConfig]);

  // handle phase change -> audio + vibrate + notifikasi SW (background/lock)
  useEffect(() => {
    setOnPhaseChange((_from, to) => {
      // audio
      if (to === "run") playRunSound(volume);
      else if (to === "walk") playWalkSound(volume);
      else if (to === "warmup" || to === "cooldown") playWarmupSound(volume);

      // haptics (foreground; saat lock digantikan vibrate via SW notification)
      if (vibrateEnabled) vibrateForPhase(to);

      // notifikasi via Service Worker — satu-satunya jalur yang bisa bangunkan OS saat lock.
      // Kirim selalu saat notifEnabled (SW menimpa via tag), bukan hanya saat document.hidden,
      // karena callback main-thread bisa telat saat tab mulai ter-freeze.
      if (notifEnabled && (to === "run" || to === "walk" || to === "warmup" || to === "cooldown")) {
        notifyViaSW(to as "run" | "walk" | "warmup" | "cooldown", vibrateEnabled).catch(() => {});
      }

      // jalur native opsional (Capacitor): getar + notif andal saat layar mati total.
      // Aman di Web murni (dynamic import gagal → false, diabaikan).
      if (to === "run" || to === "walk" || to === "warmup" || to === "cooldown") {
        import("@/lib/nativeNotify")
          .then(({ vibrateNative, notifyNative }) => {
            if (vibrateEnabled) vibrateNative(to as "run" | "walk" | "warmup" | "cooldown").catch(() => {});
            if (notifEnabled) notifyNative(to as "run" | "walk" | "warmup" | "cooldown").catch(() => {});
          })
          .catch(() => {});
      }

      // optional voice
      if (soundId === "voice") {
        // handled via playVoice inside audio lib if needed
      }
    });
  }, [setOnPhaseChange, volume, vibrateEnabled, soundId, vibrateForPhase, notifEnabled]);

  const handleSelectPreset = (p: PresetDoc) => {
    if (isRunning) return;
    if (p.id === "custom") {
      setActivePresetId("custom");
      return;
    }
    syncedPresetRef.current = p.id;
    setActivePresetId(p.id);
    setConfig({
      runSec: p.runSec,
      walkSec: p.walkSec,
      warmupSec: p.warmupSec,
      cooldownSec: p.cooldownSec,
      mode: p.mode === "sets" ? "sets" : "infinite",
      targetSets: p.mode === "sets" ? (p.targetSets ?? DEFAULT_TARGET_SETS) : undefined,
    });
  };

  const handleManualChange = (field: "runSec" | "walkSec", value: number) => {
    if (isRunning) return;
    setActivePresetId("custom");
    setConfig({ [field]: value } as Partial<typeof config>);
  };

  const notifyNewBadges = useCallback(
    async (newBadges: string[]) => {
      if (newBadges.length === 0) return;
      newBadges.forEach((b) => track("badge_unlocked", { badgeId: b }));
      const names = newBadges.map((b) => getBadgeDef(b)?.name ?? b).join(", ");
      await notify({
        title: newBadges.length > 1 ? "Badge didapat!" : "Badge didapat!",
        message: `Kamu membuka: ${names}. Cek di Statistik > Badge.`,
        variant: "yellow",
      });
    },
    [notify]
  );

  const handleSaveCustom = async () => {
    if (isRunning || savingPreset) return;
    setPresetError(null);
    setSavingPreset(true);
    try {
      const p = await addCustom(user?.uid ?? null, {
        name: customName,
        runSec: config.runSec,
        walkSec: config.walkSec,
        warmupSec: config.warmupSec,
        cooldownSec: config.cooldownSec,
        mode: config.mode,
        targetSets: config.mode === "sets" ? config.targetSets : undefined,
      });
      setCustomName("");
      syncedPresetRef.current = p.id;
      // store.add sudah setActive(p.id) — tidak perlu set lagi (hindari race)
      // Evaluasi badge (mis. Kolektor Preset) — login-only, idempoten
      if (user?.uid) {
        try {
          const customsNow = usePresetStore.getState().customs;
          const ctx = await buildBadgeContext({
            uid: user.uid,
            sessions: useSessionStore.getState().sessions,
            presets: [...builtinPresets, ...customsNow],
          });
          const fresh = await evaluateAndAwardBadges(user.uid, ctx);
          console.log("[gamify] preset-save check, customs:", customsNow.length, "newBadges:", fresh);
          await notifyNewBadges(fresh);
        } catch (err) {
          console.warn("[gamify] preset-save badge check failed", err);
        }
      }
    } catch (e) {
      setPresetError((e as Error).message);
    } finally {
      setSavingPreset(false);
    }
  };

  const handleStart = useCallback(async () => {
    await ensureAudio();
    // Minta izin notifikasi saat Start (user gesture) — await agar fase pertama tidak kehilangan notif
    if (notifEnabled) {
      try {
        const { ensureNotificationPermission } = await import("@/lib/notifications");
        await ensureNotificationPermission();
      } catch {
        // ignore
      }
    }
    finishGuardRef.current = false;
    setShowSummary(false);
    track("timer_started", {
      runSec: config.runSec,
      walkSec: config.walkSec,
      mode: config.mode,
      presetId: activePresetId ?? "custom",
    });
    start(config);
  }, [config, start, activePresetId, notifEnabled]);

  const handleStop = useCallback(
    async (status: SessionStatus = "stopped") => {
      // cegah simpan ganda (mis. STOP manual tepat saat target tercapai)
      if (finishGuardRef.current) return;
      finishGuardRef.current = true;
      const duration = totalElapsedSec;
      const sets = setsCompleted;
      const startedAtMs = startedAt ?? Date.now() - duration * 1000;
      const preset = allPresets.find((p) => p.id === activePresetId);
      const presetName = preset?.name ?? "Custom";
      stop();

    if (duration < 60) {
      // abandoned — don't save, just show brief toast-like summary
      setLastSession(null);
      // still show summary but mark as not saved
      setShowSummary(true);
      return;
    }

    setSaving(true);
    try {
      const session = await saveSession({
        uid: user?.uid ?? null,
        config,
        presetId: activePresetId,
        presetName,
        startedAtMs,
        durationSec: duration,
        setsCompleted: sets,
        status,
      });
      if (session.status !== "abandoned") {
        addLocal(session);
        setLastSession(session);
        incrementSessionCount();
        track("timer_completed", { durationSec: duration, sets: sets });
        // Gamifikasi: update XP/Level/Streak/Badge (hanya jika login)
        if (user?.uid) {
          try {
            const result = await updateUserAfterSession({
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              session,
              allSessions: sessions,
              presets: allPresets,
            });
            if (result.newBadges.length > 0) {
              console.log("[gamify] new badges", result.newBadges);
              await notifyNewBadges(result.newBadges);
            }
          } catch (err) {
            console.warn("[gamify] update failed", err);
          }
        }
      } else {
        setLastSession(null);
      }
      setShowSummary(true);
    } catch (e) {
      console.error("[timer] save failed", e);
      setShowSummary(true);
    } finally {
      setSaving(false);
    }
  }, [totalElapsedSec, setsCompleted, startedAt, activePresetId, config, user, stop, addLocal, incrementSessionCount, sessions, allPresets, notifyNewBadges]);

  // selesai alami dari worker (target set tercapai) → simpan "completed"
  useEffect(() => {
    setOnFinished(() => {
      void handleStop("completed");
    });
    return () => setOnFinished(null);
  }, [setOnFinished, handleStop]);

  // keyboard shortcuts — Escape TIDAK boleh stop sesi (rawan kepencet), hanya tutup summary
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
        e.preventDefault();
        if (!isRunning) handleStart();
        else if (isPaused) resume();
        else pause();
      } else if (e.key.toLowerCase() === "s" && isRunning) {
        skip();
      } else if (e.key === "Escape") {
        if (showSummary) setShowSummary(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, isPaused, showSummary, handleStart, pause, resume, skip]);

  // (init config dari preset aktif ditangani efek sinkronisasi di atas — jangan timpa di mount)

  return (
    <div className="container-app space-y-3 sm:space-y-4 py-3 sm:py-6">
      {wasResumed && isRunning && !showSummary && (
        <div className="border-2 border-bauhaus-black bg-bauhaus-yellow p-2 text-center text-xs font-black uppercase tracking-widest shadow-bauhaus-sm">
          Sesi dilanjutkan otomatis setelah reload
        </div>
      )}
      {/* Preset chips - only when idle */}
      {!isRunning && <PresetChips presets={allPresets} activeId={activePresetId} onSelect={handleSelectPreset} customConfig={{ runSec: config.runSec, walkSec: config.walkSec }} />}

      {/* Simpan custom sebagai preset - only when idle + manual custom */}
      {!isRunning && activePresetId === "custom" && (
        <Card deco="blue" className="p-3 sm:p-4">
          <div className="text-[11px] sm:text-xs font-black uppercase tracking-widest">Simpan Custom ini?</div>
          <p className="mt-1 text-sm font-medium tabular-nums opacity-70 break-words">
            {config.runSec}s / {config.walkSec}s{config.warmupSec > 0 ? ` • Warmup ${config.warmupSec}s` : ""}{config.cooldownSec > 0 ? ` • Cooldown ${config.cooldownSec}s` : ""}{config.mode === "sets" ? ` • Target ${config.targetSets ?? DEFAULT_TARGET_SETS} set` : " • Bebas"}
          </p>
          {presetError && (
            <div className="mt-2 border-2 border-bauhaus-red bg-red-50 p-2 text-sm font-medium text-bauhaus-red break-words">{presetError}</div>
          )}
          <div className="mt-2 flex flex-col xs:flex-row gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nama preset, mis. Pagi 3:1"
              aria-label="Nama preset custom"
              maxLength={24}
              className="min-h-[48px] min-w-0 flex-1 border-2 border-bauhaus-black bg-white px-3 py-2 text-sm sm:text-base font-bold shadow-bauhaus-sm"
            />
            <Button variant="blue" size="sm" className="w-full xs:w-auto shrink-0" onClick={handleSaveCustom} disabled={savingPreset || !customName.trim()}>
              {savingPreset ? "..." : "Simpan"}
            </Button>
          </div>
          <p className="mt-1 text-[11px] sm:text-xs font-medium opacity-60">{customs.length}/{MAX_CUSTOM_PRESETS} preset tersimpan{user ? "" : " (lokal)"}</p>
        </Card>
      )}

      {/* WakeLock indicator */}
      {isRunning && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
          <span className={`h-2 w-2 rounded-full ${wakeActive ? "bg-green-500" : "bg-yellow-500"}`} />
          {wakeActive ? "Layar tetap menyala" : "Menyala..."}
          <span className="opacity-60">•</span>
          <span className="flex items-center gap-1">
            <Volume2 className="h-3 w-3" /> {volume}%
          </span>
        </div>
      )}

      {/* Timer Display — saat idle tampilkan fase idle (SIAP), menit ikut config/preset via remainingSec */}
      <TimerDisplay
        remainingSec={remainingSec}
        phase={phase}
        totalElapsedSec={totalElapsedSec}
        setsCompleted={setsCompleted}
        phaseDuration={phaseDuration}
        isRunning={isRunning}
      />

      {/* Time Inputs - only when idle */}
      {!isRunning && (
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <TimeInput label="Lari" valueSec={config.runSec} onChange={(v) => handleManualChange("runSec", v)} color="red" />
          <TimeInput label="Jalan" valueSec={config.walkSec} onChange={(v) => handleManualChange("walkSec", v)} color="blue" />
        </div>
      )}

      {/* Advanced: Warmup/Cooldown collapsed */}
      {!isRunning && (
        <Card deco="yellow" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-black uppercase tracking-widest opacity-70">
            <Settings2 className="h-4 w-4 shrink-0" /> Opsi Lanjutan
          </div>
          <div className="mt-3 grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="warmup-input" className="mb-1 block text-[10px] font-bold uppercase tracking-widest">Warmup (detik)</label>
              <input
                id="warmup-input"
                type="number"
                min={0}
                max={600}
                step={10}
                value={config.warmupSec}
                onChange={(e) => {
                  setActivePresetId("custom");
                  setConfig({ warmupSec: Math.max(0, Math.min(600, parseInt(e.target.value) || 0)) });
                }}
                className="min-h-[48px] w-full border-2 border-bauhaus-black bg-white px-3 py-2 text-sm sm:text-base font-bold shadow-bauhaus-sm"
              />
            </div>
            <div>
              <label htmlFor="cooldown-input" className="mb-1 block text-[10px] font-bold uppercase tracking-widest">Cooldown (detik)</label>
              <input
                id="cooldown-input"
                type="number"
                min={0}
                max={600}
                step={10}
                value={config.cooldownSec}
                onChange={(e) => {
                  setActivePresetId("custom");
                  setConfig({ cooldownSec: Math.max(0, Math.min(600, parseInt(e.target.value) || 0)) });
                }}
                className="min-h-[48px] w-full border-2 border-bauhaus-black bg-white px-3 py-2 text-sm sm:text-base font-bold shadow-bauhaus-sm"
              />
            </div>
          </div>
          <p className="mt-2 text-xs font-medium opacity-60">Warmup di awal{config.mode === "sets" ? ", Cooldown di akhir setelah set terakhir, lalu timer berhenti otomatis" : ", Cooldown hanya jalan di mode Target Set (mode Bebas: stop manual)"}</p>

          <div className="mt-3 border-t-2 border-bauhaus-black pt-3">
            <span className="block text-[11px] sm:text-xs font-black uppercase tracking-widest">Mode Sesi</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant={config.mode === "sets" ? "blue" : "outline"}
                size="sm"
                className="min-h-[48px] w-full"
                onClick={() => {
                  setActivePresetId("custom");
                  setConfig({ mode: "infinite", targetSets: undefined });
                }}
              >
                Bebas ♾
              </Button>
              <Button
                variant={config.mode === "sets" ? "blue" : "outline"}
                size="sm"
                className="min-h-[48px] w-full"
                onClick={() => {
                  setActivePresetId("custom");
                  setConfig({ mode: "sets", targetSets: config.targetSets ?? DEFAULT_TARGET_SETS });
                }}
              >
                Target Set
              </Button>
            </div>
            {config.mode === "sets" && (
              <div className="mt-2 flex items-center justify-between gap-2 border-2 border-bauhaus-black bg-white p-2 shadow-bauhaus-sm">
                <span className="pl-1 text-[11px] sm:text-xs font-black uppercase tracking-widest">Jumlah Set</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Kurangi set"
                    disabled={(config.targetSets ?? DEFAULT_TARGET_SETS) <= MIN_TARGET_SETS}
                    onClick={() => {
                      setActivePresetId("custom");
                      setConfig({ targetSets: (config.targetSets ?? DEFAULT_TARGET_SETS) - 1 });
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[64px] text-center font-black tabular-nums text-lg" aria-live="polite">
                    {config.targetSets ?? DEFAULT_TARGET_SETS}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Tambah set"
                    disabled={(config.targetSets ?? DEFAULT_TARGET_SETS) >= MAX_TARGET_SETS}
                    onClick={() => {
                      setActivePresetId("custom");
                      setConfig({ targetSets: (config.targetSets ?? DEFAULT_TARGET_SETS) + 1 });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs font-medium opacity-60">1 set = 1× lari + 1× jalan.</p>
            <p aria-live="polite" className="mt-1 text-xs font-black uppercase tracking-widest tabular-nums">
              Estimasi: {estimate.label}
            </p>
            <p className="text-[11px] font-medium opacity-60 tabular-nums">{estimate.detail}</p>
          </div>
        </Card>
      )}

      {/* Controls */}
      <TimerControls
        isRunning={isRunning}
        isPaused={isPaused}
        onStart={handleStart}
        onPause={pause}
        onResume={resume}
        onSkip={skip}
        onStop={() => handleStop("stopped")}
      />

      {/* Stats ringkas */}
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest opacity-50 text-center">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> Preset: {allPresets.find((p) => p.id === activePresetId)?.name ?? "Custom"}
        </span>
        <span>•</span>
        <span>{config.runSec}s / {config.walkSec}s</span>
        {config.warmupSec > 0 && (
          <>
            <span>•</span>
            <span>Warmup {config.warmupSec}s</span>
          </>
        )}
        {config.mode === "sets" && (
          <>
            <span>•</span>
            <span>Target {config.targetSets ?? DEFAULT_TARGET_SETS} set • {estimate.label}</span>
          </>
        )}
        {config.mode !== "sets" && (
          <>
            <span>•</span>
            <span>{estimate.label}/set</span>
          </>
        )}
      </div>

      {/* Session Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bauhaus-black/60 p-4">
          <Card
            deco={lastSession ? "red" : "yellow"}
            className="w-[calc(100%-2rem)] max-w-sm p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-summary-title"
          >
            {saving ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-bauhaus-black border-t-transparent" />
                <p className="mt-3 font-bold uppercase tracking-widest text-sm">Menyimpan...</p>
              </div>
            ) : lastSession ? (
              <div className="text-center">
                <Badge variant="yellow" className="mb-3">
                  {lastSession.status === "completed" ? "Target Tercapai!" : "Sesi Selesai!"}
                </Badge>
                <h2 id="session-summary-title" className="font-black uppercase tracking-tighter text-2xl text-balance">{lastSession.status === "completed" ? "Tuntas! 🎯" : "Keren! 🔥"}</h2>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="border-2 border-bauhaus-black bg-bauhaus-gray p-2 sm:p-3">
                    <div className="stat-label">Durasi</div>
                    <div className="stat-value">{formatTime(lastSession.durationSec)}</div>
                  </div>
                  <div className="border-2 border-bauhaus-black bg-bauhaus-gray p-2 sm:p-3">
                    <div className="stat-label">Set</div>
                    <div className="stat-value">{lastSession.setsCompleted}</div>
                  </div>
                  <div className="border-2 border-bauhaus-black bg-bauhaus-yellow p-2 sm:p-3">
                    <div className="stat-label">XP</div>
                    <div className="stat-value">+{lastSession.xpEarned}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium opacity-60 break-words">{lastSession.presetSnapshot.name} • {lastSession.presetSnapshot.runSec}s / {lastSession.presetSnapshot.walkSec}s</p>
                <p className="mt-4 text-sm font-medium opacity-70">
                  {user ? "Tersimpan di cloud & lokal." : "Tersimpan lokal. Login Google untuk sinkronisasi."}
                </p>
                <div className="mt-6 grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                  <Button variant="outline" shape="square" className="min-h-[48px] w-full" onClick={() => setShowSummary(false)}>
                    Tutup
                  </Button>
                  <Button variant="red" shape="square" className="min-h-[48px] w-full" onClick={() => setShowSummary(false)}>
                    Lagi!
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Badge variant="outline" className="mb-3">
                  Sesi Terlalu Pendek
                </Badge>
                <h2 id="session-summary-title" className="font-black uppercase tracking-tight text-xl">Belum disimpan</h2>
                <p className="mt-2 text-sm font-medium opacity-70">Sesi &lt;60 detik tidak disimpan (abandoned). Coba lagi minimal 1 menit!</p>
                <Button variant="outline" shape="square" className="mt-6 w-full" onClick={() => setShowSummary(false)}>
                  Mengerti
                </Button>
              </div>
            )}
            <CardContent className="mt-4 border-t-2 border-bauhaus-black pt-4 text-center text-xs font-bold uppercase tracking-widest opacity-60">
              Lihat di Riwayat • {user ? "Sinkron cloud aktif" : "Login untuk cloud"}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
