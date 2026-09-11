# IMPLEMENTATION PLAN — RunEase

> **Tanggal:** 6 September 2026  
> **Status:** Draft — Menunggu Approval (JANGAN mulai coding sebelum Approve)  
> **Dokumen Sumber:** `PRD.md:1`, `DATABASE.md:1`, `STYLEGUIDE.md:1`, `DESIGNSYSTEM.md:1`, `TASKS.md:1`  
> **Tujuan:** Menjelaskan arsitektur, komponen, page structure, dan dependencies sebelum eksekusi `T-SETUP-001`

---

## 1. Ringkasan Eksekutif

**RunEase** adalah PWA SPA (bukan Next.js SSR) untuk timer interval Run-Walk. Review 5 dokumen (total 2471 baris) menunjukkan **konsistensi tinggi** — PRD/DATABASE/TASKS selaras, Bauhaus design system strict.

**Inti teknis yang tidak bisa ditawar:**
- Timer **Wajib** Web Worker (`src/workers/timer.worker.ts:1`) + `Date.now()` drift correction — bukan `setInterval` di main thread.
- Audio via `Web Audio API` + vibrate `navigator.vibrate` + `Wake Lock API` — kunci untuk `PRD AC-01` (30m lock-screen tanpa miss).
- PWA `vite-plugin-pwa` (Workbox) `display: standalone` — syarat alarm tetap bunyi di Android.
- Data `users/{uid}/**` (Firestore) + `enableIndexedDbPersistence` + Export/Import JSON versioned `version:1`.

**Keputusan arsitektur utama:** Vite + React + Tailwind + shadcn/ui + Zustand + Firebase (tanpa Next.js/MUI). Alasan: bundle <300kb, token sentral, override Bauhaus mudah (hard shadow, `rounded-none`/`rounded-full` only).

---

## 2. Temuan Review Dokumen (Gap & Keputusan)

### 2.1 Konsistensi yang Baik
- PRD `5.1` Timer Engine ↔ TASKS `T-TIMER-001..008` ↔ DATABASE `3.1..3.3` ↔ DESIGNSYSTEM `3 Fase D` semua selaras urutan `[warmup?]->(run->walk)*n->[cooldown?]` dan `runSec/walkSec 10..600`.
- 5 preset bawaan identik di PRD `5.4` dan DATABASE `3.2`.
- 12 badge & rumus XP `runMin*2 + walkMin*1` konsisten PRD `5.7` ↔ DATABASE `3.1`/`3.4` ↔ TASKS `T-GAMIFY`.
- Export format `{version:1, exportedAt, data:{user, presets, sessions, badges, settings}}` konsisten DATABASE `8` ↔ TASKS `T-EXPORT`.

### 2.2 Gap / Inkonsistensi yang Perlu Diputuskan Sekarang (Blocking)

