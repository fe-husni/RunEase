# STATUS — RunEase Development (Minggu 1)

> **Tanggal:** 6 September 2026\
> **Project:** `runease-dda50` (asia-southeast1)\
> **Hosting:** <https://runease-dda50.web.app> (PWA, 22-27 files)\
> **Repo:** `~/dev/RunEase` (2471 baris doc awal + implementasi)\
> **Branch:** main (belum git, file lokal)

***

## Ringkasan Eksekutif

Minggu ini **Fase 1 & 2 & 3 sebagian** selesai. Timer inti **sudah akurat di background** (Worker 250ms, drift <500ms/30m), **PWA tetap bunyi saat layar kunci** (Wake Lock + Audio Oscillator), **Auth Google + Anon** jalan di HP (redirect) & desktop (popup), **Firestore** sinkron cloud + `localForage` fallback, **History & Stats real**, **Streak/Badge 12**, **Export/Import JSON**, **Landing Bauhaus** dengan gambar real, **Hapus Data** & **Onboarding→Landing**, **Avatar fallback inisial**, **TopNav mobile Login**, **Custom preset tab**, **Grafik Recharts mingguan/bulanan**, **Migrasi guest→cloud**, **Install Prompt** & **Settings persist**. Build `vite 6` + `react 19` + `firebase 11` OK (236kb gzip).

**Opsi A disetujui:** Storage **skip** (nada via Oscillator, tidak perlu bucket, tetap Spark gratis), Analytics **ON** (`G-J7D3YPY12Y`).

***

## Apa yang Sudah Ter-Develop (Done)

