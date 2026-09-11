# DEVELOP-NEXT-FEATURE — Social RunEase (Strava-lite)

> **Status:** Planning (belum dieksekusi)
> **Tanggal:** 12 September 2026
> **Tujuan:** Profil publik + teman + challenge gabungan + leaderboard per-challenge,
>   plus pengayaan aktivitas (tipe medan, foto). Tanpa GPS, tanpa feed/komentar.

## 0. Keputusan terkunci (jangan diubah tanpa diskusi)

| # | Keputusan |
|---|---|
| 1 | Scope = semua fase (1→4), dikerjakan berurutan |
| 2 | Leaderboard = per-challenge dulu (tanpa Cloud Functions) |
| 3 | Privasi default = private, opt-in publik eksplisit |
| 4 | Kategori sport = TIDAK multi-sport. Ganti: `activityType` auto (`run`/`walk`/`mix` dari rasio preset) + picker `terrain` (`road`/`trail`/`treadmill`, default `road`). Bike/other ditunda |
| 5 | Badge/gamifikasi tetap login-only (guest = lokal saja) |
| 6 | 1 set = 1× lari + 1× jalan (konsisten dengan `setsCompleted`) |
| 7 | Tanpa GPS / route / feed / like / komentar di plan ini |

## 1. Prinsip arsitektur

1. **Jangan buka isolasi `users/{uid}`** — semua yang boleh dilihat orang lain tinggal di
   koleksi publik baru. Rules privat yang ada tidak disentuh.
2. **Tulis = pemilik/pihak terlibat; baca publik = minimal.** Email tidak pernah publik;
   identitas publik hanya `username`.
3. **Idempoten di semua write sosial** (klaim username, join challenge, award) — aman
   di-tap 2x / offline-sync ganda.
4. **Hemat read** (Spark 50k/hari): ranking ≤50 entri, pencarian debounce + min 3 char,
   cache leaderboard 5 menit (client), foto wajib kompres.
5. **Konvensi kode yang berlaku**: Bauhaus (hanya `rounded-none`/`rounded-full`, hard shadow),
   `container-app`, target sentuh ≥44px, `tabular-nums` untuk angka, pola `confirm`/`notify`
   untuk aksi destruktif, pola `awardBadges`-style (diff lalu tulis) untuk operasi idempoten.

## 2. Schema database

### 2.1 `profiles/{uid}` — cerminan publik (BARU)

```ts
type UserProfile = {
  uid: string;                          // == doc id, dari Auth
  username: string;                     // lowercase, unik, 3-20, ^[a-z0-9_]+$
  displayName: string | null;
  photoURL: string | null;
  bio: string;                          // ≤160 char, default ""
  isPrivate: boolean;                   // default TRUE (keputusan #3)
  visibility: {                         // semua default FALSE
    stats: boolean;                     // total sesi/durasi/XP/level/streak
    badges: boolean;                    // semua badge + showcase
    activities: boolean;                // daftar aktivitas public/friends
    leaderboard: boolean;               // ikut muncul di ranking
  };
  showcaseBadges: string[];             // ≤3 badgeId MILIK SENDIRI, default []
  updatedAt: Timestamp;                 // serverTimestamp
};
```

Rules: `read: true` (dokumennya sendiri publik; KONTEN sensitif tidak ada di sini —
tamu hanya boleh lihat sesuai flag → ditegakkan di client + Cloud Function kelak;
catatan: flag visibility saat ini client-enforced, lihat §7 Risiko).
`create/update: request.auth.uid == uid`, validasi: `username` cocok regex,
`showcaseBadges.size() ≤ 3`, `bio.size() ≤ 160`.

### 2.2 `usernames/{username}` — klaim atomik (BARU)

```ts
type UsernameClaim = { uid: string; claimedAt: Timestamp };
```

