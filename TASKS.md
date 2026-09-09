# TASKS — RunEase Run-Walk Interval Timer

> **Versi:** 1.0  
> **Tanggal:** 5 September 2026  
> **Sumber Kebenaran:** `PRD.md:1`, `DATABASE.md:1`, `STYLEGUIDE.md:1`, `DESIGNSYSTEM.md:1`  
> **Stack:** Vite + React + TS + Tailwind + shadcn/ui + Firebase  
> **Style:** Bauhaus Constructivist

---

## Cara Pakai Dokumen Ini

- **ID Format:** `T-{EPIC}-{NUM}` contoh `T-SETUP-001`. EPIC = `SETUP|DS|TIMER|PWA|AUTH|DATA|GAMIFY|POLISH`
- **Prioritas:** `P0` Must (MVP blocker), `P1` Should (V1.1), `P2` Could (V2/nice-to-have)
- **Estimasi:** `XS` <2h, `S` 2-4h, `M` 4-8h, `L` 1-2d, `XL` >2d
- **Status:** `TODO | DOING | REVIEW | DONE`
- **Urutan Eksekusi:** Ikuti **Fase 1 → 4** di `PRD.md:10`. Jangan lompat ke Gamifikasi sebelum Timer stabil.
- **Definition of Done (DoD):** Kode + Bauhaus style + a11y + test manual di device + update doc jika schema berubah

**Board yang disarankan (GitHub Projects / Linear):**
`Backlog → Todo (Fase 1) → Doing → Review → Done`

---

## Roadmap Ringkas (PRD Fase)

| Fase | Fokus | Durasi | Task Utama | Exit Criteria |
|------|-------|--------|------------|---------------|
| **Fase 1 MVP** | Timer inti + PWA + Auth | Minggu 1-2 | T-SETUP, T-DS, T-TIMER, T-PWA, T-AUTH | Timer 2:00/1:00 looping 30m tanpa drift, bunyi+getar saat lock, login Google jalan |
| **Fase 2 Data** | Firestore + History + Offline + Export/Import | Minggu 3 | T-DATA | History sync antar device, export/import 100% akurat |
| **Fase 3 Gamify** | XP/Level/Streak/Badge/Challenge | Minggu 4 | T-GAMIFY | Streak + badge muncul otomatis, level curve benar |
| **Fase 4 Polish** | Landing, Onboarding, Install, QA, Deploy | Minggu 5 | T-POLISH | Lighthouse PWA ≥90, ter-deploy di Firebase Hosting |

---

## EPIC 0 — SETUP & INFRA (Fondasi)

### T-SETUP-001 — Inisialisasi Proyek Vite + TS + Lint
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** —
- **Deskripsi:** `npm create vite@latest` react-ts, setup ESLint + Prettier + `eslint-plugin-tailwindcss` (class sort), `tsconfig` path alias `@/*`, `.gitignore`, `README.md`.
- **Acceptance:**
  - [ ] `npm run dev` jalan di `http://localhost:5173`
  - [ ] `npm run build` sukses, `npm run lint` 0 error
  - [ ] Path alias `@/components` bekerja
- **File:** `package.json:1`, `vite.config.ts:1`, `tsconfig.json:1`, `.eslintrc.json:1`
- **Ref:** `DESIGNSYSTEM.md:3`