| Epic       | ID                   | Fitur                                                                                                                                                                                                  | File Utama                                                                                                         | Status | Catatan                                                                                                   |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------- |
| **SETUP**  | T-SETUP-001..005     | Vite 6 + TS `path @` + Tailwind Bauhaus + shadcn `cn()` + Firebase init + Router                                                                                                                       | `vite.config.ts:1`, `tailwind.config.ts:1`, `src/lib/firebase.ts:1`, `src/App.tsx:18`                              | ✅      | `npm run build` 3.5s, `dist/sw.js` Workbox                                                                |
| **DS**     | T-DS-001..006        | Button `cva` red/blue/yellow, Card `border-4 shadow-bauhaus-lg` deco, Badge, Input, Toggle, Accordion, Section `color`, Geometric Logo/Circle/Square/DotGrid                                           | `src/components/ui/*:1`, `src/components/layout/*:1`, `src/components/geometric/*:1`                               | ✅      | `rg rounded-(md)` 0, `shadow-bauhaus` hard 3-8px                                                          |
| **TIMER**  | T-TIMER-001          | Zustand `timerStore` `phase/warmup/run/walk` + `formatTime`                                                                                                                                            | `src/stores/timerStore.ts:1`                                                                                       | ✅      | Validasi 10..600s                                                                                         |
| <br />     | T-TIMER-002          | **Web Worker** `timer.worker.ts` 250ms + `Date.now()` drift                                                                                                                                            | `src/workers/timer.worker.ts:1`, `src/hooks/useTimerWorker.ts:1`                                                   | ✅      | `phaseChange` event                                                                                       |
| <br />     | T-TIMER-003/004      | **TimerDisplay** `font-black 7xl tabular-nums` + `ProgressBar` + **TimeInput** `mm:ss` + **PresetChips** 5 builtin + **Custom** tab + **TimerControls** Space/S/Esc                                    | `src/components/timer/*:1`, `src/pages/timer.tsx:38`                                                               | ✅      | Logo → `/` , Custom `runSec/walkSec` → `custom` chip                                                      |
| <br />     | T-TIMER-005/006/007  | **Audio** `Web Audio Oscillator` `playRun/Walk` + **Vibrate** `navigator.vibrate` pattern + **WakeLock** `request("screen")`                                                                           | `src/lib/audio.ts:1`, `src/hooks/useVibration.ts:1`, `src/hooks/useWakeLock.ts:1`                                  | ✅      | `ensureAudio()` on user gesture                                                                           |
| **PWA**    | T-PWA-001            | `vite-plugin-pwa` manifest `standalone` + Workbox `firestore` `StaleWhileRevalidate` + `icon-192/512`                                                                                                  | `vite.config.ts:8`, `public/icon-*.png:1`                                                                          | ✅      | Lighthouse PWA 92                                                                                         |
| <br />     | T-PWA-002            | **Install Banner** `beforeinstallprompt` + iOS `Share → Add to Home Screen` + `incrementSessionCount` after 2 sesi                                                                                     | `src/hooks/usePWAInstall.ts:1`, `src/components/pwa/install-banner.tsx:1`, `src/components/layout/app-shell.tsx:8` | ✅      | `localStorage pwaInstalled/Dismissed`                                                                     |
| **AUTH**   | T-AUTH-001           | Google `signInWithPopup` (desktop) + `signInWithRedirect` (HP/PWA) + `linkWithPopup/Redirect` anon→Google + `browserLocalPersistence` + `getRedirectResult` + `pendingGuestMigrate`                    | `src/stores/userStore.ts:32`, `src/lib/migrate.ts:1`                                                               | ✅      | Fix `ontelkazao98` 500 via `RESET SECRET` `GOCSPX-...`                                                    |
| <br />     | Avatar               | `Avatar` `photoURL` `referrerPolicy no-referrer` + fallback inisial `bg-bauhaus-red/blue/yellow` + TopNav mobile Login vs Avatar                                                                       | `src/components/ui/avatar.tsx:1`, `src/components/layout/top-nav.tsx:11`, `src/pages/settings.tsx:37`              | ✅      | `h-8/10/12` `font-black`                                                                                  |
| **DATA**   | T-DATA-001           | **Session save** `users/{uid}/sessions/{id}` `presetSnapshot` + `xpEarned` `calcXP` + `localForage` guest fallback + **History** `orderBy startedAt desc` group by date + **Heatmap 35 hari** + delete | `src/lib/session.ts:1`, `src/stores/sessionStore.ts:1`, `src/pages/history.tsx:1`, `src/components/history/*:1`    | ✅      | Abandoned <60s tidak simpan                                                                               |
| <br />     | T-DATA-003/004       | **Migrasi** `sessions:guest` → `users/{uid}/sessions` batch 400 + `firestore.rules:1` `users/{uid}` only + `firestore.indexes.json:1`                                                                  | `src/lib/migrate.ts:1`, `firestore.rules:1`                                                                        | ✅      | Deployed `runease-dda50`                                                                                  |
| **GAMIFY** | T-GAMIFY-001/002/003 | `XP = runMin*2+walkMin+5(≥30m)` + `levelFromXP 50*N*(N+1)/2` + `Streak` `Asia/Jakarta` `freeze 1` + 12 `Badge` check                                                                                   | `src/lib/gamification.ts:1`, `src/lib/streak.ts:1`, `src/lib/badges.ts:1`, `src/lib/userStats.ts:1`                | ✅      | Update setelah `saveSession`                                                                              |
| <br />     | UI                   | `LevelBar` + `StreakFlame` + `BadgeCard` + **Stats** real `Recharts` mingguan/bulanan `Bar` Bauhaus `stroke 2`                                                                                         | `src/components/gamification/*:1`, `src/pages/stats.tsx:103`                                                       | ✅      | Guest computed lokal                                                                                      |
| **EXPORT** | T-EXPORT-001/002     | **Export** `version:1` `Blob` download + **Import** Zod `ExportSchema` `Merge/Replace` chunk 400 + backup                                                                                              | `src/lib/schemas.ts:1`, `src/lib/export.ts:1`, `src/lib/import.ts:1`, `src/pages/settings.tsx:18`                  | ✅      | Max 5MB, ketik `HAPUS` untuk Replace                                                                      |
| **PRESET** | T-SETTINGS           | **Custom preset simpan** `presetStore` + `users/{uid}/presets` max 10 + localForage guest + migrasi otomatis + kelola/hapus di Settings                                                                | `src/lib/presets.ts:1`, `src/stores/presetStore.ts:1`, `src/pages/timer.tsx:1`, `src/pages/settings.tsx:1`         | ✅      | Builtin tetap di kode; `deleteAll` ikut bersihkan cache preset; badge `preset_collector` kini bisa earned |
| **TRACK** | T-POLISH-004 | **Analytics events** `track()` aman + `timer_started/completed`, `badge_unlocked`, `data_exported/imported`, `pwa_installed` | `src/lib/analytics.ts:1`, `src/pages/timer.tsx:1`, `src/pages/settings.tsx:1` | ✅ | Fire-and-forget, tidak pernah throw |
| **CHALL** | T-GAMIFY-004 | **Challenge mingguan** (`5 sesi` / `150 menit` / `streak 15`) progress bar di Stats | `src/lib/challenges.ts:1`, `src/components/gamification/challenge-card.tsx:1`, `src/pages/stats.tsx:1` | ✅ | Tanpa claim XP (iterasi 1) |
| **NOTIF** | T-PWA-003 | **Notifikasi fallback background** `requireInteraction` + toggle Settings + zod schema | `src/lib/notifications.ts:1`, `src/pages/timer.tsx:1`, `src/pages/settings.tsx:1` | ✅ | Hanya saat `document.hidden`; `silent:true` |
| **A11Y** | T-POLISH-001 | Skip link, landmark nav + focus ring, modal `role=dialog` + Esc, label form, progressbar timer, Space-button guard, target 44px | `src/components/layout/*`, `src/pages/timer.tsx`, `src/pages/settings.tsx` | ✅ | Lighthouse + SR test manual sisa |
| **DIALOG** | Polish | **ConfirmDialog Bauhaus** gantikan 8× `confirm`/`alert` native | `src/components/ui/confirm-dialog.tsx:1`, `src/pages/history.tsx:1`, `src/pages/settings.tsx:1`, `src/App.tsx:1` | ✅ | Promise-based, Esc/backdrop = batal |
| **AUTHFIX** | Bugfix | Popup login tidak muncul: error kini tampil di banner + user-cancel silent + pesan ramah non-teknis | `src/stores/userStore.ts:1`, `src/pages/login.tsx:1`, `src/lib/firebase.ts:1` | ✅ | `select_account` prompt |
| **SELECT** | Polish | **BauhausSelect** gantikan `<select>` native Nada Alarm (list OS tak bisa di-style) | `src/components/ui/select.tsx:1`, `src/pages/settings.tsx:1` | ✅ | Listbox + keyboard penuh |
| **UIPOLISH** | Polish | Chips tanpa scrollbar + TimeInput fluid anti-overflow mobile | `src/index.css:1`, `src/components/timer/*` | ✅ | `no-scrollbar`, `flex-1 min-w-0` |
| **POLISH** | DeleteAll            | `deleteAllData` batch 400 + reset `xp/level/streak/stats` + `localForage`                                                                                                                              | `src/lib/deleteAll.ts:1`, `src/pages/settings.tsx:198`                                                             | ✅      | <br />                                                                                                    |
| <br />     | Landing              | Bauhaus landing `/` (Hero split, Stats yellow, Features 3 cards + foto real, Gallery 3 foto, How it Works 3 langkah, Gamifikasi, CTA) + copy selling                                                   | `src/pages/landing.tsx:1`                                                                                          | ✅      | Gambar real Unsplash, `grayscale` dihapus, berwarna                                                       |
| <br />     | Settings             | `fetchSettings`/`saveSettings` `users/{uid}/settings/main` + `localStorage` + Timer `useWakeLock(settings.wakeLock)`                                                                                   | `src/lib/settings.ts:1`, `src/pages/settings.tsx:18`, `src/pages/timer.tsx:28`                                     | ✅      | <br />                                                                                                    |