Rules: `read: true`; `create: !exists(/usernames/{username}) && request.resource.data.uid == request.auth.uid`;
`delete: resource.data.uid == request.auth.uid`. Ganti username = create baru + delete lama
(dalam 1 batch client; bila create gagal = nama sudah dipakai → pesan "Username tidak tersedia").

### 2.3 `friendships/{autoId}` (BARU)

```ts
type Friendship = {
  members: [string, string];            // sorted [min,max] agar unik per pasangan
  status: "pending" | "accepted";
  initiatedBy: string;                  // uid pengirim
  updatedAt: Timestamp;
};
```

Rules: `read: request.auth.uid in resource.data.members`;
`create: request.auth.uid in request.resource.data.members && members.size()==2`;
`update: penerima saja (request.auth.uid != resource.data.initiatedBy) && hanya field status`;
`delete: anggota` (unfriend / batalkan request).
Anti-duplikat: sebelum create, query `where members array-contains uid` lalu cek pasangan di client;
indeks: `members (array) + status`.

### 2.4 `friendInvites/{kode}` — undang via link (BARU, opsional tapi disarankan)

```ts
type FriendInvite = {
  code: string;                         // == doc id, nanoid 8 char URL-safe
  fromUid: string;
  fromUsername: string;                 // denormalisasi untuk tampilan penerima
  createdAt: Timestamp;
  expiresAt: Timestamp;                 // +7 hari
  uses: number;                         // default 0
  maxUses: number;                      // default 1 (link personal) / 20 (link umum)
};
```

Alur: `/invite/{kode}` → login (jika belum) → preview pengirim → Terima = create friendship
(`pending` langsung `accepted` bila via invite? putuskan: langsung `accepted`, karena link
= persetujuan implisit) → `uses++`. Rules: read any-authenticated; create pemilik;
update `uses` hanya via transaksi client penerima.

### 2.5 `challenges/{id}` + `participants` (BARU)

```ts
type SocialChallenge = {
  id: string;                           // autoId
  title: string;                        // ≤60, wajib
  desc: string;                         // ≤280
  type: "sessions" | "minutes" | "streak_days";
  target: number;                       // 1..100 (sesi) | 10..3000 (menit) | 2..60 (hari)
  activityType: "run" | "walk" | "mix" | null;  // null = semua
  terrain: "road" | "trail" | "treadmill" | null;
  // null berarti semua; challenge sepeda/dll TIDAK didukung (keputusan #4)
  startAt: Timestamp; endAt: Timestamp; // 1..60 hari, startAt < endAt
  visibility: "public" | "link";        // link = hanya via kode/undangan
  joinCode: string;                     // nanoid 6, untuk visibility link
  createdBy: string;                    // uid
  creatorUsername: string;
  participantCount: number;             // increment transaksi saat join
  maxParticipants: number;              // default 100, max 500
  updatedAt: Timestamp;
};

type ChallengeParticipant = {
  uid: string;                          // == doc id
  username: string;
  joinedAt: Timestamp;
  current: number;                      // progres hitung-ulang client
  done: boolean;
  updatedAt: Timestamp;
};
```

Rules: challenge `read`: publik bila `visibility==public`, bila `link` → any-authenticated
(kode dirahasiakan di URL); `create/update/delete`: `createdBy`. Participants
`read`: peserta + (publik bila challenge publik); `write`: `uid == auth.uid` saja.
Indeks: `challenges: visibility ASC + endAt DESC`; `participants: current DESC (limit 50)`.
Laporkan: `challengeReports/{autoId}` `{challengeId, reporterUid, reason, createdAt}`,
write any-authenticated, read hanya pemilik challenge + (kelak) admin.

### 2.6 Perubahan `sessions` (tambah field, semua opsional)

```ts
activityType?: "run" | "walk" | "mix";  // auto saat save, lihat §3.1
terrain?: "road" | "trail" | "treadmill";// default "road"
title?: string;                         // ≤60, diisi di modal summary (opsional)
photoURLs?: string[];                   // ≤3, URL Storage (lihat §3.2)
visibility?: "private" | "friends" | "public"; // default ikut setting profil
```