### T-SETUP-002 — Tailwind + Outfit + Token Bauhaus
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-001
- **Deskripsi:** Install Tailwind 3.4, init `tailwind.config.ts` dengan token Bauhaus (red #D02020, blue #1040C0, yellow #F0C020, black #121212, gray #F0F0F0), `src/index.css` import Outfit 400/500/700/900, `boxShadow` hard 3/4/6/8px.
- **Acceptance:**
  - [ ] Token `bg-bauhaus-red` etc. bekerja
  - [ ] `font-outfit` ter-apply di body
  - [ ] Tidak ada `rounded-md` default — hanya `rounded-none`/`rounded-full` yang diizinkan
- **File:** `tailwind.config.ts:1`, `postcss.config.js:1`, `src/index.css:1`
- **Ref:** `DESIGNSYSTEM.md:4`, `STYLEGUIDE.md:3-5`

### T-SETUP-003 — shadcn/ui + lucide + utils
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-002
- **Deskripsi:** `npx shadcn-ui@latest init`, install `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`. Buat `src/lib/utils.ts:1` helper `cn()`.
- **Acceptance:**
  - [ ] `cn("px-2", "px-4")` merge dengan benar
  - [ ] `lucide-react` tree-shake (import per icon)
- **File:** `components.json:1`, `src/lib/utils.ts:1`
- **Ref:** `DESIGNSYSTEM.md:3`

### T-SETUP-004 — Firebase Project + Env
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-001
- **Deskripsi:** Buat project Firebase (asia-southeast1), enable Auth Google, Firestore Native, Storage, Hosting. Buat `.env` + `.env.example` (`VITE_FIREBASE_*`), `src/lib/firebase.ts:1` init + `enableIndexedDbPersistence`. Setup `firestore.rules:1` + `storage.rules:1` placeholder uid-based.
- **Acceptance:**
  - [ ] `src/lib/firebase.ts` export `app, auth, db, storage`
  - [ ] Persistence enabled, `synchronizeTabs: true`
  - [ ] Rules deny all kecuali `request.auth.uid == uid`
- **File:** `src/lib/firebase.ts:1`, `.env.example:1`, `firestore.rules:1`, `storage.rules:1`, `firebase.json:1`
- **Ref:** `DATABASE.md:2`, `DATABASE.md:5`

### T-SETUP-005 — Struktur Folder & Routing
- **Prioritas:** P0 | **Estimasi:** XS | **Status:** TODO | **Dep:** T-SETUP-001
- **Deskripsi:** Buat folder `src/components/ui`, `layout`, `timer`, `gamification`, `geometric`, `lib`, `stores`, `workers`, `hooks`, `pages`. Setup `react-router-dom` dengan routes `/`, `/timer`, `/history`, `/stats`, `/settings`, `/login`. Buat `AppShell` placeholder.
- **Acceptance:**
  - [ ] Navigasi antar page bekerja tanpa reload
  - [ ] Struktur folder sesuai `DESIGNSYSTEM.md:1.3`
- **File:** `src/App.tsx:1`, `src/main.tsx:1`, `src/pages/*.tsx:1`
- **Ref:** `DESIGNSYSTEM.md:1.3`

---

## EPIC 1 — DESIGN SYSTEM BAUHAUS (DS)

> **Aturan Keras:** Semua komponen di epic ini harus lolos checklist `DESIGNSYSTEM.md:11` & `STYLEGUIDE.md:16`. Jika ada `rounded-md` / `shadow-md` / `gradient`, fail review.

### T-DS-001 — Primitives: Button (cva + Bauhaus)
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-003
- **Deskripsi:** Override `src/components/ui/button.tsx:1` dengan `cva` variants `red/blue/yellow/outline/ghost` + `shape square/pill` + `size sm/default/lg/icon`. Kelas wajib: `border-2 border-bauhaus-black shadow-bauhaus active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold uppercase tracking-wider`.
- **Acceptance:**
  - [ ] 5 varian + 2 shape + 4 size render benar
  - [ ] Hover `bg-{color}/90`, active press-down, focus ring biru
  - [ ] Story di `/dev` atau screenshot
- **File:** `src/components/ui/button.tsx:1`
- **Ref:** `DESIGNSYSTEM.md:5.1`, `STYLEGUIDE.md:6.1`

### T-DS-002 — Primitives: Card + Deco
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-003
- **Deskripsi:** `src/components/ui/card.tsx:1` — `bg-white border-4 border-bauhaus-black shadow-bauhaus-lg rounded-none p-6 sm:p-8 hover:-translate-y-1`. Prop `deco: red|blue|yellow` untuk lingkaran/kotak/segitiga 12px di pojok `-top-2 -right-2`.
- **Acceptance:**
  - [ ] Deco wajib muncul (tidak opsional)
  - [ ] Hover lift 1px
- **File:** `src/components/ui/card.tsx:1`
- **Ref:** `DESIGNSYSTEM.md:5.2`, `STYLEGUIDE.md:6.2`

### T-DS-003 — Primitives: Input, Badge, Accordion, Toggle
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-SETUP-003
- **Deskripsi:**
  - `Input`: `bg-white border-2 border-bauhaus-black rounded-none shadow-bauhaus-sm`
  - `Badge`: `cva` red/blue/yellow/outline, `rounded-full border-2 font-bold uppercase tracking-widest text-xs`
  - `Accordion` (Radix): closed white + border-4, open header red, content #FFF9C4 + border-t-4
  - `Toggle`: `w-12 h-6 bg-white border-2 border-bauhaus-black rounded-full` knob
- **Acceptance:**
  - [ ] Semua punya `focus-visible:ring`
  - [ ] Accordion chevron `rotate-180 duration-300`
- **File:** `src/components/ui/input.tsx:1`, `badge.tsx:1`, `accordion.tsx:1`, `toggle.tsx:1`
- **Ref:** `DESIGNSYSTEM.md:5.3-5.4`

### T-DS-004 — Layout: Section, AppShell, Nav (Top + Bottom)
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-DS-001, T-DS-002
- **Deskripsi:**
  - `Section`: prop `color gray|blue|yellow|red|black` → `py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-b-4 border-bauhaus-black`
  - `TopNav`: sticky, `border-b-4`, logo geometris 3 bentuk + nav links + Button red pill
  - `BottomNav` (mobile): `fixed bottom-0 border-t-4`, 4 tab Timer/Riwayat/Stat/Atur, active `bg-bauhaus-black text-white rounded-full`
  - `AppShell`: `max-w-md` centered untuk app, `max-w-7xl` untuk landing
- **Acceptance:**
  - [ ] TopNav hamburger `md:hidden`
  - [ ] BottomNav tap target 44px
  - [ ] Section color blocking full width
- **File:** `src/components/layout/section.tsx:1`, `app-shell.tsx:1`, `top-nav.tsx:1`, `bottom-nav.tsx:1`
- **Ref:** `DESIGNSYSTEM.md:6`, `STYLEGUIDE.md:7,9`

### T-DS-005 — Geometric Primitives: DecoCircle/Square/Triangle + DotGrid + Logo
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-002
- **Deskripsi:** `src/components/geometric/deco.tsx:1` — `DecoCircle`, `DecoSquare` (prop `rotate`), `DecoTriangle` (clip-path), `DotGrid` (radial-gradient 20px), `GeometricLogo` (3 bentuk + "RunEase" font-black uppercase tracking-tighter).
- **Acceptance:**
  - [ ] Logo dipakai di TopNav
  - [ ] DotGrid opacity 0.05 tidak ganggu teks
- **File:** `src/components/geometric/deco.tsx:1`, `geometric-logo.tsx:1`
- **Ref:** `DESIGNSYSTEM.md:7`, `STYLEGUIDE.md:8.2,11`

### T-DS-006 — Typography & Global Polish
- **Prioritas:** P0 | **Estimasi:** XS | **Status:** TODO | **Dep:** T-SETUP-002
- **Deskripsi:** Pastikan `Outfit` import, `tabular-nums` untuk timer, `font-black uppercase tracking-tighter` untuk headline, `prefers-reduced-motion` reduce, `focus-visible` ring.
- **Acceptance:**
  - [ ] Timer angka tidak loncat saat countdown
  - [ ] `rg "rounded-(md|lg|xl)"` = 0, `rg "shadow-(md|lg)"` = 0, `rg "gradient"` = 0
- **File:** `src/index.css:1`
- **Ref:** `DESIGNSYSTEM.md:11`

---

## EPIC 2 — TIMER ENGINE (Inti Produk)

### T-TIMER-001 — Timer Store (Zustand) + Types
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-005
- **Deskripsi:** `src/stores/timerStore.ts:1` — state `phase: warmup|run|walk|cooldown|idle`, `remainingSec`, `totalElapsedSec`, `setsCompleted`, `isRunning`, `isPaused`, `config: {runSec, walkSec, warmupSec, cooldownSec, mode, target}`. Actions `setConfig`, `start`, `pause`, `resume`, `skip`, `stop`, `reset`. Validasi `runSec/walkSec >=10`.
- **Acceptance:**
  - [ ] Store unit test (vitest) untuk transisi fase
  - [ ] Tidak ada logic `setInterval` di store — hanya pure state
- **File:** `src/stores/timerStore.ts:1`, `src/types/timer.ts:1`
- **Ref:** `PRD.md:5.1`

### T-TIMER-002 — Web Worker Timer (Akurasi)
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-TIMER-001
- **Deskripsi:** `src/workers/timer.worker.ts:1` — Dedicated Worker yang terima `postMessage({type:'start', runSec, walkSec, ...})`, pakai `setInterval 250ms` + `Date.now()` drift correction, kirim `postMessage({type:'tick', remaining, phase, elapsed})` dan `phaseChange`. Main thread `src/hooks/useTimerWorker.ts:1` untuk bridge ke store. **Dilarang `setInterval` di main thread.**
- **Acceptance:**
  - [ ] 30 menit test drift <500ms (bandingkan `Date.now` vs expected)
  - [ ] Saat tab background 5m, tetap akurat setelah foreground
  - [ ] Worker terminate saat stop
- **File:** `src/workers/timer.worker.ts:1`, `src/hooks/useTimerWorker.ts:1`
- **Ref:** `PRD.md:5.1`, `PRD.md:11` (risiko throttle)

### T-TIMER-003 — TimerDisplay + ProgressBar (Bauhaus)
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-TIMER-001, T-DS-002
- **Deskripsi:** `src/components/timer/timer-display.tsx:1` — Card Bauhaus `min-h-[50vh]` centered, badge fase `LARI` (red) / `JALAN` (blue) / `WARMUP` (yellow) pill + `border-2 shadow-bauhaus-sm`, angka `font-black text-7xl sm:text-8xl tracking-tighter leading-[0.9] tabular-nums`, progress bar `h-3 bg-white border-2 border-bauhaus-black rounded-none` + inner `bg-bauhaus-red/blue` transition 1s, info `SET X • BERIKUTNYA`.
- **Acceptance:**
  - [ ] `aria-live="polite"` untuk screen reader
  - [ ] Warna fase benar (run red, walk blue)
  - [ ] `memo` agar tidak re-render berlebihan tiap 250ms
- **File:** `src/components/timer/timer-display.tsx:1`, `progress-bar.tsx:1`, `phase-badge.tsx:1`
- **Ref:** `DESIGNSYSTEM.md:3 Fase D`, `STYLEGUIDE.md:12.1`

### T-TIMER-004 — TimerControls + PresetChips
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-TIMER-001, T-DS-001
- **Deskripsi:**
  - `TimerControls`: 3 tombol besar — `PAUSE` (yellow), `SKIP` (outline), `STOP` (red) — `grid-cols-3 gap-4`, juga handle `Space` pause, `S` skip, `Esc` stop. Saat `idle` tampilkan `MULAI` (red, lg, full width).
  - `PresetChips`: horizontal scroll `flex gap-2 overflow-x-auto`, `Badge` pill active `bg-bauhaus-blue text-white`, inactive `bg-white`. 5 bawaan + custom.
  - `TimeInput`: dua input `mm`/`ss` dengan `:` tengah, `font-black text-4xl tabular-nums`
- **Acceptance:**
  - [ ] Keyboard shortcuts bekerja
  - [ ] Tap target 44px, `focus-visible` ring
  - [ ] Preset select update store config
- **File:** `src/components/timer/timer-controls.tsx:1`, `preset-chips.tsx:1`, `time-input.tsx:1`
- **Ref:** `PRD.md:5.1, 5.4`

### T-TIMER-005 — Audio Engine (Web Audio API)
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-TIMER-002
- **Deskripsi:** `src/lib/audio.ts:1` — Buat `AudioContext` singleton, preload `public/sounds/beep.mp3`, `bell.mp3` jadi `AudioBuffer` via `fetch + decodeAudioData`. Fungsi `playSound(soundId, volume)` + `playBeep()` fallback via `OscillatorNode` jika file gagal. Support `voice` via `speechSynthesis` ("Ayo Lari!"). Volume 0-100 dari settings. Fungsi `testSound()`.
- **Acceptance:**
  - [ ] Preload tidak block UI (async)
  - [ ] Saat phaseChange, suara bunyi dalam <100ms
  - [ ] Di background (PWA), audio tetap bunyi (test Android)
  - [ ] Fallback Oscillator jika file 404
- **File:** `src/lib/audio.ts:1`, `public/sounds/*.mp3:1`, `src/hooks/useAudio.ts:1`
- **Ref:** `PRD.md:5.2`

### T-TIMER-006 — Haptics (Vibrate) + Fallback
- **Prioritas:** P0 | **Estimasi:** XS | **Status:** TODO | **Dep:** T-TIMER-002
- **Deskripsi:** `src/hooks/useVibration.ts:1` — `vibrate(pattern)` cek `if ('vibrate' in navigator)`, pattern Run `[400,100,400]`, Walk `[200,100,200,100,200]`, Warmup `[600]`. Jika tidak support (iOS), tampilkan badge "Getar tidak tersedia di iOS" di Settings, jangan error.
- **Acceptance:**
  - [ ] Android bergetar sesuai pattern
  - [ ] iOS tidak crash, tampilkan info
  - [ ] Toggle vibrate di settings matikan semua
- **File:** `src/hooks/useVibration.ts:1`
- **Ref:** `PRD.md:5.2`

### T-TIMER-007 — Wake Lock + Visibility Handling
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-TIMER-002
- **Deskripsi:** `src/hooks/useWakeLock.ts:1` — `navigator.wakeLock.request('screen')` saat `isRunning`, `release()` saat pause/stop. Listen `visibilitychange` → re-request saat kembali visible. Tampilkan indikator "Layar tetap menyala" (dot hijau + teks `text-xs font-bold uppercase tracking-widest`). Handle `NotAllowedError` gracefully.
- **Acceptance:**
  - [ ] Saat timer jalan, `document.wakeLock` aktif (cek di DevTools)
  - [ ] Saat pause, release
  - [ ] Saat tab hidden → visible, re-request
- **File:** `src/hooks/useWakeLock.ts:1`
- **Ref:** `PRD.md:5.3`

### T-TIMER-008 — Halaman Timer Integrasi + Ringkasan Sesi
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-TIMER-003, T-TIMER-004, T-TIMER-005, T-TIMER-006, T-TIMER-007
- **Deskripsi:** `src/pages/timer.tsx:1` — Gabungkan semua: preset chips di top, time inputs, TimerDisplay, Controls, stats ringkas `Set X | Total 12:34`. Saat `stop`/`completed`, tampilkan modal `Card` ringkasan: durasi, sets, XP earned (jika login), tombol `SIMPAN` / `BUANG` (<60 detik = abandoned, tidak simpan). Trigger `audio` + `vibrate` di `phaseChange` effect.
- **Acceptance:**
  - [ ] Alur `US-01` sd `US-04` selesai tanpa bug
  - [ ] Countdown 3-2-1 opsional beep kecil sebelum ganti fase (jika `countdownBeep` on)
  - [ ] Modal ringkasan Bauhaus (bukan alert generik)
- **File:** `src/pages/timer.tsx:1`, `src/components/timer/session-summary.tsx:1`
- **Ref:** `PRD.md:7 Flow 1`, `PRD.md:5.1`

---

## EPIC 3 — PWA & BACKGROUND

### T-PWA-001 — Vite PWA Plugin + Manifest + SW
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-001
- **Deskripsi:** Install `vite-plugin-pwa`, config `VitePWA({ registerType: 'autoUpdate', includeAssets: ['favicon.ico', 'sounds/*.mp3'], manifest: { name: 'RunEase', short_name: 'RunEase', display: 'standalone', orientation: 'portrait', theme_color: '#D02020', background_color: '#F0F0F0', icons: [{src: 'icon-192.png', sizes:'192x192', type:'image/png'}, {src:'icon-512.png', sizes:'512x512'}] } })`. Generate icons Bauhaus (3 geometri).
- **Acceptance:**
  - [ ] Lighthouse PWA score ≥90
  - [ ] `manifest.json` valid, `service-worker.js` ter-generate
  - [ ] Installable di Android Chrome (prompt muncul)
- **File:** `vite.config.ts:1`, `public/icon-*.png:1`, `public/manifest.json:1` (auto)
- **Ref:** `PRD.md:5.3`, `DESIGNSYSTEM.md:3`

### T-PWA-002 — Install Prompt + iOS Instruksi
- **Prioritas:** P1 | **Estimasi:** S | **Status:** TODO | **Dep:** T-PWA-001
- **Deskripsi:** `src/hooks/usePWAInstall.ts:1` — tangkap `beforeinstallprompt`, simpan `deferredPrompt`, tampilkan banner Bauhaus `Card` yellow "Install RunEase" setelah 2 sesi. Untuk iOS, deteksi `navigator.standalone === false` → tampilkan instruksi "Add to Home Screen" dengan icon share.
- **Acceptance:**
  - [ ] Banner muncul setelah 2 sesi, bisa dismiss
  - [ ] Klik Install → `prompt()` → `userChoice` tracked
  - [ ] Event `pwa_installed` ke Analytics
- **File:** `src/hooks/usePWAInstall.ts:1`, `src/components/pwa/install-banner.tsx:1`
- **Ref:** `PRD.md:5.3`, `PRD.md:9`

### T-PWA-003 — Offline Shell + Fallback Notification
- **Prioritas:** P1 | **Estimasi:** S | **Status:** TODO | **Dep:** T-PWA-001
- **Deskripsi:** Workbox `runtimeCaching` untuk Firestore (stale-while-revalidate), precache shell (index.html, css, js). Jika audio diblokir saat background, fallback `new Notification("RunEase", {body: "Ganti ke LARI!", requireInteraction: true})` (minta permission `Notification.requestPermission()` saat onboarding).
- **Acceptance:**
  - [ ] Matikan internet, reload → shell tetap muncul
  - [ ] Timer tetap jalan offline
  - [ ] Notifikasi muncul jika audio fail
- **File:** `vite.config.ts:1` (workbox config), `src/lib/notifications.ts:1`
- **Ref:** `PRD.md:5.3`

---

## EPIC 4 — AUTH & DATA (Firebase)

### T-AUTH-001 — Google Sign-In + User Store + Anonymous
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-SETUP-004
- **Deskripsi:** `src/stores/userStore.ts:1` — `onAuthStateChanged` listener, state `user, loading, isAnonymous`. Fungsi `signInWithGoogle()` (popup + redirect fallback untuk PWA), `signInAnonymously()`, `logout()` (clear local cache), `linkAnonymousToGoogle()` untuk merge. Tampilkan avatar + nama di TopNav, `BottomNav` badge jika belum login.
- **Acceptance:**
  - [ ] Login Google sukses, `uid` tersimpan
  - [ ] Anonymous bisa pakai timer tanpa login
  - [ ] Saat anon login Google, modal "Gabungkan 2 sesi lokal?" muncul
- **File:** `src/stores/userStore.ts:1`, `src/hooks/useAuth.ts:1`, `src/pages/login.tsx:1`, `src/components/auth/login-button.tsx:1`
- **Ref:** `PRD.md:5.5`, `DATABASE.md:2.1`

### T-AUTH-002 — Seed Preset Bawaan + Preset CRUD
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-AUTH-001, T-SETUP-004
- **Deskripsi:** Saat user baru (anon atau google), seed 5 preset bawaan `builtin_*` ke `users/{uid}/presets` (atau `localForage` jika anon). Store `src/stores/presetStore.ts:1` — `fetchPresets`, `addPreset`, `updatePreset`, `deletePreset` (isBuiltIn tidak bisa dihapus), max 10 custom. Validasi `runSec/walkSec 10..600`. Firestore `enableIndexedDbPersistence` untuk offline.
- **Acceptance:**
  - [ ] User baru langsung punya 5 preset
  - [ ] Bisa buat custom "Pagi 3:1", simpan, muncul di chips
  - [ ] Max 10, error Bauhaus `Card` red jika lewat
- **File:** `src/stores/presetStore.ts:1`, `src/lib/seedPresets.ts:1`, `src/components/preset/preset-form.tsx:1`
- **Ref:** `PRD.md:5.4`, `DATABASE.md:3.2`

### T-DATA-001 — Session Save + History List
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-AUTH-001, T-TIMER-008
- **Deskripsi:** Saat sesi `completed` atau `stopped` (>60 detik), tulis ke `users/{uid}/sessions/{autoId}` dengan `presetSnapshot` denormalisasi, `startedAt/endedAt` serverTimestamp, `durationSec`, `setsCompleted`, `xpEarned` (hitung client dulu). `src/stores/sessionStore.ts:1` — `fetchSessions(limit 20, orderBy startedAt desc)`, `deleteSession` (soft delete atau hard delete dengan confirm). Jika anon, simpan di `localForage` key `runease:sessions`.
- **Acceptance:**
  - [ ] Sesi muncul di Firestore console
  - [ ] List history di `/history` group by date
  - [ ] Hapus sesi → hilang dari list
- **File:** `src/stores/sessionStore.ts:1`, `src/pages/history.tsx:1`, `src/components/history/session-card.tsx:1`
- **Ref:** `PRD.md:5.6`, `DATABASE.md:3.3`

### T-DATA-002 — History Heatmap + Grafik + Detail
- **Prioritas:** P1 | **Estimasi:** M | **Status:** TODO | **Dep:** T-DATA-001
- **Deskripsi:**
  - `Heatmap`: grid 7xN (minggu x hari) seperti GitHub, kotak `w-3 h-3 rounded-none border border-bauhaus-black`, warna `bg-bauhaus-yellow` opacity 0.2→1.0 sesuai durasi (0, 1-10m, 10-30m, 30m+).
  - `Grafik`: bar chart mingguan/bulanan (durasi total, jumlah sesi) — pakai `recharts` atau `chart.js` dengan style Bauhaus (bar `border-2 border-bauhaus-black`, warna solid).
  - `Detail`: breakdown Run vs Walk menit, presetSnapshot, tombol hapus.
- **Acceptance:**
  - [ ] Heatmap render 60 hari terakhir
  - [ ] Grafik responsive, `max-w-7xl`
- **File:** `src/components/history/heatmap.tsx:1`, `stats-chart.tsx:1`, `session-detail.tsx:1`, `src/pages/stats.tsx:1`
- **Ref:** `PRD.md:5.6`

### T-DATA-003 — Migrasi Anon → Cloud
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-AUTH-001, T-DATA-001, T-AUTH-002
- **Deskripsi:** `src/lib/migrate.ts:1` — `migrateLocalToCloud(uid)` baca `localForage` (`presets`, `sessions`), `writeBatch` ke Firestore (chunk 500), lalu `clear()` local. Panggil saat anon berhasil link ke Google. Tampilkan progress `Card` + preview "Akan menggabungkan 2 sesi, 1 preset".
- **Acceptance:**
  - [ ] Data anon tidak hilang setelah login
  - [ ] Batch chunk jika >500 sesi
- **File:** `src/lib/migrate.ts:1`
- **Ref:** `DATABASE.md:7`, `DATABASE.md:8`

### T-DATA-004 — Firestore Rules + Indexes
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-004
- **Deskripsi:** Tulis `firestore.rules:1` final (uid-based untuk users/presets/sessions/badges/settings), `firestore.indexes.json:1` untuk `sessions startedAt DESC`, `storage.rules:1` untuk `users/{uid}/sounds` max 1MB audio. Deploy via `firebase deploy --only firestore:rules`.
- **Acceptance:**
  - [ ] Test rules: baca `users/{otherUid}` denied (via emulator)
  - [ ] Index ter-create otomatis saat query pertama
- **File:** `firestore.rules:1`, `firestore.indexes.json:1`, `storage.rules:1`
- **Ref:** `DATABASE.md:5,6`

---

## EPIC 5 — EXPORT / IMPORT JSON

### T-EXPORT-001 — Export .json (Versioned)
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-DATA-001, T-AUTH-002
- **Deskripsi:** `src/lib/export.ts:1` — `exportData(uid)` ambil `user, presets, sessions, badges, settings` via `Promise.all(getDoc/getDocs)`, bentuk `{version:1, exportedAt, exportedBy, appVersion, data:{...}}`, `Blob` + `URL.createObjectURL` download `runease-export-YYYY-MM-DD.json`. Tombol di `Settings > Data` → `Card` yellow + `Button` red "EXPORT".
- **Acceptance:**
  - [ ] File terdownload, valid JSON, bisa dibuka di VS Code
  - [ ] `version:1` ada
- **File:** `src/lib/export.ts:1`, `src/pages/settings.tsx:1` (section Data)
- **Ref:** `DATABASE.md:8.1`, `PRD.md:5.8`

### T-EXPORT-002 — Import .json + Zod Validasi + Merge/Replace
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-EXPORT-001
- **Deskripsi:** `src/lib/import.ts:1` — Input file `.json` max 5MB, `JSON.parse` + `Zod` schema `ExportSchema` (cek version, field wajib). Tampilkan preview: "Ditemukan 12 sesi, 3 preset, 4 badge". Pilihan `Merge` (skip duplikat by id) vs `Replace` (hapus semua subkoleksi dulu, butuh ketik "HAPUS" + auto backup export sebelum replace). Tulis via `writeBatch` chunk 500. Update `users/{uid}.stats` via agregasi ulang. Event `data_imported`.
- **Acceptance:**
  - [ ] Import file export sendiri → merge skip duplikat
  - [ ] Replace → semua data lama hilang, data baru muncul
  - [ ] File invalid version → toast error Bauhaus red Card
  - [ ] Test cross-device: export di A, import di B → history identik 100%
- **File:** `src/lib/import.ts:1`, `src/lib/schemas.ts:1` (Zod), `src/components/settings/import-dialog.tsx:1`
- **Ref:** `DATABASE.md:8.2`, `PRD.md:5.8`

---

## EPIC 6 — GAMIFIKASI

### T-GAMIFY-001 — XP & Level Engine
- **Prioritas:** P1 | **Estimasi:** S | **Status:** TODO | **Dep:** T-DATA-001
- **Deskripsi:** `src/lib/gamification.ts:1` — `calcXP(durationSec, runSec, walkSec, sets)` = `floor(runMin*2 + walkMin*1) + bonus(5 jika >=30m)`. `levelFromXP(xp)` via curve `50*N*(N+1)/2`, `xpForNextLevel`. `titleForLevel(level)` tiap 10 level ("Pejuang Napas" etc.). Update `users/{uid}.xp` via `increment()`, `level` recompute. Tampilkan `LevelBar` di Home: `h-3 bg-white border-2 border-bauhaus-black` + `bg-bauhaus-yellow` progress.
- **Acceptance:**
  - [ ] 30m sesi 2:1 → XP benar (contoh: 20m run*2=40 +10m walk=10+5 bonus=55)
  - [ ] Level naik saat threshold
- **File:** `src/lib/gamification.ts:1`, `src/components/gamification/level-bar.tsx:1`, `src/hooks/useXP.ts:1`
- **Ref:** `PRD.md:5.7`, `DATABASE.md:3.1`

### T-GAMIFY-002 — Streak Logic (Client + Cloud Function)
- **Prioritas:** P1 | **Estimasi:** M | **Status:** TODO | **Dep:** T-DATA-001
- **Deskripsi:**
  - Client: `calcStreak(sessions)` — streak = hari berturut ada `completed` ≥10m, reset 00:00 Asia/Jakarta, `freezeTokens` 1/minggu.
  - Cloud Function `functions/src/index.ts:1` `onSessionCreated` trigger → hitung streak server-side (pakai `serverTimestamp`) agar anti-cheat, update `users/{uid}.streak`, `stats`.
  - Alternatif MVP tanpa Functions: client-only dengan `increment` + warning cheat (cukup untuk awal).
  - UI: `StreakFlame` di Home — api 🔥 + angka `font-black text-4xl`, kalender checkmark.
- **Acceptance:**
  - [ ] Streak +1 tiap hari ada sesi ≥10m
  - [ ] Lewat 1 hari → pakai freeze token jika ada, else reset 0
  - [ ] Ganti jam HP tidak cheat (jika pakai Functions)
- **File:** `src/lib/streak.ts:1`, `functions/src/index.ts:1`, `src/components/gamification/streak-flame.tsx:1`
- **Ref:** `PRD.md:5.7`, `DATABASE.md:9`

### T-GAMIFY-003 — Badge System (12 Badge)
- **Prioritas:** P1 | **Estimasi:** M | **Status:** TODO | **Dep:** T-GAMIFY-001, T-GAMIFY-002
- **Deskripsi:** `src/lib/badges.ts:1` — definisi 12 badge (first_step, streak_7/30, intervals_100, marathon_mini 60m, early_bird 5x 05-07, night_runner 5x 20-23, preset_collector 3 custom, explorer 5 preset beda, completist_20, veteran_500m, legend_10). Fungsi `checkBadges(user, sessions, presets)` → return newly earned. Simpan `users/{uid}/badges/{badgeId}: {earnedAt, seen}`. Trigger saat sesi selesai. UI `BadgeCard` grid `1→2→3 col`, `Card` dengan deco + icon `Award` + `bg-bauhaus-yellow/red/blue`.
- **Acceptance:**
  - [ ] Sesi pertama → badge "Langkah Pertama" muncul + toast
  - [ ] 7 hari streak → badge Konsisten 7
  - [ ] Badge belum earned → grayscale + `opacity-50`
- **File:** `src/lib/badges.ts:1`, `src/components/gamification/badge-card.tsx:1`, `src/pages/badges.tsx:1`
- **Ref:** `PRD.md:5.7`, `DATABASE.md:3.4`

### T-GAMIFY-004 — Challenge Mingguan/Bulanan
- **Prioritas:** P2 | **Estimasi:** S | **Status:** TODO | **Dep:** T-GAMIFY-001
- **Deskripsi:** `src/lib/challenges.ts:1` — definisi challenge statis: `weekly_5_sessions`, `weekly_150_min`, `monthly_streak_15`. Hitung progress tiap render Stats (atau via Functions). UI `ChallengeCard` di `/stats` — `Card` + progress bar + `Button` claim (jika ada reward XP).
- **Acceptance:**
  - [ ] Progress bar update realtime setelah sesi
  - [ ] Challenge selesai → badge/extra XP
- **File:** `src/lib/challenges.ts:1`, `src/components/gamification/challenge-card.tsx:1`
- **Ref:** `PRD.md:5.7`

---

## EPIC 7 — SETTINGS, ONBOARDING, POLISH

### T-SETTINGS-001 — Halaman Settings (Bauhaus Sections)
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-DS-003, T-DS-004, T-EXPORT-001
- **Deskripsi:** `src/pages/settings.tsx:1` — Sections `border-b-4` per grup: **Suara** (Select `beep/bell/voice`, slider Volume, Test button, Toggle voiceCoach, Toggle countdownBeep), **Getar** (Toggle vibrate + badge iOS), **Layar** (Toggle wakeLock), **Bahasa** (ID/EN), **Data** (Export/Import buttons + Hapus Semua Data dengan ketik "HAPUS"), **Tentang** (versi, FAQ accordion, link GitHub). Semua dalam `Card` + `Section`.
- **Acceptance:**
  - [ ] Test sound bunyi
  - [ ] Toggle vibrate off → tidak getar
  - [ ] Hapus data butuh konfirmasi 2 langkah
- **File:** `src/pages/settings.tsx:1`, `src/components/settings/*:1`
- **Ref:** `PRD.md:5.9`, `DATABASE.md:3.5`

### T-ONBOARD-001 — Onboarding 3 Slide + Permissions
- **Prioritas:** P1 | **Estimasi:** S | **Status:** TODO | **Dep:** T-DS-004, T-DS-005
- **Deskripsi:** `src/pages/onboarding.tsx:1` atau `src/components/onboarding.tsx:1` — 3 slide full-screen Bauhaus: 1) Apa itu Run-Walk + ilustrasi geometri, 2) Izinkan Suara & Getar (tombol `AKTIFKAN` → `Notification.requestPermission()` + `AudioContext.resume()`), 3) Pilih Preset pertama. Simpan `localStorage hasSeenOnboarding`. Tampilkan hanya sekali.
- **Acceptance:**
  - [ ] Slide bisa swipe / next
  - [ ] Permission success → lanjut
  - [ ] Skip onboarding → langsung ke timer
