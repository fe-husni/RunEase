# PRD — RunEase: Run-Walk Interval Timer PWA

> **Versi:** 1.0  
> **Tanggal:** 5 September 2026  
> **Status:** Draft Approved  
> **Platform:** PWA (Mobile-first, Android Chrome приоритет, iOS fallback)  
> **Stack:** Vite + React + TypeScript + Tailwind + shadcn/ui + Firebase

---

## 1. Ringkasan Eksekutif

**RunEase** adalah PWA timer interval untuk metode latihan **Run-Walk (Jeff Galloway)**. User mengatur durasi `Lari` dan `Jalan` secara manual (misal 2:00 / 1:00), memulai sesi, dan aplikasi akan looping ganti fase otomatis dengan **alarm suara + getar** bahkan saat layar terkunci (Chrome foreground dengan Wake Lock + Web Worker + Service Worker).

**Mengapa perlu:** Pelari pemula sulit konsisten interval tanpa melihat jam. Aplikasi timer generik tidak punya preset lari, tidak ada gamifikasi, dan mati saat layar terkunci.

**Kunci Diferensiasi:**
1. Timer akurat di background (Web Worker, bukan `setInterval` main thread)
2. Alarm + vibrate + Wake Lock + PWA standalone
3. Preset pintar + Warmup/Cooldown
4. Gamifikasi streak/badge/XP
5. Google Auth + Firestore sync + Export/Import JSON fleksibel

---

## 2. Latar Belakang & Masalah

### 2.1 Masalah Pengguna
- Harus bolak-balik lihat HP saat lari, mengganggu ritme napas.
- Timer HP bawaan hanya 1 countdown, tidak bisa looping 2 fase.
- Layar HP mati → timer berhenti / alarm tidak bunyi.
- Tidak ada motivasi lanjutan (bosan, tidak ada progres visual).

### 2.2 Target Pengguna
| Persona | Deskripsi | Kebutuhan Utama |
|---------|-----------|-----------------|
| **Budi (28, Pemula)** | Overweight, baru mulai lari 2 minggu, cepat ngos-ngosan | Preset 1:2 yang aman, alarm keras, instruksi jelas |
| **Sinta (34, Comeback)** | Pernah cedera lutut, pakai metode Galloway 4:1 | Custom interval presisi detik, history & statistik |
| **Riko (22, Streak Hunter)** | Butuh motivasi harian | Streak, badge, XP, challenge mingguan |

### 2.3 Tujuan Produk
- **Primary:** User bisa menyelesaikan sesi Run-Walk 30 menit tanpa menyentuh HP >2x.
- **Secondary:** Retensi 7-hari >35% lewat gamifikasi.
- **Tertiary:** Data user tidak hilang saat ganti device (via Firebase + JSON).

---

## 3. Tujuan & KPI

| Tujuan | KPI | Target MVP |
|--------|-----|------------|
| Keandalan Timer | % sesi selesai tanpa miss alarm | >98% (Android) |
| Adopsi | PWA install rate | >40% dari user login |
| Engagement | Sesi / user / minggu | ≥ 3 |
| Retensi | Streak 7 hari | ≥ 25% user |
| Kepuasan | Rating / feedback "alarm jelas" | >4.5/5 |

---

## 4. User Stories (MoSCoW)

### Must Have (MVP)
- Sebagai pelari, saya bisa mengatur **Run (mm:ss)** dan **Walk (mm:ss)** manual sebelum start. `US-01`
- Sebagai pelari, saya bisa **Start / Pause / Resume / Skip Fase / Stop / Reset**. `US-02`
- Sebagai pelari, saya mendengar **alarm berbeda** tiap ganti fase dan HP **bergetar**. `US-03`
- Sebagai pelari, timer **tetap jalan saat layar terkunci** (Chrome terbuka). `US-04`
- Sebagai user, saya bisa **login Google** dan data tersimpan di cloud. `US-05`
- Sebagai user, saya bisa **export & import .json** untuk pindah device. `US-06`

### Should Have (V1.1)
- Sebagai pemula, saya bisa pilih **preset cepat** (1:2, 2:1, 4:1, 5:1) dan simpan custom preset. `US-07`
- Sebagai user, saya bisa atur **Warmup & Cooldown** opsional. `US-08`
- Sebagai user, saya melihat **History & Kalender heatmap** sesi saya. `US-09`
- Sebagai user, saya mendapat **Streak, XP, Level, Badge**. `US-10`
- Sebagai user, saya bisa pilih **nada alarm & volume + voice coach**. `US-11`

### Could Have (V2)
- GPS tracking jarak/pace + peta rute. `US-12`
- Leaderboard teman / share badge. `US-13`
- Upload nada custom mp3. `US-14`
- Notifikasi push pengingat lari. `US-15`

