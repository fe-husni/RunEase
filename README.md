# RunEase — Run-Walk Interval Timer PWA

![CI](https://github.com/fe-husni/RunEase/actions/workflows/ci.yml/badge.svg)

PWA timer interval untuk metode latihan **Run-Walk (Jeff Galloway)**: atur durasi Lari/Jalan,
mulai sesi, dan aplikasi looping ganti fase otomatis dengan **alarm + getar** bahkan saat
layar terkunci (Chrome foreground + Wake Lock + Web Worker + Service Worker).

**Live:** https://runease-dda50.web.app

![RunEase logo](public/logo/primary-logo.png)

## Fitur

- **Timer akurat di background** — Dedicated Web Worker tick 250ms + koreksi `Date.now()`
  (`src/workers/timer.worker.ts`), bukan `setInterval` di main thread
- **Alarm + getar + Wake Lock** — Web Audio Oscillator (tanpa file mp3), pola vibrate per fase,
  indikator "layar tetap menyala" (`src/lib/audio.ts`, `src/hooks/useVibration.ts`, `src/hooks/useWakeLock.ts`)
- **PWA installable** — manifest standalone + Workbox, banner install setelah 2 sesi, panduan iOS
- **Auth Google + mode tamu** — popup (desktop) / redirect (HP/PWA), anonim bisa coba tanpa login,
  migrasi data lokal → cloud saat login (`src/stores/userStore.ts`, `src/lib/migrate.ts`)
- **History & statistik real** — list grup per tanggal, heatmap, grafik Recharts mingguan/bulanan
- **Gamifikasi** — XP/Level, streak zona `Asia/Jakarta`, 12 badge, challenge mingguan di Stats
- **Custom preset tersimpan** — 5 bawaan + maks 10 custom per user, sync Firestore
- **Export/Import JSON** — versioned `version:1`, validasi Zod, mode Merge/Replace + backup otomatis
- **Settings persist** — nada/volume, getar, wake lock, bahasa; tersimpan cloud + lokal
- **Notifikasi fallback** — `requireInteraction` saat dokumen hidden

## Tech Stack

| Lapisan | Pilihan |
|---|---|
| Build | Vite 6 + React 19 + TypeScript |
| Style | Tailwind 3.4 + shadcn/ui + Bauhaus design system (`DESIGNSYSTEM.md`) |
| State | Zustand (`src/stores/`) |
| Backend | Firebase 11: Auth, Firestore, Hosting, Analytics |
| Offline | Firestore persistence + localForage (mode tamu) |
| Grafik | Recharts |
| Validasi | Zod |
| PWA | vite-plugin-pwa (Workbox) |
| CI/CD | GitHub Actions → Firebase Hosting |

## Mulai Cepat

```bash
# Di WSL (sesuaikan path node bila beda)
export PATH="/home/tux00/.nvm/versions/node/v22.14.0/bin:/usr/local/bin:/usr/bin:/bin"
cd ~/dev/RunEase

npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + vite → dist/
npm run lint         # eslint, 0 warning
npm run test:run     # vitest (belum ada test file, lihat TESTING.md)
```

## Setup Env

```bash
cp .env.example .env
```

Isi 8 key dari Firebase Console → Project Settings → General → Your apps → SDK Config
(`FIREBASE_SETUP.md` Fase A2):

```
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID,
VITE_FIREBASE_APP_ID, VITE_FIREBASE_MEASUREMENT_ID, VITE_APP_VERSION
```

`.env` sudah di-`.gitignore` — jangan pernah commit. Untuk CI, 8 key yang sama wajib
diisi sebagai GitHub Secrets (lihat `.github/workflows/ci.yml`).

## Deploy

Otomatis via GitHub Actions (`.github/workflows/ci.yml`):

| Event | Hasil |
|---|---|
| Push ke `main` | `verify` → build → deploy **live** ke `runease-dda50.web.app` |
| Pull Request | `verify` → build → **preview channel**, expired 7 hari |

Butuh secret `FIREBASE_SERVICE_ACCOUNT_RUNEASE_DDA50` + 8 `VITE_*` di
Repo → Settings → Secrets and variables → Actions.

Manual (cadangan):

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only firestore:rules,firestore:indexes   # rules manual, tidak via CI
```

## Struktur Project

```
src/
  pages/         landing, timer, history, stats, settings, login
  components/    ui/ layout/ timer/ history/ gamification/ pwa/ onboarding/ geometric/ brand/
  stores/        timerStore, userStore, presetStore, sessionStore (Zustand)
  workers/       timer.worker.ts (detak 250ms)
  hooks/         useTimerWorker, useWakeLock, useVibration, usePWAInstall
  lib/           firebase, audio, session, presets, gamification, streak, badges,
                 challenges, export, import, schemas, migrate, settings,
                 deleteAll, analytics, notifications
  types/         timer, user, preset, session
```

## Rute

| Path | Halaman |
|---|---|
| `/` | Landing |
| `/timer` | Timer (prioritas #1, bisa tanpa login) |
| `/history` | Riwayat + heatmap |
| `/stats` | Level, streak, grafik, challenge, badge |
| `/settings` | Suara, getar, layar, bahasa, data, tentang |
| `/login` | Login Google |

## Dokumen

- `PRD.md` — kebutuhan produk + acceptance criteria
- `DATABASE.md` — skema Firestore
- `DESIGNSYSTEM.md`, `STYLEGUIDE.md` — aturan Bauhaus (wajib baca sebelum ubah UI)
- `IMPLEMENTATION_PLAN.md` — arsitektur
- `TASKS.md` — backlog ber-ID (`T-...`)
- `STATUS.md` — status mingguan
- `TESTING.md` — matriks test device + cara uji
- `FIREBASE_SETUP.md` — setup Firebase langkah demi langkah
- `CONTRIBUTING.md` — cara kontribusi

## Status & Roadmap

Fase 1 (Timer+PWA+Auth), 2 (Data), 3 (Gamify), 4 (Polish) inti selesai — lihat `STATUS.md`.
Sisa: test matrix device fisik + 1 fitur V2 (rekomendasi: leaderboard mingguan).
Backlog V2: GPS tracking, leaderboard, upload nada custom, push FCM, dark mode.