Migrasi: dokumen lama tanpa field = diperlakukan `activityType` dihitung on-the-fly,
`terrain="road"`, `visibility="private"`. Export JSON naik `version: 2`
(update `ExportSchema`, `PresetSchema` tetap, `SessionSchema` +5 field opsional;
import v1 tetap diterima).

### 2.7 Storage

- `users/{uid}/activityPhotos/{sessId}/{uuid}.jpg` — `allow write: owner && image/* && <1MB`;
  max 3/sesi ditegakkan client (cek jumlah sebelum upload) + nama path terikat sessId.
- `users/{uid}/profile/avatar.jpg` — foto profil custom (selain URL Google), `<1MB`, `image/*`.
- Client WAJIB: resize ≤1600px sisi panjang + JPEG q0.8 + strip EXIF (lewat canvas) SEBELUM upload.

## 3. Logic per fitur

### 3.1 Derivasi `activityType` (nol friksi untuk user)

```ts
// di saveSession (session.ts), dari config preset saat itu:
const ratio = runSec / (runSec + walkSec);
activityType = ratio >= 0.7 ? "run" : ratio <= 0.3 ? "walk" : "mix";
```

`terrain` dari state Timer (picker 3 opsi, default `"road"`); `title` + `visibility`
diisi di modal summary (opsional, bisa dilewati); foto dipilih di modal summary juga
(upload async setelah sesi tersimpan, lalu `updateDoc` tambah `photoURLs`).

### 3.2 Upload foto (`lib/photos.ts` baru)

`compressImage(file) → Blob` (canvas: max 1600px, q0.8, EXIF hilang otomatis) →
`uploadActivityPhoto(uid, sessId, blob)` (nama `uuid.jpg`, cek total ≤3) →
return downloadURL. Gagal upload = sesi tetap tersimpan, tampilkan retry di Riwayat
(tidak boleh menghalangi save sesi).

### 3.3 Profil (`lib/profile.ts` baru)

- `ensureProfile(uid)`: buat default saat user pertama login
  (`username = ""` kosong = profil belum diklaim → banner "Klaim username").
- `claimUsername(uid, name)`: normalisasi lowercase + validasi regex +
  batch `[set usernames/{name}, update profiles/{uid}, delete usernames/{lama}]`.
  Gagal = nama dipakai.
- `updateProfile(uid, patch)`: whitelist field (displayName/bio/photoURL/isPrivate/
  visibility/showcaseBadges); `showcaseBadges`: verifikasi tiap id ada di
  `users/{uid}/badges` (baca dulu, tolak id asing) + max 3.
- `getPublicProfile(username)`: `usernames/{name}` → `profiles/{uid}`; bila
  `isPrivate && viewer != owner` → kembalikan hanya `{username, displayName, photoURL,
  isPrivate:true}` (SEMUA field lain disembunyikan client).
- Share: URL `/p/{username}` + `navigator.share` fallback salin link + QR
  (lib QR ringan, mis. `qrcode` — render canvas, tanpa dep berat).
- Halaman `/p/:username`: mode pemilik (menu Edit/Bagikan/Visibilitas) vs tamu
  (tombol Tambah Teman bila login & bukan diri sendiri).

### 3.4 Teman (`lib/friends.ts` baru)

- `sendRequest(fromUid, toUid)`: tolak bila diri sendiri / sudah ada friendship
  (query `members array-contains fromUid`, cek pasangan client) → create `pending`.
- `respond(id, accept)`: penerima saja; `accepted` atau delete (tolak = hapus).
- `unfriend(id)`: anggota → delete.
- `acceptInvite(code)`: baca invite (cek expiry + uses<maxUses) → transaksi:
  create friendship `accepted` + `uses++`.
