import { useState, useEffect, useCallback, useMemo } from "react";
import { useTimerStore, formatTime } from "@/stores/timerStore";
import { useTimerWorker } from "@/hooks/useTimerWorker";
import { useVibration } from "@/hooks/useVibration";
import { useWakeLock } from "@/hooks/useWakeLock";
import { ensureAudio, playRunSound, playWalkSound, playWarmupSound } from "@/lib/audio";
import { TimerDisplay } from "@/components/timer/timer-display";
import { TimerControls } from "@/components/timer/timer-controls";
import { TimeInput } from "@/components/timer/time-input";
import { PresetChips, builtinPresets } from "@/components/timer/preset-chips";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PresetDoc } from "@/types/preset";
import { Clock, Settings2, Volume2 } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { useSessionStore } from "@/stores/sessionStore";
import { usePresetStore } from "@/stores/presetStore";
import { MAX_CUSTOM_PRESETS } from "@/lib/presets";
import { saveSession } from "@/lib/session";
import { updateUserAfterSession } from "@/lib/userStats";
import { track } from "@/lib/analytics";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { fetchSettings, defaultSettings } from "@/lib/settings";
import type { SessionDoc } from "@/types/session";

export default function TimerPage() {
  const { phase, remainingSec, phaseDuration, totalElapsedSec, setsCompleted, isRunning, isPaused, config, setConfig, startedAt } = useTimerStore();
  const { start, pause, resume, skip, stop, setOnPhaseChange } = useTimerWorker();
  const { vibrateForPhase } = useVibration();
  const user = useUserStore((s) => s.user);
  const { sessions, addLocal } = useSessionStore();
  const customs = usePresetStore((s) => s.customs);
  const fetchCustoms = usePresetStore((s) => s.fetch);
  const addCustom = usePresetStore((s) => s.add);
  const allPresets = useMemo(() => [...builtinPresets, ...customs], [customs]);
  const { incrementSessionCount } = usePWAInstall();
  const [settings, setSettings] = useState(defaultSettings);
  const { active: wakeActive } = useWakeLock(isRunning && !isPaused && settings.wakeLock);

  const [activePresetId, setActivePresetId] = useState<string>("builtin_2_1");
  const [showSummary, setShowSummary] = useState(false);
  const [lastSession, setLastSession] = useState<SessionDoc | null>(null);
  const [saving, setSaving] = useState(false);
  const [customName, setCustomName] = useState("");
  const [presetError, setPresetError] = useState<string | null>(null);
  const [savingPreset, setSavingPreset] = useState(false);
  const volume = settings.volume;
  const vibrateEnabled = settings.vibrate;
  const soundId = settings.soundId;
  const notifEnabled = settings.notifications;

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

  // jika preset aktif terhapus (mis. dari Settings), kembali ke bawaan
  useEffect(() => {
    if (isRunning) return;
    if (activePresetId === "custom") return;
    if (!allPresets.some((p) => p.id === activePresetId)) {
      const fallback = builtinPresets.find((p) => p.id === "builtin_2_1")!;
      setActivePresetId(fallback.id);
      setConfig({ runSec: fallback.runSec, walkSec: fallback.walkSec, warmupSec: fallback.warmupSec, cooldownSec: fallback.cooldownSec });
    }
  }, [allPresets, activePresetId, isRunning, setConfig]);

  // handle phase change -> audio + vibrate + notifikasi fallback (background)
  useEffect(() => {
    setOnPhaseChange((_from, to) => {
      // audio
      if (to === "run") playRunSound(volume);
      else if (to === "walk") playWalkSound(volume);
      else if (to === "warmup" || to === "cooldown") playWarmupSound(volume);

      // haptics
      if (vibrateEnabled) vibrateForPhase(to);

      // fallback visual jika tab background (audio berpotensi diblokir)
      if (notifEnabled && document.hidden && (to === "run" || to === "walk" || to === "warmup" || to === "cooldown")) {
        const phase = to;
        import("@/lib/notifications").then(({ sendPhaseNotification }) => {
          sendPhaseNotification(phase);
        }).catch(() => {});
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
    setActivePresetId(p.id);
    setConfig({ runSec: p.runSec, walkSec: p.walkSec, warmupSec: p.warmupSec, cooldownSec: p.cooldownSec });
  };

  const handleManualChange = (field: "runSec" | "walkSec", value: number) => {
    if (isRunning) return;
    setActivePresetId("custom");
    setConfig({ [field]: value } as Partial<typeof config>);
  };

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
      });
      setCustomName("");
      setActivePresetId(p.id);
    } catch (e) {
      setPresetError((e as Error).message);
    } finally {
      setSavingPreset(false);
    }
  };

  const handleStart = useCallback(async () => {
    await ensureAudio();
    // Minta izin notifikasi saat Start (user gesture) jika fallback diaktifkan
    if (notifEnabled) {
      import("@/lib/notifications").then(({ ensureNotificationPermission }) => {
        ensureNotificationPermission().catch(() => {});
      }).catch(() => {});
    }
    setShowSummary(false);
    track("timer_started", {
      runSec: config.runSec,
      walkSec: config.walkSec,
      mode: config.mode,
      presetId: activePresetId,
    });
    start(config);
  }, [config, start, activePresetId, notifEnabled]);

  const handleStop = useCallback(async () => {
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
        status: "stopped",
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
              result.newBadges.forEach((b) => track("badge_unlocked", { badgeId: b }));
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
  }, [totalElapsedSec, setsCompleted, startedAt, activePresetId, config, user, stop, addLocal, incrementSessionCount, sessions, allPresets]);

  // keyboard shortcuts (Space global hanya saat fokus bukan di tombol — tombol pakai klik native)
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
        else if (isRunning) handleStop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, isPaused, showSummary, handleStart, pause, resume, skip, handleStop]);

  // Initialize from active preset on mount
  useEffect(() => {
    const p = builtinPresets.find((x) => x.id === activePresetId);
    if (p && !isRunning) {
      setConfig({ runSec: p.runSec, walkSec: p.walkSec, warmupSec: p.warmupSec, cooldownSec: p.cooldownSec });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-4 sm:max-w-2xl">
      {/* Preset chips - only when idle */}
      {!isRunning && <PresetChips presets={allPresets} activeId={activePresetId} onSelect={handleSelectPreset} customConfig={{ runSec: config.runSec, walkSec: config.walkSec }} />}

      {/* Simpan custom sebagai preset - only when idle + manual custom */}
      {!isRunning && activePresetId === "custom" && (
        <Card deco="blue" className="p-4">
          <div className="text-xs font-black uppercase tracking-widest">Simpan Custom ini?</div>
          <p className="mt-1 text-sm font-medium tabular-nums opacity-70">
            {config.runSec}s / {config.walkSec}s{config.warmupSec > 0 ? ` • Warmup ${config.warmupSec}s` : ""}{config.cooldownSec > 0 ? ` • Cooldown ${config.cooldownSec}s` : ""}
          </p>
          {presetError && (
            <div className="mt-2 border-2 border-bauhaus-red bg-red-50 p-2 text-sm font-medium text-bauhaus-red">{presetError}</div>
          )}
          <div className="mt-2 flex gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nama preset, mis. Pagi 3:1"
              aria-label="Nama preset custom"
              maxLength={24}
              className="min-w-0 flex-1 border-2 border-bauhaus-black bg-white px-3 py-2 font-bold shadow-bauhaus-sm"
            />
            <Button variant="blue" size="sm" onClick={handleSaveCustom} disabled={savingPreset || !customName.trim()}>
              {savingPreset ? "..." : "Simpan"}
            </Button>
          </div>
          <p className="mt-1 text-xs font-medium opacity-60">{customs.length}/{MAX_CUSTOM_PRESETS} preset tersimpan{user ? "" : " (lokal)"}</p>
        </Card>
      )}

      {/* WakeLock indicator */}
      {isRunning && (
        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
          <span className={`h-2 w-2 rounded-full ${wakeActive ? "bg-green-500" : "bg-yellow-500"}`} />
          {wakeActive ? "Layar tetap menyala" : "Menyala..."}
          <span className="opacity-60">•</span>
          <span className="flex items-center gap-1">
            <Volume2 className="h-3 w-3" /> {volume}%
          </span>
        </div>
      )}

      {/* Timer Display */}
      <TimerDisplay
        remainingSec={remainingSec}
        phase={phase === "idle" ? (activePresetId ? "run" : "idle") : phase}
        totalElapsedSec={totalElapsedSec}
        setsCompleted={setsCompleted}
        phaseDuration={phaseDuration}
        isRunning={isRunning}
      />

      {/* Time Inputs - only when idle */}
      {!isRunning && (
        <div className="grid grid-cols-2 gap-4">
          <TimeInput label="Lari" valueSec={config.runSec} onChange={(v) => handleManualChange("runSec", v)} color="red" />
          <TimeInput label="Jalan" valueSec={config.walkSec} onChange={(v) => handleManualChange("walkSec", v)} color="blue" />
        </div>
      )}

      {/* Advanced: Warmup/Cooldown collapsed */}
      {!isRunning && (
        <Card deco="yellow" className="p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70">
            <Settings2 className="h-4 w-4" /> Opsi Lanjutan
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
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
                className="w-full border-2 border-bauhaus-black bg-white px-3 py-2 font-bold shadow-bauhaus-sm"
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
                className="w-full border-2 border-bauhaus-black bg-white px-3 py-2 font-bold shadow-bauhaus-sm"
              />
            </div>
          </div>
          <p className="mt-2 text-xs font-medium opacity-60">Warmup di awal, Cooldown di akhir (untuk mode infinite, cooldown diabaikan sampai stop manual)</p>
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
        onStop={handleStop}
      />

      {/* Stats ringkas */}
      <div className="flex flex-wrap justify-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50">
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
      </div>

      {/* Session Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bauhaus-black/60 p-4">
          <Card
            deco={lastSession ? "red" : "yellow"}
            className="w-full max-w-sm"
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
                  Sesi Selesai!
                </Badge>
                <h2 id="session-summary-title" className="font-black uppercase tracking-tighter text-2xl">Keren! 🔥</h2>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="border-2 border-bauhaus-black bg-bauhaus-gray p-3">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-60">Durasi</div>
                    <div className="font-black text-xl tabular-nums">{formatTime(lastSession.durationSec)}</div>
                  </div>
                  <div className="border-2 border-bauhaus-black bg-bauhaus-gray p-3">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-60">Set</div>
                    <div className="font-black text-xl">{lastSession.setsCompleted}</div>
                  </div>
                  <div className="border-2 border-bauhaus-black bg-bauhaus-yellow p-3">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-60">XP</div>
                    <div className="font-black text-xl">+{lastSession.xpEarned}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium opacity-60">{lastSession.presetSnapshot.name} • {lastSession.presetSnapshot.runSec}s / {lastSession.presetSnapshot.walkSec}s</p>
                <p className="mt-4 text-sm font-medium opacity-70">
                  {user ? "Tersimpan di cloud & lokal." : "Tersimpan lokal. Login Google untuk sinkronisasi."}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="outline" shape="square" onClick={() => setShowSummary(false)}>
                    Tutup
                  </Button>
                  <Button variant="red" shape="square" onClick={() => setShowSummary(false)}>
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