---

## 5. Spesifikasi Fungsional

### 5.1 Timer Engine (Inti)
**Input:**
- `runSec`: 10 — 600 detik (00:10 — 10:00), step 5 detik
- `walkSec`: 10 — 600 detik
- `warmupSec`: 0 — 600 detik (opsional)
- `cooldownSec`: 0 — 600 detik
- `mode`: `infinite` (loop sampai stop) | `duration` (target total detik) | `sets` (target N set)

**Perilaku:**
- Urutan: `[Warmup?] -> (Run -> Walk) * n -> [Cooldown?]`
- **Akurasi:** WAJIB pakai `Dedicated Web Worker` (`src/workers/timer.worker.ts:1`). Worker mengirim `postMessage({type:'tick', remaining, phase})` tiap 250ms. Main thread hanya render. Dilarang `setInterval` di main thread (akan di-throttle browser).
- Tampilan saat jalan:
  - Countdown besar `MM:SS` dengan `font-variant-numeric: tabular-nums`
  - Label fase: `LARI` (bg merah Bauhaus `#D02020`) / `JALAN` (bg biru `#1040C0`) / `WARMUP` (kuning `#F0C020`)
  - Progress bar fase + progress total
  - Info: Set ke-X, Total elapsed, Next phase preview
- Kontrol: Tombol besar Pause (kuning), Skip (outline), Stop (merah). Swipe atau double-tap untuk skip (opsional).
- Saat `remaining == 0`: trigger `Audio + Vibrate + (Notification fallback)`, ganti fase, lanjutkan.
- Edge: Jika app di-background >5 menit, Worker tetap jalan; saat kembali foreground, sinkronkan `Date.now()` drift correction.

**Validasi:**
- `runSec` dan `walkSec` tidak boleh <10 detik.
- Jika `mode=duration`, durasi total harus >= (run+walk).

### 5.2 Audio & Haptik
- **Sumber Suara:** `Web Audio API` (AudioContext) — lebih andal di background daripada `<audio>`. Preload buffer `beep.mp3`, `bell.mp3`, `voice-lari.mp3`.
- **Pilihan Nada (Settings):**
  - `beep` (default), `bell`, `digital`, `voice` (TTS Web Speech API: "Ayo Lari!", "Jalan Santai")
  - Volume slider 0-100%
  - Tombol Test Sound
  - Custom upload (V2, Firebase Storage)
- **Vibrasi:** `navigator.vibrate(pattern)`
  - Run: `[400, 100, 400]`
  - Walk: `[200, 100, 200, 100, 200]`
  - Warmup/Cooldown: `[600]`
  - Cek `if ('vibrate' in navigator)` — iOS tidak support, tampilkan badge "Getar tidak tersedia di iOS"
- **Countdown 3-2-1:** Opsional beep kecil 3 detik sebelum ganti fase (voice coach).

### 5.3 Background & PWA
- **Wake Lock API:** `navigator.wakeLock.request('screen')` saat timer jalan, release saat pause/stop. Tampilkan indikator "Layar tetap menyala".
- **Service Worker:** `vite-plugin-pwa` (Workbox) — precache shell, runtime cache Firestore (stale-while-revalidate). Manifest: `display: standalone`, `orientation: portrait`.
- **Install Prompt:** Tampilkan banner "Install RunEase" setelah 2 sesi. Instruksi iOS "Add to Home Screen".
- **Fallback saat terkunci:**
  - Android Chrome PWA installed → audio tetap bunyi (teruji).
  - Jika audio diblokir, tampilkan `Notification` dengan `requireInteraction: true` + suara.
- **Batasan yang harus dikomunikasikan:** iOS Safari membatasi background audio >30 detik, vibrate tidak ada. Beri disclaimer di FAQ.

### 5.4 Preset
- **Bawaan (tidak bisa dihapus):**
  - `Pemula 1:2` — 1:00 / 2:00
  - `Seimbang 2:1` — 2:00 / 1:00
  - `Galloway 4:1` — 4:00 / 1:00
  - `Pro 5:1` — 5:00 / 1:00
  - `Sprint 0:30/0:30`
- **Custom:** User bisa simpan max 10 preset (Firestore `users/{uid}/presets`). Field: `name, runSec, walkSec, warmupSec, cooldownSec, soundId, icon`.
- UI: Chip horizontal scroll, quick select sebelum start.

### 5.5 Autentikasi
- **Provider:** Firebase Auth — Google Sign-In only (popup + redirect untuk PWA).
- **Anonymous Mode:** User bisa coba timer tanpa login (data di IndexedDB lokal). Saat login, tawarkan merge data lokal → cloud.
- **State:** `onAuthStateChanged` di `stores/userStore.ts:1`. Tampilkan avatar + nama di header.
- **Logout:** Clear local cache, tetap simpan data cloud.