| # | Gap | Lokasi | Rekomendasi (untuk di-Approve) | Dampak jika tidak diputuskan |
|---|-----|--------|--------------------------------|-------------------------------|
| **G1** | **Settings lokasi:** DATABASE `3.5` tawarkan Opsi A (`users/{uid}/settings/main` sub-doc) vs Opsi B (field `users/{uid}.preferences`). TASKS `T-DATA-*` pakai Opsi A. | `DATABASE.md:216` | **Pilih Opsi A** (`settings/main` sub-doc). Alasan: tidak bebani read `users` tiap tick timer, terpisah untuk export. Jika butuh 1 read, bisa `Promise.all`. | Import/export bingung, 2 sumber kebenaran. |
| **G2** | **Offline cache lib:** DATABASE `7` sebut `idb` + `localForage`, TASKS `T-DATA-003` sebut `localForage` saja. | `DATABASE.md:15` | **Pilih `localForage` saja** untuk anon fallback (wrapper IndexedDB). Firestore SDK sudah punya `IndexedDB` persistence sendiri, tidak perlu `idb` manual. Sederhanakan: `runease:presets`, `runease:sessions` di localForage. | Duplikasi lib, bundle bloat. |
| **G3** | **Versi stack usang:** DESIGNSYSTEM `1.1` sebut Vite 5 / React 18 / Firebase 10. Saat ini (Sep 2026) stable adalah Vite 6, React 19, Firebase 11. | `DESIGNSYSTEM.md:19` | **Pakai versi terbaru stable:** `vite@6`, `react@19`, `firebase@11`, `tailwind@3.4` (v4 masih beta). Alasan: security patch, React 19 `use` compatible. Tetap kompatibel. | Install versi lama dapat warning peer dep. |
| **G4** | **Mode Timer `duration`/`sets`:** PRD `5.1` definisikan `mode: infinite|duration|sets`, tapi UI di STYLEGUIDE `12.1` hanya contoh infinite. TASKS `T-TIMER-001` sebut semua mode. | `PRD.md:93` | **Fase 1 MVP hanya `infinite`**, `duration`/`sets` di-hide di balik feature flag / Settings advanced. Alasan: kurangi kompleksitas worker vs deadline. Aktifkan penuh di Fase 2. | Scope creep Fase 1. |
| **G5** | **Cloud Functions:** DATABASE `9` & PRD `5.7` anggap Functions untuk streak anti-cheat, tapi TASKS `T-GAMIFY-002` tulis "alternatif MVP tanpa Functions: client-only". | `DATABASE.md:469` | **MVP tanpa Functions (client-only)**. Streak hitung client via `calcStreak()` + `increment()`. Functions ditunda ke V2 jika cheat jadi isu. Alasan: butuh Blaze plan, deploy complexity. | Butuh setup `functions/` + emulator di Sprint 1 — overkill. |
| **G6** | **Testing framework:** TASKS `T-TIMER-001` sebut `vitest` tapi DESIGNSYSTEM/SETUP tidak list. | `TASKS.md:162` | **Tambah `vitest` + `jsdom` + `@testing-library/react`** di DevDeps. Alasan: unit test worker & gamifikasi wajib. | Tidak ada test runner. |

**Jika Approve rekomendasi G1-G6 di atas, plan di bawah langsung bisa dieksekusi tanpa revisi doc.**

---

## 3. Arsitektur Sistem