- **File:** `src/components/onboarding/onboarding.tsx:1`
- **Ref:** `PRD.md:7 Flow 1`

### T-LANDING-001 — Landing Page (Opsional, untuk Hosting)
- **Prioritas:** P2 | **Estimasi:** M | **Status:** TODO | **Dep:** T-DS-004, T-DS-005
- **Deskripsi:** `src/pages/landing.tsx:1` — Sections color blocking: Hero (kiri headline `LARI LEBIH JAUH` 8xl + CTA red pill, kanan komposisi geometri biru), Stats (kuning, 4 kolom), Features (3 card), How It Works (4 langkah dengan rotated square numbers), FAQ (accordion), Final CTA (kuning + deco circle/square 50% opacity), Footer (black). Semua `border-b-4`.
- **Acceptance:**
  - [ ] Responsive `text-4xl sm:text-6xl lg:text-8xl`
  - [ ] Tidak ada gradient/soft shadow
- **File:** `src/pages/landing.tsx:1`
- **Ref:** `DESIGNSYSTEM.md:6,7`

### T-POLISH-001 — Aksesibilitas & Keyboard & Reduced Motion
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** Semua DS + TIMER
- **Deskripsi:** Audit a11y: semua button `aria-label`, timer `aria-live="polite"`, focus ring `ring-bauhaus-blue`, tab order, screen reader test. Test `prefers-reduced-motion` (no animation). Tap target 44px, kontras AA.
- **Acceptance:**
  - [ ] Tab navigation lengkap tanpa mouse
  - [ ] VoiceOver baca countdown benar
  - [ ] Lighthouse Accessibility ≥95