### 5.6 History & Statistik
- **Penyimpanan:** Tiap sesi selesai (atau stop manual >60 detik) → doc di `users/{uid}/sessions/{sessionId}`.
- **Field:** `presetId, presetSnapshot, startedAt, endedAt, durationSec, setsCompleted, avgRunSec, status: completed|stopped`.
- **Tampilan:**
  - List harian, group by date, total durasi & set
  - Kalender heatmap (seperti GitHub contributions) — warna intensitas = durasi
  - Grafik mingguan/bulanan (durasi total, jumlah sesi)
  - Detail sesi: breakdown Run vs Walk menit
- **Hapus/Edit:** User bisa hapus sesi (soft delete).

### 5.7 Gamifikasi
**XP & Level:**
- Rumus: `XP = floor(runMinutes * 2 + walkMinutes * 1) + bonus`
- Bonus: `+5 XP` jika selesaikan >=30 menit, `+10 XP` jika streak 7 hari
- Level curve: `XP untuk level N = 50 * N * (N+1)/2` (Level 1: 50, Level 2: 150, Level 5: 750). Title tiap 10 level.

**Streak:**
- Streak = hari berturut ada sesi `completed` minimal 10 menit.
- Reset jam 00:00 zona waktu device (atau UTC+7 default).
- `streakFreeze`: 1 token/minggu, otomatis pakai jika lewat 1 hari (max 1).
- Pemicu streak dihitung via Cloud Function (atau client + server timestamp) agar tidak cheat ganti jam HP.
- UI: Api streak 🔥 + angka besar di Home, kalender dengan checkmark.

**Badge (12 awal):**
| Badge | Syarat |
|-------|--------|
| Langkah Pertama | Sesi pertama selesai |
| Konsisten 7 | Streak 7 hari |
| Konsisten 30 | Streak 30 hari |
| Pejuang 100 | 100 interval Run selesai |
| Marathon Mini | Sesi 60 menit |
| Early Bird | 5 sesi jam 05:00-07:00 |
| Night Runner | 5 sesi jam 20:00-23:00 |
| Kolektor Preset | Buat 3 preset custom |
| Penjelajah | Coba 5 preset berbeda |
| Kompletis | 20 sesi total |
| Veteran | 500 menit total lari |
| Legenda | Level 10 |

- Badge disimpan `users/{uid}/badges/{badgeId}: {earnedAt, seen}`. Trigger saat sesi selesai.

**Challenge:**
- Mingguan: `Selesaikan 5 sesi` atau `Total 150 menit`
- Bulanan: `Streak 15 hari`
- Progress bar di halaman Stats.

### 5.8 Export / Import JSON
- **Export:** Tombol di `Settings > Data` → `Export .json`. Isi: `{version:1, exportedAt, user, presets, sessions, badges, settings}`. Download via `Blob` + `URL.createObjectURL`.
- **Import:** Input file `.json` → validasi dengan Zod schema (cek version, field wajib). Pilihan: `Merge (tambah data baru)` atau `Replace (hapus & ganti)`. Tampilkan preview: "Akan menambah 12 sesi, 3 preset". Konfirmasi → tulis ke Firestore + IndexedDB.
- **Validasi:** Tolak jika version mismatch mayor, beri migrasi jika minor.
- **Keamanan:** Import hanya untuk `uid` yang login, tidak bisa import data user lain.

### 5.9 Settings
- Nada alarm (select + test)
- Vibrasi toggle
- Voice coach toggle
- Tema (Light Bauhaus only untuk MVP, Dark opsional V2)
- Bahasa: ID / EN
- Data: Export/Import, Hapus semua data (dengan konfirmasi ketik "HAPUS")
- Tentang: Versi, FAQ, Link GitHub

---

## 6. Spesifikasi Non-Fungsional

| Aspek | Requirement |
|-------|-------------|
| **Performa** | TTI <2s di 4G, Lighthouse PWA >90, Bundle <300kb gzip |
| **Akurasi Timer** | Drift <500ms per 30 menit (via Worker + Date.now correction) |
| **Offline** | Timer & preset tetap jalan offline; sync saat online |
| **Aksesibilitas** | WCAG AA kontras, tap target 44px, keyboard navigable, aria-live untuk countdown |
| **Responsive** | 320px — 1440px, mobile-first, portrait utama |
| **Browser** | Chrome Android 90+, Safari iOS 16+ (dengan degradasi), Chrome Desktop |
| **Keamanan** | Firestore Rules uid-based, tidak ada API key di client yang sensitif, tidak simpan data kesehatan sensitif |
| **Privasi** | Tidak ada tracking GPS di MVP, tidak share data ke pihak ketiga |