### 3.1 Diagram Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────────┐
│                        PWA React SPA (Vite)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Pages   │  │ Components│  │  Stores  │  │   Workers/Hooks  │  │
│  │ /timer   │◄─┤  UI/Bau  │◄─┤ Zustand  │◄─┤ timer.worker.ts  │  │
│  │ /history │  │  Layout  │  │ timer    │  │ useWakeLock     │  │
│  │ /settings│  │  Timer   │  │ user     │  │ useVibration    │  │
│  └────┬─────┘  └──────────┘  │ preset   │  │ useAudio        │  │
│       │                     │ session  │  └────────┬─────────┘  │
│       │                     └────┬─────┘           │            │
│       │                          │  onAuthState   │ tick 250ms │
│       ▼                          ▼                 ▼            │
│  ┌─────────────────────────────────────────────────┐            │
│  │           lib/firebase.ts + lib/*               │            │
│  │  Web Audio API │ localForage │ export/import    │            │
│  └──────────────┬──────────────────────────────────┘            │
└─────────────────┼───────────────────────────────────────────────┘
                  │ (online, enableIndexedDbPersistence)
                  ▼
         ┌─────────────────┐      ┌──────────────┐
         │ Cloud Firestore │◄────►│ IndexedDB    │ (offline cache)
         │ users/{uid}/**  │      │ (SDK)        │
         └────────┬────────┘      └──────────────┘
                  │                      ▲
                  │  .json export        │ localForage (anon)
                  ▼                      │
         ┌─────────────────┐      ┌──────────────┐
         │  .json File     │─────►│   Import     │ (Zod validate)
         │ version:1       │      │ Merge/Replace│
         └─────────────────┘      └──────────────┘
                  ▲
         ┌─────────────────┐
         │ Firebase Auth   │ (Google + Anonymous)
         │ Firebase Storage│ (V2 custom mp3)
         │ Firebase Hosting│ (dist/)
         └─────────────────┘
```

### 3.2 Lapisan (Layers) & Tanggung Jawab

| Layer | Folder | Tanggung Jawab | Ketergantungan |
|-------|--------|----------------|----------------|
| **Presentation** | `src/pages/`, `src/components/` | Render Bauhaus, `aria-live`, `tabular-nums`, tidak ada logic timer | Stores, Hooks |
| **State** | `src/stores/` | Zustand: `timerStore`, `userStore`, `presetStore`, `sessionStore` — pure state, no `setInterval` | Types |
| **Domain Logic** | `src/lib/` | `audio.ts`, `gamification.ts`, `badges.ts`, `streak.ts`, `export.ts`, `import.ts`, `schemas.ts` (Zod) — pure functions, testable | Firebase, Stores |
| **Side Effects** | `src/workers/`, `src/hooks/` | `timer.worker.ts` (drift correction), `useWakeLock`, `useVibration`, `usePWAInstall` — browser APIs | Stores |
| **Data** | `src/lib/firebase.ts`, `src/lib/migrate.ts` | Firestore SDK + `enableIndexedDbPersistence` + `localForage` anon fallback + `writeBatch` chunk 500 | Firebase |

**Aliran Data Timer (Kritis):**
`UI Start` → `timerStore.start(config)` → `useTimerWorker.postMessage({type:'start', config, startedAt: Date.now()})` → `Worker setInterval 250ms + Date.now() correction` → `postMessage({type:'tick', remaining, phase, elapsed})` → `timerStore.tick()` → `TimerDisplay` re-render (`memo`) → jika `remaining===0` → `Worker postMessage({type:'phaseChange', nextPhase})` → `Hooks: audio.playSound() + vibrate() + Notification fallback` → loop.

### 3.3 Keputusan Arsitektur Penting (Trade-offs)

| Keputusan | Alternatif Ditolak | Alasan |
|-----------|-------------------|--------|
| Vite SPA, bukan Next.js | Next.js SSR | Timer tidak butuh SEO SSR, Vite lebih ringan, PWA plugin mature, build <1s |
| Tailwind + cva, bukan CSS Modules | CSS Modules / Styled-components | Token sentral `tailwind.config.ts`, `cva` type-safe variants, tidak duplikasi `border-4 shadow-bauhaus` |
| shadcn/ui (copy-paste), bukan MUI | MUI, AntD | Headless, override Bauhaus `rounded-none`/`shadow-bauhaus` tanpa `!important`, bundle kecil |
| Zustand, bukan Redux | Redux Toolkit | Timer state sederhana (phase, remaining), Zustand 1kb, tidak perlu boilerplate |
| Web Worker, bukan main thread | `setInterval` di component | Browser throttle background tab → drift >10s. Worker tidak di-throttle, `Date.now()` correction jamin <500ms/30m |
| Web Audio API, bukan `<audio>` | `<audio>` element | AudioContext lebih reliable di background, bisa fallback `OscillatorNode` jika file 404 |
| localForage (anon) + Firestore persistence (auth) | Hanya Firestore | Anon user tidak punya `uid` — Firestore rules `request.auth.uid` deny. localForage jembatani sampai `linkWithCredential` |

---

## 4. Struktur Halaman & Routing

### 4.1 Sitemap & Route Table

| Path | Halaman | Layout | Guard | Deskripsi | File |
|------|---------|--------|-------|-----------|------|
| `/` | Landing (opsional) atau redirect `/timer` | `AppShell` `max-w-7xl` | Public | Hero color blocking biru + stats kuning + CTA. Jika MVP tanpa landing, redirect ke `/timer`. | `src/pages/landing.tsx:1` atau `src/pages/index.tsx:1` |
| `/timer` | **Timer (Prioritas #1)** | `AppShell` `max-w-md` + `BottomNav` | Public (anon allowed) | PresetChips top, TimeInput, TimerDisplay Card `min-h-[50vh]`, Controls 3 btn, stats ringkas. Modal SessionSummary saat stop. | `src/pages/timer.tsx:1` |
| `/history` | Riwayat | `AppShell` `max-w-md` | Public* | List group by date, heatmap 7xN, filter. *Anon baca localForage, auth baca Firestore. | `src/pages/history.tsx:1` |
| `/stats` | Statistik & Gamifikasi | `AppShell` `max-w-md` | Public* | LevelBar, StreakFlame, grafik mingguan/bulanan (recharts), ChallengeCard, Badge grid link. | `src/pages/stats.tsx:1` |
| `/badges` | Koleksi Badge (sub dari stats) | `AppShell` `max-w-md` | Public* | Grid `1→2→3 col`, `BadgeCard` deco, earned vs locked (grayscale). | `src/pages/badges.tsx:1` |
| `/settings` | Pengaturan | `AppShell` `max-w-md` | Public | Sections `border-b-4`: Suara (select, volume, test), Getar, Layar (wakeLock), Bahasa, Data (Export/Import, Hapus), Tentang (FAQ accordion). | `src/pages/settings.tsx:1` |
| `/login` | Login | `AppShell` centered | Public | Google button red pill + anon info. Jika sudah login, redirect `/timer`. | `src/pages/login.tsx:1` |
| `*` | 404 | `AppShell` | — | Card Bauhaus "Halaman Tidak Ditemukan" + Button ke `/timer`. | `src/pages/not-found.tsx:1` |

**Router:** `react-router-dom` `createBrowserRouter` + `RouterProvider`. Contoh:

```ts
// src/App.tsx:1
{ path: "/", element: <AppShell />, children: [
  { index: true, element: <Navigate to="/timer" replace /> },
  { path: "timer", element: <TimerPage /> },
  { path: "history", element: <HistoryPage /> },
  { path: "stats", element: <StatsPage /> },
  { path: "badges", element: <BadgesPage /> },
  { path: "settings", element: <SettingsPage /> },
  { path: "login", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> },
]}
```

### 4.2 Navigasi

- **TopNav** (`src/components/layout/top-nav.tsx:1`): `sticky top-0 z-50 bg-bauhaus-gray border-b-4 border-bauhaus-black`. Kiri `GeometricLogo` (circle red + square blue + triangle yellow + "RunEase" `font-black tracking-tighter`). Tengah nav links `hidden md:flex` (Timer/Riwayat/Stat/Atur) `hover:text-bauhaus-red`. Kanan `Button variant=red shape=pill hidden md:flex` "MULAI" + avatar jika login + hamburger `md:hidden` `w-10 h-10 bg-white border-2 shadow-bauhaus-sm rounded-none`.
- **BottomNav** (`src/components/layout/bottom-nav.tsx:1`): `fixed bottom-0 left-0 right-0 bg-white border-t-4 border-bauhaus-black flex justify-around py-2 sm:hidden` — 4 `NavItem` (lucide `Clock`, `History`, `BarChart3`, `Settings`) label `font-bold uppercase tracking-widest text-xs`, active `bg-bauhaus-black text-white border-2 rounded-full px-3 py-1`.
- **AppShell** (`src/components/layout/app-shell.tsx:1`): `min-h-screen bg-bauhaus-gray`, `main` dengan `pb-20 sm:pb-0` (space untuk BottomNav), `DotGrid` dekorasi opsional.

### 4.3 Page Structure Detail (Wireframe Bauhaus)

**`/timer` (Prioritas):**
```
[TopNav]
[PresetChips: horizontal scroll flex gap-2 py-3 bg-white border-b-4]
  [Badge Pemula 1:2] [Badge Seimbang 2:1 active blue] [Badge Galloway 4:1] [+ Custom]
[Main max-w-md mx-auto px-4 py-6]
  [TimeInput: mm:ss run | mm:ss walk (jika idle)  OR  TimerDisplay Card jika running]
    Card: border-4 shadow-bauhaus-lg rounded-none min-h-[50vh] flex-col center
      - PhaseBadge pill red/blue/yellow border-2 shadow-bauhaus-sm
      - H1 02:00 font-black text-7xl sm:text-8xl tabular-nums tracking-tighter
      - ProgressBar h-3 bg-white border-2 rounded-none + inner bg-red/blue 1000ms
      - Small: SET 3 • BERIKUTNYA: JALAN 01:00
  [TimerControls: grid grid-cols-3 gap-4 mt-6]
    PAUSE (yellow) | SKIP (outline) | STOP (red)   // idle: MULAI (red lg full)
  [Stats ringkas: font-bold uppercase tracking-widest text-xs opacity-60]
    Total 12:34 • Sesi #12 • WakeLock dot hijau
[BottomNav]
[SessionSummary Modal: Card border-4 shadow-bauhaus-lg p-6]
  Judul "Sesi Selesai!" font-black uppercase, Durasi 30:00, Sets 10, XP +35, [SIMPAN red] [BUANG ghost]
```

---

## 5. Arsitektur Komponen

### 5.1 Pohon Folder Final (akan di-generate di `T-SETUP-005`)

```
RunEase/
├── public/
│   ├── sounds/beep.mp3, bell.mp3
│   ├── icon-192.png, icon-512.png (Bauhaus 3 geometri)
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn override Bauhaus (P0)
│   │   │   ├── button.tsx    # cva red/blue/yellow/outline/ghost + square/pill
│   │   │   ├── card.tsx      # border-4 shadow-bauhaus-lg deco red/blue/yellow
│   │   │   ├── input.tsx     # border-2 shadow-bauhaus-sm rounded-none
│   │   │   ├── badge.tsx     # cva rounded-full border-2
│   │   │   ├── accordion.tsx # Radix, open header red, content #FFF9C4
│   │   │   └── toggle.tsx    # w-12 h-6 border-2 rounded-full knob
│   │   ├── layout/           # P0
│   │   │   ├── app-shell.tsx
│   │   │   ├── top-nav.tsx
│   │   │   ├── bottom-nav.tsx
│   │   │   └── section.tsx   # color gray/blue/yellow/red/black border-b-4
│   │   ├── geometric/        # P0
│   │   │   ├── deco.tsx      # DecoCircle/Square/Triangle, DotGrid
│   │   │   └── geometric-logo.tsx
│   │   ├── timer/            # P0
│   │   │   ├── timer-display.tsx  # memo, aria-live, tabular-nums
│   │   │   ├── phase-badge.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   ├── timer-controls.tsx # Space/S/ESC handlers
│   │   │   ├── preset-chips.tsx
│   │   │   ├── time-input.tsx     # mm:ss inputs
│   │   │   └── session-summary.tsx # modal Card
│   │   ├── history/          # P1
│   │   │   ├── session-card.tsx
│   │   │   ├── heatmap.tsx   # 7xN grid w-3 h-3 rounded-none
│   │   │   └── stats-chart.tsx # recharts bar border-2
│   │   ├── gamification/     # P1
│   │   │   ├── level-bar.tsx
│   │   │   ├── streak-flame.tsx
│   │   │   ├── badge-card.tsx
│   │   │   └── challenge-card.tsx
│   │   ├── settings/         # P0
│   │   │   └── import-dialog.tsx
│   │   ├── pwa/              # P1
│   │   │   └── install-banner.tsx # Card yellow after 2 sessions
│   │   └── onboarding/       # P1
│   │       └── onboarding.tsx # 3 slides
│   ├── lib/
│   │   ├── utils.ts          # cn()
│   │   ├── firebase.ts       # init + enableIndexedDbPersistence
│   │   ├── audio.ts          # AudioContext singleton + Oscillator fallback
│   │   ├── gamification.ts   # calcXP, levelFromXP
│   │   ├── streak.ts         # calcStreak Asia/Jakarta
│   │   ├── badges.ts         # 12 badge definitions + checkBadges()
│   │   ├── challenges.ts     # weekly/monthly
│   │   ├── export.ts         # exportData()
│   │   ├── import.ts         # importData() + Zod
│   │   ├── schemas.ts        # ExportSchema Zod
│   │   ├── seedPresets.ts    # 5 builtin
│   │   ├── migrate.ts        # localForage → Firestore batch
│   │   ├── analytics.ts      # logEvent wrapper
│   │   └── notifications.ts  # fallback Notification
│   ├── stores/
│   │   ├── timerStore.ts     # Zustand, no setInterval
│   │   ├── userStore.ts      # onAuthStateChanged
│   │   ├── presetStore.ts    # CRUD max 10
│   │   └── sessionStore.ts   # fetchSessions limit 20
│   ├── workers/
│   │   └── timer.worker.ts   # Dedicated Worker, 250ms tick
│   ├── hooks/
│   │   ├── useTimerWorker.ts # bridge worker ↔ store
│   │   ├── useWakeLock.ts    # request/release + visibilitychange
│   │   ├── useVibration.ts   # pattern check
│   │   ├── useAudio.ts       # preload buffers
│   │   ├── useAuth.ts        # signInWithGoogle etc.
│   │   ├── usePWAInstall.ts  # beforeinstallprompt
│   │   └── useXP.ts          # level progress
│   ├── types/
│   │   ├── timer.ts          # TimerConfig, Phase
│   │   ├── user.ts           # UserDoc
│   │   ├── preset.ts         # PresetDoc
│   │   └── session.ts        # SessionDoc
│   ├── pages/
│   │   ├── timer.tsx
│   │   ├── history.tsx
│   │   ├── stats.tsx
│   │   ├── badges.tsx
│   │   ├── settings.tsx
│   │   ├── login.tsx
│   │   ├── landing.tsx       # P2
│   │   └── not-found.tsx
│   ├── App.tsx               # createBrowserRouter
│   ├── main.tsx              # ReactDOM.createRoot
│   └── index.css             # @import Outfit + @tailwind + base
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── firebase.json
├── vite.config.ts            # + VitePWA + alias @
├── tailwind.config.ts        # bauhaus tokens + boxShadow hard
├── tsconfig.json             # path @/*
├── .env.example              # VITE_FIREBASE_*
└── package.json
```

### 5.2 Komponen Kunci & Props

| Komponen | Props Utama | Bauhaus Wajib | Catatan |
|----------|-------------|---------------|---------|
| `Button` | `variant`, `shape`, `size` | `border-2 shadow-bauhaus active:translate active:shadow-none font-bold uppercase tracking-wider` | `cva` — jangan hardcode di page |
| `Card` | `deco: red\|blue\|yellow`, `className` | `border-4 shadow-bauhaus-lg rounded-none hover:-translate-y-1` + deco `absolute -top-2 -right-2 w-3 h-3 rounded-full border-2` | Deco mandatory, bukan opsional |
| `TimerDisplay` | `remaining`, `phase`, `progress` | `font-black text-7xl sm:text-8xl tabular-nums tracking-tighter leading-[0.9]` | `React.memo`, `aria-live="polite"` |
| `Section` | `color: gray\|blue\|yellow\|red\|black` | `border-b-4 border-bauhaus-black py-12 sm:py-16 lg:py-24` | Color blocking full width |
| `Badge` | `variant`, `children` | `rounded-full border-2 font-bold uppercase tracking-widest text-xs` | Untuk preset chips & fase |
| `GeometricLogo` | — | 3 bentuk `w-3 h-3` circle/square/triangle + `font-black tracking-tighter` | Wajib di TopNav |

---

## 6. Dependencies (Final — untuk `package.json:1`)

### 6.1 Runtime

| Paket | Versi | Alasan | PRD Ref |
|-------|-------|--------|---------|
| `react`, `react-dom` | `^19.0.0` | SPA, hooks, memo untuk timer | DESIGNSYSTEM 1.1 |
| `react-router-dom` | `^6.26.0` | SPA routing `/timer` etc., `createBrowserRouter` | T-SETUP-005 |
| `zustand` | `^4.5.0` | Timer/user/preset/session stores, ringan | DESIGNSYSTEM 1.1 |
| `firebase` | `^11.0.0` | Auth, Firestore, Storage, Analytics, `enableIndexedDbPersistence` | DATABASE 2 |
| `localforage` | `^1.10.0` | Anon fallback `runease:presets/sessions`, dipilih vs `idb` (lebih simpel) | DATABASE 7 (G2) |
| `zod` | `^3.23.0` | Validasi Export/Import JSON `ExportSchema` | DATABASE 8.2 |
| `lucide-react` | `^0.460.0` | Ikon Circle/Square/Triangle etc., tree-shake | STYLEGUIDE 8.1 |
| `recharts` | `^2.12.0` | Grafik bar mingguan/bulanan, style Bauhaus border-2 | T-DATA-002 |
| `clsx`, `tailwind-merge` | `^2.5.0`, `^2.5.0` | `cn()` helper | DESIGNSYSTEM 3 |
| `class-variance-authority` | `^0.7.0` | `cva` untuk Button/Badge variants | T-DS-001 |

### 6.2 Dev

| Paket | Versi | Alasan |
|-------|-------|--------|
| `vite` | `^6.0.0` | Build tool |
| `typescript` | `^5.6.0` | Type-safety |
| `@vitejs/plugin-react` | `^4.3.0` | Vite React |
| `tailwindcss`, `postcss`, `autoprefixer` | `^3.4.0` | Bauhaus tokens |
| `vite-plugin-pwa` | `^0.21.0` | Workbox, manifest, SW |
| `eslint`, `prettier`, `eslint-plugin-tailwindcss` | latest | Lint + class sort |
| `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` | latest | Unit test (G6) |
| `firebase-tools` | `^13.0.0` | `firebase deploy`, emulator |

**Bundle target:** <300kb gzip (Tanpa recharts ~250kb, dengan recharts ~280kb — masih oke).

### 6.3 Tidak Dipakai (Sengaja)

- `next` — overkill SSR
- `@mui/material` — soft shadow, tidak Bauhaus
- `redux` — boilerplate
- `styled-components` — token tidak sentral
- `moment` — pakai `date-fns` jika perlu (tapi untuk heatmap cukup `Date` native)

---

## 7. Arsitektur Data & Aliran (Detail `DATABASE.md`)

### 7.1 Firestore Schema (Opsi A — Approved G1)

```
users/{uid} : UserDoc {uid, displayName, email, photoURL, xp, level, streak{current,longest,lastDate,freezeTokens}, stats{totalSessions,totalDurationSec}, createdAt, updatedAt}
users/{uid}/presets/{presetId} : PresetDoc {id, name, runSec(10..600), walkSec, warmupSec, cooldownSec, mode infinite, soundId, icon circle|square|triangle, color red|blue|yellow, isBuiltIn, createdAt}
users/{uid}/sessions/{sessionId} : SessionDoc {id, presetId, presetSnapshot{name,runSec,walkSec,warmupSec,cooldownSec}, status completed|stopped|abandoned, startedAt, endedAt, durationSec, setsCompleted, xpEarned}
users/{uid}/badges/{badgeId} : BadgeDoc {id, name, description, icon, color, earnedAt, seen}
users/{uid}/settings/main : SettingsDoc {soundId beep, volume 80, vibrate true, voiceCoach false, countdownBeep true, wakeLock true, language id, updatedAt}
```

**Aturan:** `firestore.rules:1` `allow read,write: if request.auth.uid == uid`. `firestore.indexes.json:1` index `sessions startedAt DESC`.

### 7.2 Aliran Auth & Migrasi

```
[Anon] localForage runeaase:presets/sessions → user klik "Login Google" → signInWithPopup → onAuthStateChanged → detect localForage not empty → modal "Gabungkan 2 sesi?" → migrateLocalToCloud(uid) writeBatch chunk 500 → clear localForage → fetchPresets dari Firestore
[Auth] langsung baca Firestore + persistence cache → optimistic UI
```

### 7.3 Export/Import

```
Export: Promise.all(getDoc user + getDocs presets/sessions/badges + getDoc settings/main) → {version:1, exportedAt, exportedBy uid, appVersion, data} → Blob → download runeause-export-2026-09-06.json
Import: file .json max 5MB → JSON.parse → Zod ExportSchema validate version:1 → preview "12 sesi, 3 preset" → pilih Merge (skip duplicate id) vs Replace (ketik HAPUS + auto backup) → writeBatch chunk 500 → recalc stats
```

---

## 8. PWA & Offline

- **VitePWA config:** `registerType: autoUpdate`, `includeAssets: [favicon.ico, sounds/*.mp3]`, `manifest: {name: RunEase, short_name: RunEase, display: standalone, orientation: portrait, theme_color: #D02020, background_color: #F0F0F0, icons: 192/512}`. `workbox: {runtimeCaching: [{urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/, handler: StaleWhileRevalidate}]}`.
- **Wake Lock:** `useWakeLock` request saat `isRunning`, release saat pause/stop, re-request on `visibilitychange`.
- **Fallback Notification:** Jika `AudioContext` blocked, `new Notification("RunEase", {body: "Ganti ke LARI!", requireInteraction: true})` — minta permission di onboarding.
- **Offline:** Timer & preset jalan offline (worker + localForage/Firestore cache), sync saat online (SDK otomatis).

---

## 9. Rencana Implementasi Bertahap (Tanpa Coding Sampai Approve)

### Fase 1 MVP (Minggu 1-2) — Timer + PWA + Auth — **Sprint 1 & 2 di TASKS**

**Urutan Eksekusi (sesuai TASKS Sprint 1-2):**
`T-SETUP-001` (Vite+TS) → `T-SETUP-002` (Tailwind+Outfit) → `T-SETUP-003` (shadcn+utils) → `T-SETUP-004` (Firebase env) → `T-SETUP-005` (folder+routing) → `T-DS-001..006` (Button/Card/etc. Bauhaus) → `T-TIMER-001` (timerStore) → `T-TIMER-002` (Worker) → `T-TIMER-003..008` (Display/Controls/Audio/Vibrate/WakeLock/Integrasi) → `T-PWA-001` (VitePWA) → `T-AUTH-001` (Google+Anon)

**Exit Criteria Fase 1 (PRD AC-01/02/03 partial):** Timer infinite 2:00/1:00 looping 30m drift <500ms, bunyi+getar saat lock Android PWA, login Google jalan.

### Fase 2 Data (Minggu 3)

`T-AUTH-002` (seed 5 preset) → `T-DATA-004` (rules+indexes) → `T-DATA-001` (session save+history) → `T-DATA-003` (migrasi anon) → `T-EXPORT-001/002` (JSON) → `T-DATA-002` (heatmap+grafik)

### Fase 3 Gamify (Minggu 4)

`T-GAMIFY-001` (XP/Level) → `T-GAMIFY-002` (Streak client-only, G5) → `T-GAMIFY-003` (12 Badge) → `T-GAMIFY-004` (Challenge)

### Fase 4 Polish (Minggu 5)

`T-SETTINGS-001` (Settings) → `T-ONBOARD-001` (3 slides) → `T-POLISH-001` (a11y) → `T-POLISH-002` (test lintas device) → `T-POLISH-003` (Hosting deploy) → `T-POLISH-004` (Analytics)

---

## 10. Risiko & Mitigasi (PRD 11)

| Risiko | Mitigasi di Plan |
|--------|------------------|
| iOS background mati | Disclaimer FAQ, sarankan earphone, fallback Notification, roadmap Capacitor di V2 (T-V2-*) |
| Browser throttle | WAJIB Worker (T-TIMER-002) + `Date.now()` correction, test low-end device |
| Drift waktu | Tick 250ms + correction, test 60m `TESTING.md` |
| Data hilang Replace | Konfirmasi ketik HAPUS + auto backup export sebelum Replace (T-EXPORT-002) |
| Bauhaus inkonsisten | Checklist `rg "rounded-(md|lg|xl)"` =0, `rg "shadow-(md|lg)"` =0, `rg "gradient"` =0 di CI (T-DS-006) |

---

## 11. Pertanyaan untuk Approval (Jawab sebelum coding)

1. **Approve G1-G6?** (Opsi A settings, localForage only, Vite6/React19/Firebase11, MVP infinite only, tanpa Functions, tambah vitest) — Jika tidak, sebutkan preferensi.
2. **Landing page `/` perlu di MVP atau redirect `/timer` dulu?** (Rekomendasi: redirect dulu, landing di P2 `T-LANDING-001`).
3. **Recharts setuju atau prefer `chart.js`/`visx` untuk grafik?** (Recharts lebih simpel).
4. **Boleh langsung eksekusi `T-SETUP-001` setelah Approve, atau mau review plan lagi?**

---

## 12. Apa yang TIDAK Akan Dikerjakan Sampai Approve

- Tidak `npm create vite`, tidak `npm install`, tidak tulis `package.json`, `vite.config.ts`, `tailwind.config.ts`, atau file `src/` mana pun.
- Tidak `firebase init` atau buat `.env`.
- Plan ini hanya dokumen — eksekusi menunggu kata **"Approve"** atau **"LGTM"** dari Anda.

---

*Jika Approve, langkah pertama adalah `T-SETUP-001` → `T-SETUP-002` → ... sesuai Sprint 1. Jika ada revisi, saya update doc terkait dan re-generate plan.*