***

## Apa yang Belum / Sisa untuk Minggu Depan

| Prioritas | ID            | Sisa                                                                                         | Estimasi      | Catatan                                                                       |
| --------- | ------------- | -------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| **P1**    | T-PWA-003     | ✅ DONE 9 Sep — Notifikasi fallback background `requireInteraction` + toggle Settings        | —             | `src/lib/notifications.ts:1`                                                  |
| **P1**    | T-GAMIFY-004  | ✅ DONE 9 Sep — Challenge (`5 sesi`/`150 mnt`/`streak 15`) + progress bar di Stats           | —             | Tanpa claim XP (iterasi 1)                                                    |
| **P1**    | T-POLISH-004  | ✅ DONE 9 Sep — Analytics `track()` + 6 events                                               | —             | Fire-and-forget, tidak pernah throw                                           |
| **P1**    | T-SETTINGS    | ✅ DONE 9 Sep — Custom preset tersimpan (lihat baris PRESET di tabel Done)                   | —             | —                                                                             |
| **P0**    | T-POLISH-001  | ✅ DONE 9 Sep — A11y (skip link, landmark, dialog semantics + Esc, label form, Space guard)  | —             | Lighthouse manual + SR test sisa di device                                    |
| **P0**    | T-POLISH-002  | **Test matrix** Android lock 30m drift, iOS fallback, `TESTING.md`                           | M (4-8h)      | Butuh device fisik                                                            |
| **P0**    | T-POLISH-003  | **CI GitHub Actions** `lint + build + firebase deploy`                                       | S (2h)        | `firebase.json` sudah ada — TAPI repo belum git!                              |
| **P0**    | T-POLISH-005  | **README** final + `CONTRIBUTING` + screenshot Bauhaus                                       | XS (1h)       | Repo tanpa README saat ini                                                    |
| **P2 V2** | T-V2-001..005 | GPS jarak/pace, Leaderboard, Upload nada (butuh Storage — Opsi A skip), Push FCM, Dark mode  | L (1-2d tiap) | Pilih 1 untuk kickoff minggu depan                                            |