---

## 7. Alur Pengguna (User Flows)

### Flow 1: Sesi Pertama (Tanpa Login)
1. Buka PWA → Onboarding 3 slide (Apa itu Run-Walk, Izinkan Getar & Suara)
2. Atur Run 02:00 / Walk 01:00 (atau pilih Preset Pemula)
3. Tap `MULAI` → Fullscreen Timer, Wake Lock aktif
4. Alarm + getar tiap ganti fase → user lari/jalan
5. Tap `SELESAI` → Ringkasan sesi → Prompt "Login Google untuk simpan progres?"

### Flow 2: Login & Sync
1. Tap `Login Google` → Firebase popup → sukses
2. Jika ada data lokal → Modal "Gabungkan 2 sesi lokal ke cloud?"
3. Data sync → tampilkan Streak & Level di Home

### Flow 3: Export/Import
1. Settings → Export → file `runease-export-2026-09-05.json` terdownload
2. Ganti device → Login → Settings → Import → pilih file → preview → Merge → sukses → History muncul

---

## 8. Desain & UX Prinsip (Bauhaus)

- **Geometri Murni:** Semua elemen dari lingkaran, persegi, segitiga. Tidak ada radius tanggung (hanya `rounded-none` atau `rounded-full`).
- **Color Blocking:** Section full warna primer (Merah/Biru/Kuning) sebagai background, bukan aksen kecil.
- **Thick Border 2-4px hitam + Hard Shadow 4-8px** — depth tanpa blur.
- **Tipografi:** `Outfit` 900 untuk headline uppercase, tabular-nums untuk timer.
- Detail lengkap lihat `DESIGNSYSTEM.md:1` dan `STYLEGUIDE.md:1`.

---

## 9. Analitik & Event

Track (via Firebase Analytics, anonim):
- `timer_started {runSec, walkSec, mode, presetId}`
- `timer_completed {durationSec, sets}`
- `alarm_played {phase}`
- `streak_earned {length}`
- `badge_unlocked {badgeId}`
- `pwa_installed`
- `data_exported`, `data_imported`

---

## 10. Roadmap

| Fase | Durasi | Deliverable |
|------|--------|-------------|
| **Fase 1 MVP** | Minggu 1-2 | Vite+PWA+Firebase Auth, Timer Worker + Audio/Vibrate + Wake Lock, Preset lokal, UI Bauhaus Timer |
| **Fase 2 Data** | Minggu 3 | Firestore, History, Heatmap, Export/Import JSON, Offline sync |
| **Fase 3 Gamifikasi** | Minggu 4 | XP/Level, Streak (Cloud Function), 12 Badge, Challenge |
| **Fase 4 Polish** | Minggu 5 | Landing page, Onboarding, Install prompt, Testing Android/iOS, Deploy Firebase Hosting |

---

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| iOS background mati | Tinggi | Disclaimer + sarankan pakai earphone + keep app foreground, roadmap Capacitor wrapper |
| Browser throttle timer | Tinggi | WAJIB Web Worker, test di device low-end |
| User tolak vibrate permission | Sedang | Fallback suara lebih keras + visual flash |
| Drift waktu | Sedang | Koreksi `Date.now()` tiap tick, test 60 menit |
| Data hilang saat import replace | Tinggi | Konfirmasi 2 langkah + backup otomatis sebelum replace |

---

## 12. Pertanyaan Terbuka (Butuh Keputusan)

1. Apakah butuh mode `Target Jarak` (butuh GPS) di V2?
2. Apakah leaderboard sosial diperlukan atau cukup personal?
3. Apakah upload nada custom prioritas atau cukup 5 nada bawaan?
4. Bahasa default ID atau EN?
5. Apakah perlu dark mode Bauhaus (inversi) di V1?

---

## 13. Lampiran: Kriteria Penerimaan (Acceptance Criteria)

- [ ] Timer 2:00/1:00 looping 30 menit tanpa drift >2 detik di Android Chrome PWA installed + layar terkunci.
- [ ] Alarm berbunyi + vibrate tiap ganti fase, bisa test di Settings.
- [ ] Login Google berhasil, data sesi muncul di device lain setelah login.
- [ ] Export JSON bisa diimport di device lain dan merekonstruksi history 100%.
- [ ] Streak bertambah 1 tiap hari ada sesi >10 menit, badge "Langkah Pertama" muncul setelah sesi 1.
- [ ] Lighthouse PWA score >=90, installable.

---

*Dokumen ini adalah sumber kebenaran untuk implementasi. Perubahan harus via PR dan update versi.*
