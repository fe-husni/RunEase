# TESTING — RunEase

> Sumber kebenaran: `PRD.md:13` (AC-01..AC-06). Semua test di bawah manual di device fisik —
> emulator tidak mensimulasikan throttling background secara akurat.
> Test otomatis: `npx tsc --noEmit`, `npm run lint`, `npm run build` (wajib hijau di CI).
> Suite vitest permanen belum ada (`npm run test:run` saat ini 0 file) — itu follow-up, bukan P0.

## 1. Acceptance Criteria → Cara Uji

| AC | Kriteria (PRD) | Cara uji | Lolos jika |
|---|---|---|---|
| AC-01 | Timer 2:00/1:00 looping 30m drift ≤2s di Android Chrome PWA installed + layar terkunci | M1 | Selisih waktu nyata vs ekspektasi ≤2s, tidak ada fase terlewat |
| AC-02 | Alarm + vibrate tiap ganti fase, bisa test di Settings | M2 + tombol Test di Settings | Tiap `phaseChange` bunyi <100ms + getar sesuai pola |
| AC-03 | Login Google OK, sesi muncul di device lain setelah login | M5 | History identik di 2 device |
| AC-04 | Export JSON bisa diimport di device lain, history 100% sama | M6 | Jumlah sesi/preset/badge sama persis |
| AC-05 | Streak +1 tiap hari ada sesi >10m, badge "Langkah Pertama" muncul setelah sesi 1 | M7 | Streak/flame + badge toast muncul |
| AC-06 | Lighthouse PWA ≥90, installable | M8 | Skor PWA ≥90, prompt install muncul |

## 2. Matriks Device (isi tiap rilis)

| ID | Device + OS + Browser | Kondisi | AC terkait | Hasil | Tanggal / Tester |
|---|---|---|---|---|---|
| D1 | Android + Chrome, PWA installed | Layar terkunci 30m (M1) | AC-01, AC-02 | ☐ | / |
| D2 | Android + Chrome tab | Background 5m lalu foreground | AC-01 | ☐ | / |
| D3 | iOS 16+ Safari | Foreground + earphone (fallback) | AC-02 (degradasi) | ☐ | / |
| D4 | Desktop Chrome | Normal + keyboard | AC-02, AC-06 | ☐ | / |
| D5 | 2 device (HP + desktop) | Login sama (M5, M6) | AC-03, AC-04 | ☐ | / |

Keterbatasan yang dikomunikasikan ke user (bukan bug): iOS membatasi audio background
>30 detik dan tidak ada vibrate — pakai earphone + biarkan app foreground, fallback notifikasi.

## 3. Prosedur Manual

### M1 — Drift 30 menit (AC-01)
1. Install PWA (`Share/Add to Home Screen` atau prompt), buka dari ikon.
2. Preset 2:00/1:00, tap MULAI, catat jam mulai (jam dinding).
3. Kunci layar 30 menit tanpa membuka HP.
4. Buka, bandingkan total elapsed vs ekspektasi. **Lolos:** selisih ≤2 detik, tiap ganti
   fase tercatat (cek History durasi ≈30:00).

### M2 — Alarm + vibrate + Wake Lock (AC-02)
1. Settings → Suara → Test (beep/bell/voice), geser volume.
2. Timer 0:10/0:05 → MULAI → dengar tiap ganti fase: nada Run ≠ Walk, getar
   Run `[400,100,400]`, Walk `[200,100,200,100,200]`.
3. Saat jalan: indikator "layar tetap menyala" (dot hijau) tampil; Pause → Wake Lock release.
4. Desktop: Space = pause/resume, S = skip, Esc = stop.

### M3 — Offline shell
1. Online: buka `/timer` sekali (precache). Matikan internet, reload → shell tetap muncul.
2. Timer tetap jalan offline; preset tersedia. Online lagi → sesi sync otomatis.

### M4 — Install prompt
1. Akun fresh (atau clear site data): selesaikan 2 sesi → banner kuning "Install RunEase" muncul.
2. Android: tap Install → `prompt()` → app terpasang. iOS: ikuti instruksi Share → Add to Home Screen.

### M5 — Login + sync + migrasi (AC-03)
1. Tanpa login: buat 1 sesi tamu (≥60s) → History tampil "Guest mode".
2. Login Google → modal "Gabungkan N sesi lokal?" → Ya → sesi tamu pindah ke cloud.
3. Login akun sama di device kedua → History sama.

> Known issue Android (sudah ditangani): alur redirect murni gagal diam-diam
> (`success-null`) saat serah-terima via handler `firebaseapp.com` terhambat
> pemblokiran third-party cookie (default Chrome Android). App memakai
> popup-dulu + redirect-fallback di semua device; kegagalan tanpa hasil
> menampilkan panduan "Login tidak selesai…" + tombol Coba lagi (jangan diam).
> Jangan tutup tab saat dialihkan ke Google.

### M6 — Export/Import (AC-04)
1. Device A: Settings → Export → file `runease-export-YYYY-MM-DD.json` terdownload, valid JSON, ada `version:1`.
2. Device B (login sama): Import → preview "N sesi, M preset" → Merge → History identik 100%.
3. Negatif: file versi salah → error merah; Replace → wajib ketik `HAPUS` + backup otomatis dibuat.

### M7 — Streak + badge (AC-05)
1. Selesaikan sesi pertama (≥60s) → toast + badge "Langkah Pertama".
2. Sesi ≥10m di hari berbeda → streak +1 (reset 00:00 Asia/Jakarta, 1 freeze token/minggu).
3. Cek Stats: LevelBar, StreakFlame, 12 badge (belum earned = grayscale), challenge mingguan bergerak.

### M8 — Lighthouse (AC-06)
1. Desktop Chrome DevTools → Lighthouse → Mobile → PWA. **Lolos:** PWA ≥90, Accessibility ≥95.
2. Cek tab manual: semua tombol 44px, focus ring biru, timer `aria-live`, reduced-motion tidak animasi.

## 4. Regresi Cepat (tiap PR, ±10 menit, desktop cukup)

- [ ] `npx tsc --noEmit` + `npm run lint` + `npm run build` hijau
- [ ] `/timer` 0:10/0:05 full loop: MULAI → pause → resume → skip → stop → modal ringkasan → SIMPAN → History +1
- [ ] TimeInput tolak <10 detik; preset custom tersimpan setelah refresh
- [ ] `rg "rounded-(md|lg|xl)" src` = 0, `rg "gradient" src` = 0
- [ ] Hak akses: baca `users/{uid-orang-lain}` → Denied (rules)

## 5. Template Laporan

```
Tanggal:
Tester:
Device/OS/Browser:
Commit:
M1 drift: PASS/FAIL (selisih __s)
M2 alarm/vibrate: PASS/FAIL (catatan: __)
M5/M6 sync: PASS/FAIL
M8 Lighthouse PWA: __ / A11y: __
Bug: (langkah reproduksi + ekspektasi vs aktual)
```