- Daftar teman: query friendships `members array-contains uid && status==accepted`,
  resolve profil lawan via `profiles/{otherUid}` (batch get, max ~200 teman; paginasi bila perlu).
- Aturan tampilan: aktivitas/sesi teman hanya yang `visibility != private`
  (`friends` terlihat bila berteman — cek lawan ada di daftar teman viewer).

### 3.5 Challenge (`lib/socialChallenges.ts` baru)

- `createChallenge(uid, input)`: validasi (batas §2.5, `startAt < endAt`, durasi ≤60 hari)
  → doc + `joinCode` nanoid → pembuat OTOMATIS join sebagai peserta pertama.
- `joinChallenge(idOrCode, uid)`: cek `maxParticipants`, belum join, (bila `link`: kode cocok)
  → transaksi `set participants/{uid} + participantCount++`.
- `leaveChallenge`: delete participant + `participantCount--` (transaksi). Keluar ≠ hapus progres sesi.
- `computeProgress(challenge, mySessions, myStreak)`: filter sesi
  (`status != abandoned`, `startedAt` dalam `[startAt,endAt]`, `activityType`/`terrain`
  cocok bila diset) → sessions: count; minutes: `floor(sum(dur)/60)`; streak_days:
  `streak.current` (hitung-ulang `calcStreak` dari sesi dalam window bila perlu akurat
  per-challenge? MVP: pakai `streak.current` global + info di UI).
- `refreshMyProgress`: hitung lalu `set` participant `{current, done}` (idempoten;
  dipanggil saat buka detail challenge + setelah sesi selesai bila user ikut ≥1 challenge aktif).
- Ranking: query participants `orderBy current DESC limit 50` (hanya bila
  `visibility.leaderboard` pemilik... catatan: ranking per-challenge selalu terlihat
  peserta — ikut challenge = setuju tampil di ranking itu; tulis di UI saat join).
- Selesai (`now > endAt`): badge `challenge_winner` untuk peringkat 1 bila peserta ≥5
  (definisi badge baru di `badges.ts` + evaluasi di refresh; butuh baca ranking → hanya
  bila viewer peserta).
- Hapus challenge: pembuat saja + konfirmasi ketik (pola Zona Bahaya); participants ikut
  terhapus (client loop delete, ≤500 — cukup karena max peserta 500).

### 3.6 Leaderboard per-challenge (tampilan)

Tab di detail challenge: peringkat (username, progres, %), highlight baris sendiri,
waktu refresh + tombol Muat Ulang (cache client 5 menit via timestamp state),
empty-state bila <2 peserta ("Bagikan kode `{joinCode}` untuk mengajak").

## 4. UI — rute & komponen

- Rute baru: `/p/:username` (profil), `/profile/edit` (milik sendiri),
  `/friends` (tab Teman/Permintaan/Cari), `/invite/:code`,
  `/challenges` (Jelajah/Dibuat/Diikuti), `/challenges/:id` (detail+ranking+progres),
  `/challenges/new` (buat).
- Navigasi: BottomNav tetap 4 (keputusan: Profil via avatar TopNav agar nav bawah stabil);
  link Teman & Challenge masuk lewat halaman Profil + FAB/link di Statistik.
- Komponen baru (`components/{profile,friends,social-challenges}/`):
  `profile-header.tsx`, `showcase-picker.tsx` (pilih ≤3 dari badge milik sendiri),
  `visibility-toggles.tsx`, `share-sheet.tsx` (link/QR/salin), `friend-row.tsx`,
  `user-search.tsx` (debounce 400ms, min 3 char), `challenge-card.tsx` (JANGAN bentrok
  nama dengan `gamification/challenge-card.tsx` yang sudah ada → beri nama
  `social-challenge-card.tsx`), `leaderboard-table.tsx`, `terrain-picker.tsx`,
  `photo-picker.tsx` (preview + kompres + max 3).
- Semua teks Indonesia, pola loading/error/empty konsisten dengan halaman yang ada.