- **File:** Semua `src/components/**/*.tsx:1`
- **Ref:** `PRD.md:6`, `STYLEGUIDE.md:13`

### T-POLISH-002 — Testing Manual Lintas Device
- **Prioritas:** P0 | **Estimasi:** M | **Status:** TODO | **Dep:** T-TIMER-008, T-PWA-001
- **Deskripsi:** Test matrix: Android Chrome PWA installed + layar terkunci 30m (alarm harus bunyi), Android Chrome tab background, iOS Safari (degradasi), Desktop Chrome. Test drift, vibrate, wake lock, offline, install prompt. Buat `TESTING.md:1` checklist.
- **Acceptance:**
  - [ ] `AC-01` PRD: 2:00/1:00 looping 30m drift <2 detik di Android PWA lock
  - [ ] iOS fallback notifikasi bekerja
- **File:** `TESTING.md:1`
- **Ref:** `PRD.md:13`

### T-POLISH-003 — Firebase Hosting Deploy + CI
- **Prioritas:** P0 | **Estimasi:** S | **Status:** TODO | **Dep:** T-SETUP-004, T-PWA-001
- **Deskripsi:** Setup `firebase.json` hosting `public: dist`, `rewrites` SPA, `headers` cache. `npm run build` → `firebase deploy --only hosting`. (Opsional) GitHub Actions CI: lint + build + deploy on push main. Env `VITE_*` via GitHub Secrets.
- **Acceptance:**
  - [ ] `https://runease.web.app` live, PWA installable
  - [ ] `firebase hosting:channel:deploy` preview jalan