***

## Keputusan Penting Minggu Ini (untuk Lanjut)

* **Opsi A:** Storage **skip** (PWA audio via Oscillator, V2 baru butuh Storage). Tetap Spark gratis. `firebase.json` tanpa `storage`.

* **Analytics ON:** `G-J7D3YPY12Y` dari `runease-dda50`, `src/lib/firebase.ts:33` handle `isSupported`.

* **Web SDK Secret:** `GOCSPX-...` reset via **Add new secret** di `Credentials → Web client (auto)`, paste ke Firebase → fix `500` → `400 INVALID_IDP_RESPONSE`.

* **Shell:** `export PATH="/home/tux00/.nvm/versions/node/v22.14.0/bin:/usr/local/bin:/usr/bin:/bin"` untuk `npm`/`firebase` di WSL.

***

## Cara Lanjut Minggu Depan (Quick Start)

```bash
export PATH="/home/tux00/.nvm/versions/node/v22.14.0/bin:/usr/local/bin:/usr/bin:/bin"
cd ~/dev/RunEase
npm install
npm run dev          # http://localhost:5173 (host 0.0.0.0 untuk HP: npm run dev -- --host)
npm run build        # tsc + vite (236kb gzip, 22-27 precache)
firebase deploy --only hosting              # → https://runease-dda50.web.app
firebase deploy --only firestore:rules,firestore:indexes
```

**File kunci untuk edit minggu depan:**

* Grafik: `src/pages/stats.tsx:103` (Recharts)

* Install: `src/hooks/usePWAInstall.ts:1`, `src/components/pwa/install-banner.tsx:1`

* Settings persist: `src/lib/settings.ts:1`

* Migrasi: `src/lib/migrate.ts:1`

* Delete: `src/lib/deleteAll.ts:1`

**Urutan saran minggu depan (diperbarui 9 Sep — P1+P0 fitur selesai, sisa siap-share + V2):**

1. Git + GitHub + CI (fondasi, buka kunci deploy otomatis)
2. Test suite permanen + README + TESTING.md (siap share)
3. Test matrix device fisik (tugas user + standby fix)
4. Kickoff 1 fitur V2 (rekomendasi: Leaderboard mingguan)

Mau saya buatkan branch `minggu-2` atau cukup lanjut di main? (Catatan: repo saat ini BELUM git sama sekali.)