## 5. Validasi & batas (ringkas, ditegakkan client + rules)

username regex/unik • bio ≤160 • showcase ≤3 milik sendiri • sesi: foto ≤3 & ≤1MB,
title ≤60 • challenge: target sesuai tipe, durasi 1–60 hari, peserta ≤500 •
invite expiry 7 hari • ranking read ≤50 • search min 3 char + debounce.

## 6. Testing (wajib tiap fase)

- Unit: derivasi activityType (0.7/0.3 batas), sanitize challenge input, klaim username
  (mock), computeProgress per tipe + filter terrain/window, ranking sort.
- Integrasi (2 akun: Chrome + Incognito): invite→accept, request→tolak/terima,
  join→progres naik→done, visibility (tamu vs teman vs pemilik), ganti username
  (lama bebas, baru unik), keluar challenge, hapus challenge.
- `tsc -b` + `eslint --max-warnings 0` tiap fase; `vitest run` dari WSL bernode.
- Rules: baca `profiles` orang lain OK; tulis DITOLAK; baca `users/{orang}/sessions` DITOLAK.

## 7. Risiko & batas yang disadari

1. **Visibility client-enforced**: profil publik bisa dibaca siapa pun (termasuk field
   yang "disembunyikan" bila disimpan di `profiles`). Mitigasi: JANGAN simpan data
   sensitif di `profiles` (hanya yang memang boleh publik); penegakan server penuh
   butuh Cloud Functions (Fase 5).
2. **Cheat leaderboard**: timer bisa jalan tanpa lari → leaderboard = gengsi + badge saja,
   tanpa hadiah; sesi <60 dtk tidak dihitung (sudah ada).
3. **Moderasi**: judul/desc challenge + bio = filter kata kasar client + tombol Laporkan
   (`challengeReports`); hapus oleh pembuat. Tanpa admin console di plan ini.
4. **Kuota Spark**: patuhi batas read di §5; bila tembus → Fase 5 (Functions + cache).
5. **Anon/guest**: semua fitur sosial login-only (konsisten dengan badge). Guest tetap
   bisa timer seperti sekarang.

## 8. Urutan eksekusi + Definition of Done per fase

- **Fase 1** (aktivitas kaya): session.ts, types/session.ts, schemas.ts (export v2),
  timer.tsx (terrain picker + summary title/visibilitas/foto), photos.ts, session-card,
  storage.rules. DoD: sesi tersimpan berfoto+terrain, tampil di Riwayat, export/import v2 lolos.
- **Fase 2** (profil): types/profile.ts, lib/profile.ts, pages profil+edit, komponen §4,
  rules profiles/usernames, indeks. DoD: klaim username, edit, share link, showcase ≤3,
  tamu lihat sesuai visibility, private default.
- **Fase 3** (teman): lib/friends.ts, pages friends+invite, rules friendships/invites,
  indeks. DoD: request→accept→unfriend + invite link, daftar teman 2-arah benar.
- **Fase 4** (challenge): lib/socialChallenges.ts, pages challenges, ranking, badge
  `challenge_winner`, rules challenges/participants/reports, indeks. DoD: buat→join
  (kode+publik)→progres→done→ranking→lapor→hapus, semua idempoten.
- Setiap fase ditutup: `tsc`, eslint, test baru, dan TIDAK merusak alur timer yang ada
  (regresi: start→stop→riwayat→statistik hijau).

## 9. Di luar plan ini (Fase 5, butuh Cloud Functions)

Leaderboard global mingguan, moderasi otomatis, hapus-akun rekursif, penegakan
visibility server-side, notifikasi push undangan/progres ("temanmu menyalip!").

## 10. Keputusan navigasi yang masih terbuka

Profil via avatar TopNav (BottomNav tetap 4) vs tambah tab Profil ke-5 di BottomNav
(lebih discoverable, tapi nav bawah makin sempit). Diputuskan saat mulai Fase 2.