- **File:** `firebase.json:1`, `.github/workflows/deploy.yml:1`
- **Ref:** `DATABASE.md:2`, `PRD.md:10`

### T-POLISH-004 — Analitik Event
- **Prioritas:** P1 | **Estimasi:** XS | **Status:** TODO | **Dep:** T-SETUP-004
- **Deskripsi:** `src/lib/analytics.ts:1` — wrapper `logEvent(analytics, name, params)` untuk `timer_started`, `timer_completed`, `alarm_played`, `streak_earned`, `badge_unlocked`, `pwa_installed`, `data_exported/imported`. Init `getAnalytics` hanya jika `VITE_MEASUREMENT_ID` ada.
- **Acceptance:**
  - [ ] Event muncul di Firebase Analytics DebugView
- **File:** `src/lib/analytics.ts:1`
- **Ref:** `PRD.md:9`

### T-POLISH-005 — Dokumentasi & README
- **Prioritas:** P1 | **Estimasi:** XS | **Status:** TODO | **Dep:** —
- **Deskripsi:** Update `README.md:1` dengan screenshot Bauhaus, cara run `npm install && npm run dev`, env setup, cara deploy, link docs `PRD/DATABASE/STYLEGUIDE/DESIGNSYSTEM`. Tambah `CONTRIBUTING.md:1` singkat.
- **Acceptance:**
  - [ ] README bisa diikuti fresh clone tanpa tanya
