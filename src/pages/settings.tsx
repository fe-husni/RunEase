import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { BauhausSelect } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { testSound } from "@/lib/audio";
import { useUserStore } from "@/stores/userStore";
import { exportData } from "@/lib/export";
import { parseAndValidate, importData, type ImportPreview } from "@/lib/import";
import { track } from "@/lib/analytics";
import { fetchSettings, saveSettings, defaultSettings, type SettingsDoc } from "@/lib/settings";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePresetStore } from "@/stores/presetStore";
import { MAX_CUSTOM_PRESETS } from "@/lib/presets";
import { Download, Upload, LogOut, Trash2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useUserStore();
  const [settings, setSettings] = useState<SettingsDoc>(defaultSettings);
  const [exporting, setExporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [replaceConfirm, setReplaceConfirm] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const customs = usePresetStore((s) => s.customs);
  const activePresetId = usePresetStore((s) => s.activePresetId);
  const setActivePreset = usePresetStore((s) => s.setActive);
  const fetchCustoms = usePresetStore((s) => s.fetch);
  const removeCustom = usePresetStore((s) => s.remove);
  const [presetError, setPresetError] = useState<string | null>(null);
  const [notifDenied, setNotifDenied] = useState(false);
  const { confirm, notify } = useConfirmDialog();

  useEffect(() => {
    fetchSettings(user?.uid ?? null).then(setSettings);
  }, [user?.uid]);

  useEffect(() => {
    fetchCustoms(user?.uid ?? null);
  }, [user?.uid, fetchCustoms]);

  const handleDeletePreset = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Hapus preset "${name}"?`,
      message: "Preset yang dihapus tidak bisa dikembalikan.",
      confirmLabel: "Hapus",
      variant: "red",
    });
    if (!ok) return;
    setPresetError(null);
    try {
      await removeCustom(user?.uid ?? null, id);
    } catch (e) {
      setPresetError((e as Error).message);
    }
  };

  const update = (patch: Partial<SettingsDoc>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(user?.uid ?? null, patch);
  };

  const handleTest = () => testSound(settings.soundId, settings.volume);

  const handleNotifToggle = async (v: boolean) => {
    if (!v) {
      setNotifDenied(false);
      update({ notifications: false });
      return;
    }
    const { ensureNotificationPermission } = await import("@/lib/notifications");
    const ok = await ensureNotificationPermission();
    setNotifDenied(!ok);
    update({ notifications: ok });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportData(user?.uid ?? null);
      track("data_exported");
    } catch (e) {
      await notify({
        title: "Export gagal",
        message: (e as Error).message,
        variant: "red",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImportError("File terlalu besar, max 5MB");
      return;
    }
    const text = await file.text();
    const res = parseAndValidate(text);
    if (!res.ok) {
      setImportError(res.error);
      setImportPreview(null);
    } else {
      setImportError(null);
      setImportPreview(res.preview);
      setImportResult(null);
    }
    // reset input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImport = async (mode: "merge" | "replace") => {
    if (!importPreview) return;
    if (mode === "replace" && replaceConfirm !== "HAPUS") {
      setImportError('Ketik "HAPUS" untuk konfirmasi Replace');
      return;
    }
    // backup before replace
    if (mode === "replace" && user?.uid) {
      try {
        await exportData(user.uid);
      } catch {
        // ignore backup error
      }
    }
    setImporting(true);
    setImportError(null);
    try {
      const result = await importData(user?.uid ?? null, importPreview.file, mode);
      track("data_imported", { mode });
      setImportResult(
        `Sukses ${mode}: +${result.added.sessions} sesi, +${result.added.presets} preset, +${result.added.badges} badge. Skip ${result.skipped.sessions} sesi duplikat.`
      );
      setImportPreview(null);
      setReplaceConfirm("");
    } catch (e) {
      setImportError((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container-app space-y-3 sm:space-y-4 py-3 sm:py-6">
      <h1 className="page-title">Pengaturan</h1>

      {/* Auth */}
      <Card deco="blue">
        <h3 className="font-black uppercase tracking-tight text-sm sm:text-base">Akun</h3>
        {user ? (
          <div className="mt-3 flex flex-col xs:flex-row xs:items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar photoURL={user.photoURL} displayName={user.displayName} email={user.email} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-black uppercase tracking-tight text-sm sm:text-base">{user.displayName ?? user.email ?? "Anonim"}</div>
                <div className="truncate text-xs font-medium opacity-60">{user.isAnonymous ? "Anonim (lokal)" : user.email}</div>
                {user.isAnonymous && <Badge variant="yellow" className="mt-1">Guest</Badge>}
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full xs:w-auto shrink-0" onClick={logout}>
              <LogOut className="h-4 w-4 shrink-0" /> Keluar
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-sm font-medium opacity-70">Belum login. Masuk untuk sinkronisasi cloud.</p>
        )}
      </Card>

      {/* Suara */}
      <Card deco="red">
        <h3 className="font-black uppercase tracking-tight text-sm sm:text-base">Suara & Getar</h3>
        <div className="mt-4 space-y-4">
          <div>
            <span className="block text-[11px] sm:text-xs font-black uppercase tracking-widest">Nada Alarm</span>
            <div className="mt-1">
              <BauhausSelect
                label="Nada Alarm"
                value={settings.soundId}
                onChange={(v) => update({ soundId: v })}
                options={[
                  { value: "beep", label: "Beep (default)" },
                  { value: "bell", label: "Bell" },
                  { value: "voice", label: "Voice (TTS)" },
                ]}
              />
            </div>
          </div>
          <div>
            <label htmlFor="volume-range" className="text-[11px] sm:text-xs font-black uppercase tracking-widest">Volume: {settings.volume}%</label>
            <input id="volume-range" type="range" min={0} max={100} value={settings.volume} onChange={(e) => update({ volume: parseInt(e.target.value) })} className="mt-1 min-h-[44px] w-full accent-bauhaus-red" />
          </div>
          <Button variant="yellow" shape="pill" onClick={handleTest} className="min-h-[48px] w-full">
            Test Suara
          </Button>

          <div className="flex min-h-[56px] items-center justify-between gap-3 border-t-2 border-bauhaus-black py-3">
            <span className="flex-1 pr-2 text-xs sm:text-sm font-bold uppercase tracking-widest">Getar</span>
            <Toggle checked={settings.vibrate} onChange={(v) => update({ vibrate: v })} label="Getar" />
          </div>
          <div className="flex min-h-[56px] items-center justify-between gap-3 py-1">
            <span className="flex-1 pr-2 text-xs sm:text-sm font-bold uppercase tracking-widest">Jaga Layar Tetap Menyala</span>
            <Toggle checked={settings.wakeLock} onChange={(v) => update({ wakeLock: v })} label="Wake Lock" />
          </div>
          <div className="flex min-h-[56px] items-center justify-between gap-3 py-1">
            <span className="flex-1 pr-2 text-xs sm:text-sm font-bold uppercase tracking-widest">Notifikasi Background</span>
            <Toggle checked={settings.notifications} onChange={handleNotifToggle} label="Notifikasi Background" />
          </div>
          {notifDenied && <Badge variant="red" className="whitespace-normal text-left normal-case tracking-normal">Izin notifikasi ditolak browser — ubah di Site Settings</Badge>}
          {!("vibrate" in navigator) && <Badge variant="yellow" className="whitespace-normal text-left normal-case tracking-normal">Getar tidak tersedia di perangkat ini (iOS tidak mendukung Vibration API Web)</Badge>}
          <p className="text-[11px] font-medium opacity-60 leading-relaxed">
            Catatan: getar Web tidak jalan saat layar mati total. Notifikasi lockscreen dikirim via Service Worker
            (perlu PWA terinstal + izin). Untuk getar andal saat layar mati, gunakan versi native (Capacitor).
          </p>
        </div>
      </Card>

      {/* Preset Custom */}
      <Card deco="blue">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black uppercase tracking-tight text-sm sm:text-base min-w-0 flex-1 break-words">Preset Custom</h3>
          <Badge variant="yellow" className="shrink-0 tabular-nums">{customs.length}/{MAX_CUSTOM_PRESETS}</Badge>
        </div>
        <p className="mt-1 text-xs font-medium opacity-60 leading-relaxed">
          Buat preset di halaman Timer (ubah durasi manual → Simpan). {user ? "Tersimpan di cloud." : "Tersimpan lokal, ikut migrasi saat login."}
        </p>
        {presetError && (
          <div className="mt-3 flex items-start gap-2 border-2 border-bauhaus-red bg-red-50 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bauhaus-red" />
            <span className="font-medium text-bauhaus-red break-words min-w-0">{presetError}</span>
          </div>
        )}
        {customs.length === 0 ? (
          <p className="mt-3 text-center text-sm font-medium opacity-60">Belum ada preset custom.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {customs.map((p) => {
              const isActive = p.id === activePresetId;
              return (
              <div key={p.id} className={`flex items-center gap-2 border-2 p-2 sm:p-3 shadow-bauhaus-sm ${isActive ? "border-bauhaus-black bg-bauhaus-yellow" : "border-bauhaus-black bg-white"}`}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black uppercase tracking-tight">{p.name}{isActive ? " • Aktif" : ""}</div>
                  <div className="text-xs font-medium tabular-nums opacity-60 whitespace-nowrap overflow-hidden text-ellipsis">
                    {p.runSec}s / {p.walkSec}s{p.warmupSec > 0 ? ` • W${p.warmupSec}s` : ""}{p.cooldownSec > 0 ? ` • C${p.cooldownSec}s` : ""}
                  </div>
                </div>
                {!isActive && (
                  <Button variant="blue" size="sm" className="shrink-0" onClick={() => setActivePreset(p.id)}>
                    Pakai
                  </Button>
                )}
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleDeletePreset(p.id, p.name)}>
                  <Trash2 className="h-4 w-4 shrink-0" /> Hapus
                </Button>
              </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Data */}
      <Card deco="yellow">
        <h3 className="font-black uppercase tracking-tight text-sm sm:text-base">Data</h3>
        <div className="mt-4 grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
          <Button variant="blue" className="min-h-[48px] w-full" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 shrink-0" /> {exporting ? "Mengekspor..." : "Backup Data"}
          </Button>
          <Button variant="outline" className="min-h-[48px] w-full" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 shrink-0" /> Pulihkan Data
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
        </div>

        {importError && (
          <div className="mt-3 flex items-start gap-2 border-2 border-bauhaus-red bg-red-50 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bauhaus-red" />
            <span className="font-medium text-bauhaus-red">{importError}</span>
          </div>
        )}

        {importPreview && (
          <div className="mt-3 border-2 border-bauhaus-black bg-white p-3 shadow-bauhaus-sm">
            <div className="text-[11px] sm:text-xs font-black uppercase tracking-widest">Preview Import</div>
            <div className="mt-1 text-sm font-medium break-words">
              Ditemukan {importPreview.counts.sessions} sesi, {importPreview.counts.presets} preset, {importPreview.counts.badges} badge
            </div>
            <div className="text-xs opacity-60 break-words">Versi {importPreview.file.version} • {new Date(importPreview.file.exportedAt).toLocaleString("id-ID")}</div>
            <div className="mt-3 grid grid-cols-1 xs:grid-cols-2 gap-2">
              <Button variant="blue" size="sm" className="min-h-[48px] w-full" onClick={() => handleImport("merge")} disabled={importing}>
                {importing ? "..." : "Merge (skip duplikat)"}
              </Button>
              <Button variant="red" size="sm" className="min-h-[48px] w-full" onClick={() => handleImport("replace")} disabled={importing}>
                Replace (hapus dulu)
              </Button>
            </div>
            <div className="mt-2">
              <label htmlFor="import-hapus-input" className="text-xs font-bold uppercase tracking-widest">Ketik HAPUS untuk Replace</label>
              <input id="import-hapus-input" value={replaceConfirm} onChange={(e) => setReplaceConfirm(e.target.value)} placeholder="HAPUS" autoComplete="off" className="mt-1 min-h-[48px] w-full border-2 border-bauhaus-black bg-white px-2 py-1 text-sm sm:text-base font-bold" />
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full min-h-[44px]" onClick={() => setImportPreview(null)}>
              Batal
            </Button>
          </div>
        )}

        {importResult && <div className="mt-3 border-2 border-bauhaus-black bg-bauhaus-yellow p-3 text-sm font-bold break-words">{importResult}</div>}

        <div className="mt-4 border-2 border-bauhaus-red bg-red-50 p-3">
          <div className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-bauhaus-red">Zona Bahaya</div>
          <p className="mt-1 text-xs font-medium opacity-60 leading-relaxed">Hapus akan reset XP/Level/Streak & hapus semua sesi, badge, preset custom. Tidak bisa undo kecuali punya Export.</p>
          <div className="mt-3">
            <label htmlFor="danger-hapus-input" className="text-xs font-bold uppercase tracking-widest">Ketik HAPUS untuk konfirmasi</label>
            <input id="danger-hapus-input" value={replaceConfirm} onChange={(e) => setReplaceConfirm(e.target.value)} placeholder="HAPUS" autoComplete="off" className="mt-1 min-h-[48px] w-full border-2 border-bauhaus-black bg-white px-2 py-1 text-sm sm:text-base font-bold" />
          </div>
          <Button
            variant="red"
            size="sm"
            className="mt-2 w-full min-h-[48px]"
            disabled={replaceConfirm !== "HAPUS"}
            onClick={async () => {
              if (replaceConfirm !== "HAPUS") return;
              const ok = await confirm({
                title: "Yakin hapus SEMUA data?",
                message: "XP, level, streak, sesi, badge & preset custom hilang. Aksi tidak bisa undo.",
                confirmLabel: "Ya, Hapus",
                variant: "red",
              });
              if (!ok) return;
              try {
                const mod = await import("@/lib/deleteAll");
                await mod.deleteAllData(user?.uid ?? null);
                // clear local stores + refetch agar UI langsung kosong tanpa refresh manual
                const { useSessionStore } = await import("@/stores/sessionStore");
                useSessionStore.getState().clear();
                const { usePresetStore } = await import("@/stores/presetStore");
                usePresetStore.getState().clear();
                await useSessionStore.getState().fetch(user?.uid ?? null);
                await usePresetStore.getState().fetch(user?.uid ?? null);
                // reset settings UI ke default (localStorage sudah dibersihkan deleteAllData)
                const { defaultSettings: def } = await import("@/lib/settings");
                setSettings(def);
                await notify({
                  title: "Semua data terhapus",
                  message: "Sesi, badge, dan preset custom sudah dihapus permanen.",
                  variant: "yellow",
                });
                setReplaceConfirm("");
                setImportPreview(null);
              } catch (e) {
                await notify({
                  title: "Gagal hapus",
                  message: (e as Error).message,
                  variant: "red",
                });
              }
            }}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Hapus Semua Data
          </Button>
        </div>
      </Card>

      <Card deco="blue">
        <h3 className="font-black uppercase tracking-tight text-sm sm:text-base">Tentang</h3>
        <p className="mt-2 text-sm font-medium opacity-70 leading-relaxed">RunEase. Dibuat dari pelari, untuk pelari. Berfokus pada kemudahan agar kamu bisa berlari tanpa gangguan.</p>
        <p className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-50 break-words">© 2026 RunEase • Developed by Husni Mubarok</p>
      </Card>
    </div>
  );
}