- **File:** `README.md:1`
- **Ref:** —

---

## Backlog V2 (P2) — Tidak di MVP, tapi sudah di-PR DRAFT

| ID | Judul | Deskripsi Singkat | File |
|----|-------|-------------------|------|
| T-V2-001 | GPS Tracking | `navigator.geolocation.watchPosition` + peta Leaflet, hitung jarak/pace | `src/lib/gps.ts:1` |
| T-V2-002 | Leaderboard | `leaderboardWeekly/{weekId}/entries/{uid}` + Cloud Function agregasi | `src/pages/leaderboard.tsx:1` |
| T-V2-003 | Upload Nada Custom | `Storage users/{uid}/sounds` + validasi 1MB/5s + `ffprobe` | `src/lib/storage.ts:1` |
| T-V2-004 | Push Notification | FCM `requestPermission` + Cloud Function cron pengingat lari | `src/lib/fcm.ts:1` |
| T-V2-005 | Dark Mode Bauhaus | Inversi `bg-bauhaus-black` canvas + `text-white` | `tailwind.config.ts:1` |

---

## Urutan Eksekusi yang Disarankan (Sprint)

### Sprint 1 (Hari 1-3) — Fondasi + Timer
`T-SETUP-001` → `T-SETUP-002` → `T-SETUP-003` → `T-SETUP-004` → `T-SETUP-005` → `T-DS-001` → `T-DS-002` → `T-DS-003` → `T-DS-004` → `T-DS-005` → `T-TIMER-001` → `T-TIMER-002`

### Sprint 2 (Hari 4-6) — Timer Lengkap + PWA
`T-TIMER-003` → `T-TIMER-004` → `T-TIMER-005` → `T-TIMER-006` → `T-TIMER-007` → `T-TIMER-008` → `T-PWA-001` → `T-PWA-002`

### Sprint 3 (Hari 7-9) — Data + Auth
`T-AUTH-001` → `T-AUTH-002` → `T-DATA-004` → `T-DATA-001` → `T-DATA-003` → `T-EXPORT-001` → `T-EXPORT-002` → `T-DATA-002`

### Sprint 4 (Hari 10-12) — Gamifikasi + Polish
`T-GAMIFY-001` → `T-GAMIFY-002` → `T-GAMIFY-003` → `T-GAMIFY-004` → `T-SETTINGS-001` → `T-ONBOARD-001` → `T-POLISH-001` → `T-POLISH-002` → `T-POLISH-003`

---

## Kriteria Penerimaan Global (PRD AC)

Sebelum Fase 4 DONE, semua harus ✅:

- [ ] **AC-01** Timer 2:00/1:00 looping 30m tanpa drift >2 detik di Android Chrome PWA installed + layar terkunci. (`T-TIMER-002` + `T-PWA-001`)
- [ ] **AC-02** Alarm berbunyi + vibrate tiap ganti fase, bisa test di Settings. (`T-TIMER-005` + `T-TIMER-006`)
- [ ] **AC-03** Login Google berhasil, data sesi muncul di device lain setelah login. (`T-AUTH-001` + `T-DATA-001`)
- [ ] **AC-04** Export JSON bisa diimport di device lain dan merekonstruksi history 100%. (`T-EXPORT-001` + `T-EXPORT-002`)
- [ ] **AC-05** Streak bertambah 1 tiap hari ada sesi >10m, badge "Langkah Pertama" muncul setelah sesi 1. (`T-GAMIFY-002` + `T-GAMIFY-003`)
- [ ] **AC-06** Lighthouse PWA score ≥90, installable. (`T-PWA-001` + `T-POLISH-002`)

---

## Catatan untuk Developer

1. **Jangan `setInterval` di main thread** — selalu via `timer.worker.ts`. Jika lihat `setInterval` di component, itu bug.
2. **Jangan `rounded-md`** — grep `rg "rounded-(md|lg|xl)" src` harus 0 sebelum PR merge.
3. **Selalu `tabular-nums`** untuk angka timer.
4. **Firestore Rules dulu** sebelum data — jangan develop dengan `allow read, write: if true`.
5. **Test di device fisik** — emulator tidak simulasi throttling background dengan akurat.

---

*Update status task langsung di file ini (ganti TODO→DOING→DONE) atau sync ke GitHub Projects. Jika schema berubah, bump `version` di `DATABASE.md:8` dan update `ExportSchema`.*
