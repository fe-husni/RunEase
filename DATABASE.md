# DATABASE — RunEase Firebase Schema

> **Versi:** 1.0  
> **Tanggal:** 5 September 2026  
> **Backend:** Firebase Authentication + Cloud Firestore + Cloud Storage + Firebase Hosting  
> **File Referensi:** `src/lib/firebase.ts:1`, `src/lib/db.ts:1`, `firestore.rules:1`

---

## 1. Gambaran Arsitektur Data

```
[ PWA React ] --onAuthStateChanged--> [ Firebase Auth (Google) ]
      |
      +--(online)--> [ Cloud Firestore ] <--(offline)--> [ IndexedDB (idb) + localForage ]
      |                     |
      |                     +--> [ Cloud Storage ] (nada custom mp3)
      |
      +--(export)--> [ .json File ] --(import)--> [ Firestore + IndexedDB ]
```

**Prinsip:**
- **Offline-first:** Semua baca/tulis lewat cache IndexedDB dulu (`enableIndexedDbPersistence`), sync otomatis saat online.
- **User-isolated:** Semua data di bawah `users/{uid}` — tidak ada koleksi global yang bisa dibaca user lain (kecuali `leaderboard` V2).
- **Versioned Export:** JSON export berisi `version` agar bisa migrasi schema di masa depan tanpa merusak import lama.
- **Denormalisasi Minimal:** `presetSnapshot` disimpan di `sessions` agar history tidak rusak jika preset dihapus.

---

## 2. Firebase Setup

### 2.1 Auth
- **Provider:** `GoogleAuthProvider` only. `signInWithPopup` (desktop) + `signInWithRedirect` (PWA iOS).
- **Anonymous:** `signInAnonymously()` untuk coba tanpa login. Data anon disimpan di `users/{anonUid}` dan dimigrasi saat link dengan Google via `linkWithCredential`.
- **File:** `src/lib/firebase.ts:1`
  ```ts
  import { initializeApp } from "firebase/app";
  import { getAuth, GoogleAuthProvider } from "firebase/auth";
  import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
  import { getStorage } from "firebase/storage";
  export const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  export const storage = getStorage(app);
  enableIndexedDbPersistence(db).catch(...);
  ```

### 2.2 Firestore Settings
- **Location:** `asia-southeast1` (Singapura, dekat Indonesia)
- **Mode:** Native mode
- **Persistence:** `enableIndexedDbPersistence` + `enableMultiTabIndexedDbPersistence` (opsional)

---

## 3. Skema Koleksi

### 3.1 `users/{uid}` — Profil & Gamifikasi

**Path:** `users/{uid}`  
**Dokumen ID:** `uid` dari Firebase Auth  
**Dibuat:** Saat `onAuthStateChanged` pertama (jika belum ada)

```ts
type UserDoc = {
  uid: string;                 // PK, dari auth
  displayName: string | null;  // dari Google
  email: string | null;
  photoURL: string | null;
  createdAt: Timestamp;        // serverTimestamp()
  updatedAt: Timestamp;

  // Gamifikasi
  xp: number;                  // default 0
  level: number;               // default 1, hitung via formula
  streak: {
    current: number;           // hari berturut
    longest: number;
    lastDate: string | null;   // "2026-09-05" (YYYY-MM-DD, zona Asia/Jakarta)
    freezeTokens: number;       // default 1, reset tiap Senin
    updatedAt: Timestamp;
  };
  stats: {
    totalSessions: number;
    totalDurationSec: number;  // akumulasi
    totalRunSec: number;
    totalWalkSec: number;
  };
  preferences?: {
    language: "id" | "en";     // default "id"
    theme: "bauhaus-light";    // V2: "bauhaus-dark"
  };
}
```

**Contoh Dokumen:**
```json
{
  "uid": "abc123",
  "displayName": "Budi",
  "email": "budi@gmail.com",
  "photoURL": "https://...",
  "createdAt": "2026-09-05T02:00:00Z",
  "xp": 120,
  "level": 2,
  "streak": { "current": 3, "longest": 5, "lastDate": "2026-09-04", "freezeTokens": 1 },
  "stats": { "totalSessions": 12, "totalDurationSec": 5400 }
}
```

### 3.2 `users/{uid}/presets/{presetId}` — Preset Interval

**Path:** `users/{uid}/presets/{presetId}`  
**ID:** `autoId` (nanoid) atau `preset_budi_custom1`

```ts
type PresetDoc = {
  id: string;
  name: string;                // "Seimbang 2:1", max 30 char
  runSec: number;              // 10..600
  walkSec: number;             // 10..600
  warmupSec: number;           // 0..600, default 0
  cooldownSec: number;         // 0..600, default 0
  mode: "infinite" | "duration" | "sets"; // default "infinite"
  targetDurationSec?: number;  // jika mode=duration
  targetSets?: number;         // jika mode=sets
  soundId: string;             // "beep" | "bell" | "voice" | "custom_xxx"
  icon: "circle" | "square" | "triangle"; // untuk Bauhaus decoration
  color: "red" | "blue" | "yellow"; // warna kartu preset
  isBuiltIn: boolean;          // true untuk 5 preset bawaan (tidak bisa dihapus, tapi bisa di-copy)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Preset Bawaan (seed saat user baru):**
| id | name | runSec | walkSec | color | icon |
|----|------|--------|---------|-------|------|
| `builtin_1_2` | Pemula 1:2 | 60 | 120 | yellow | circle |
| `builtin_2_1` | Seimbang 2:1 | 120 | 60 | blue | square |
| `builtin_4_1` | Galloway 4:1 | 240 | 60 | red | triangle |
| `builtin_5_1` | Pro 5:1 | 300 | 60 | red | square |
| `builtin_sprint` | Sprint 0:30 | 30 | 30 | yellow | circle |

**Batasan:** Max 10 custom preset per user (validasi di client + rules).

### 3.3 `users/{uid}/sessions/{sessionId}` — History Sesi

**Path:** `users/{uid}/sessions/{sessionId}`  
**ID:** `autoId`

```ts
type SessionDoc = {
  id: string;
  presetId: string | null;     // referensi preset, null jika manual tanpa save
  presetSnapshot: {            // denormalisasi agar history imun terhadap hapus preset
    name: string;
    runSec: number;
    walkSec: number;
    warmupSec: number;
    cooldownSec: number;
  };
  status: "completed" | "stopped" | "abandoned"; // abandoned jika <60 detik
  startedAt: Timestamp;        // serverTimestamp
  endedAt: Timestamp;
  durationSec: number;         // endedAt - startedAt
  setsCompleted: number;       // berapa kali cycle Run+Walk selesai
  phases: Array<{
    phase: "warmup" | "run" | "walk" | "cooldown";
    startedAt: Timestamp;
    durationSec: number;
  }>; // opsional, untuk detail breakdown (bisa di-skip di MVP untuk hemat write)
  xpEarned: number;
  createdAt: Timestamp;
}
```

**Indeks yang dibutuhkan:**
- `users/{uid}/sessions` → `startedAt DESC` (untuk list history)
- `users/{uid}/sessions` → `startedAt ASC` + `status == completed` (untuk hitung streak)

**Contoh:**
```json
{
  "id": "sess_xyz",
  "presetId": "builtin_2_1",
  "presetSnapshot": { "name": "Seimbang 2:1", "runSec": 120, "walkSec": 60, "warmupSec": 0, "cooldownSec": 60 },
  "status": "completed",
  "startedAt": "2026-09-05T05:00:00Z",
  "endedAt": "2026-09-05T05:30:00Z",
  "durationSec": 1800,
  "setsCompleted": 10,
  "xpEarned": 35
}
```

### 3.4 `users/{uid}/badges/{badgeId}` — Badge

**Path:** `users/{uid}/badges/{badgeId}`  
**ID:** `badgeId` dari daftar badge (bukan autoId, agar idempotent)

```ts
type BadgeDoc = {
  id: string;                  // "first_step", "streak_7", ...
  name: string;                // "Langkah Pertama"
  description: string;
  icon: string;                // "award" lucide icon name
  color: "red" | "blue" | "yellow";
  earnedAt: Timestamp;
  seen: boolean;               // false = baru dapat, tampilkan notifikasi
}
```

**Daftar Badge ID (seed):**
`first_step, streak_7, streak_30, intervals_100, marathon_mini, early_bird, night_runner, preset_collector, explorer, completist_20, veteran_500, legend_10`

### 3.5 `users/{uid}/settings/{settingsId}` — Settings (alternatif: field di `users/{uid}`)

**Opsi A (direkomendasikan):** Simpan sebagai sub-doc `users/{uid}/settings/main` agar tidak membebani read `users` tiap tick.

```ts
type SettingsDoc = {
  soundId: string;             // "beep"
  volume: number;              // 0..100, default 80
  vibrate: boolean;            // default true
  voiceCoach: boolean;         // default false
  countdownBeep: boolean;      // default true
  wakeLock: boolean;           // default true
  language: "id" | "en";
  notifications: boolean;      // V2
  updatedAt: Timestamp;
}
```

**Opsi B:** Simpan langsung di `users/{uid}.preferences` (lebih simpel, 1 read). Pilih salah satu, jangan dua-duanya.

### 3.6 Koleksi Masa Depan (V2)
- `leaderboardWeekly/{weekId}/entries/{uid}` — untuk ranking (butuh Cloud Function agregasi)
- `challenges/{challengeId}` — definisi challenge global

---

## 4. Cloud Storage

**Path:** `users/{uid}/sounds/{soundId}.mp3`

```ts
// Aturan:
// - maxSize 1MB
// - contentType audio/mpeg, audio/wav, audio/ogg
// - maxDuration 5 detik (validasi client, tidak bisa di Storage Rules, jadi validasi di Cloud Function)
// - max 3 file per user
```

**Metadata:**
```json
{ "custom": true, "originalName": "my-beep.mp3", "durationSec": 3 }
```

---

## 5. Security Rules

**File:** `firestore.rules:1`

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User hanya bisa akses datanya sendiri
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /presets/{presetId} {
        allow read, write: if request.auth.uid == uid;
        // Validasi
        allow create: if request.resource.data.runSec >= 10
                      && request.resource.data.runSec <= 600
                      && request.resource.data.walkSec >= 10
                      && request.resource.data.walkSec <= 600;
      }
      match /sessions/{sessionId} {
        allow read, write: if request.auth.uid == uid;
        allow create: if request.resource.data.durationSec >= 0;
      }
      match /badges/{badgeId} {
        allow read, write: if request.auth.uid == uid;
      }
      match /settings/{docId} {
        allow read, write: if request.auth.uid == uid;
      }
    }
    // Deny all else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Storage Rules (`storage.rules:1`):**
```rules
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/sounds/{fileName} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid
                   && request.resource.size < 1 * 1024 * 1024
                   && request.resource.contentType.matches('audio/.*');
    }
  }
}
```

---

## 6. Indeks & Query

**Indeks Komposit yang perlu dibuat (via `firestore.indexes.json:1`):**

```json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "startedAt", "order": "DESCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Query Umum:**
```ts
// History 20 terbaru
query(collection(db, `users/${uid}/sessions`), orderBy("startedAt", "desc"), limit(20))

// Hitung streak: ambil 60 hari terakhir yang completed
query(collection(db, `users/${uid}/sessions`), where("status","==","completed"), orderBy("startedAt","desc"), limit(60))

// Preset custom user
query(collection(db, `users/${uid}/presets`), orderBy("createdAt","asc"))
```

---

## 7. Offline & Sync Strategi

1. **Enable Persistence:**
   ```ts
   // src/lib/firebase.ts:10
   enableIndexedDbPersistence(db, { synchronizeTabs: true });
   ```
2. **Optimistic UI:** Tulis ke Firestore, UI update langsung dari cache lokal (latency compensation). Jika offline, tulis antre di IndexedDB, sync saat online (otomatis oleh SDK).
3. **Conflict:** Last-write-wins (Firestore default). Untuk `streak` dan `xp`, gunakan `increment()` agar tidak race:
   ```ts
   updateDoc(userRef, { xp: increment(xpEarned), "stats.totalSessions": increment(1) })
   ```
4. **Fallback Lokal:** Jika user belum login (anon), semua data disimpan di `localForage` dengan key `runease:presets`, `runease:sessions`. Saat login, migrasi:
   ```ts
   // src/lib/migrate.ts:1
   async function migrateLocalToCloud(uid) {
     const localSessions = await localForage.getItem("sessions");
     const batch = writeBatch(db);
     localSessions.forEach(s => batch.set(doc(db, `users/${uid}/sessions/${s.id}`), s));
     await batch.commit();
     await localForage.clear();
   }
   ```

---

## 8. Export / Import JSON

### 8.1 Format Export

**File:** `runease-export-YYYY-MM-DD.json`  
**MIME:** `application/json`  
**Versi:** `1` (increment saat schema berubah mayor)

```ts
type ExportFile = {
  version: 1;
  exportedAt: string;          // ISO 8601
  exportedBy: string;          // uid
  appVersion: string;          // "1.0.0"
  data: {
    user: UserDoc;
    presets: PresetDoc[];
    sessions: SessionDoc[];
    badges: BadgeDoc[];
    settings: SettingsDoc;
  };
}
```

**Contoh File:**
```json
{
  "version": 1,
  "exportedAt": "2026-09-05T10:00:00.000Z",
  "exportedBy": "abc123",
  "appVersion": "1.0.0",
  "data": {
    "user": { "xp": 120, "level": 2, "streak": {...} },
    "presets": [ { "id": "custom1", "name": "Pagi", "runSec": 120, "walkSec": 60 } ],
    "sessions": [ { "id": "sess1", "durationSec": 1800, "startedAt": "2026-09-01T05:00:00Z" } ],
    "badges": [ { "id": "first_step", "earnedAt": "2026-09-01T05:30:00Z" } ],
    "settings": { "soundId": "beep", "volume": 80 }
  }
}
```

**Cara Export (`src/lib/export.ts:1`):**
```ts
export async function exportData(uid: string) {
  const [userSnap, presetsSnap, sessionsSnap, badgesSnap, settingsSnap] = await Promise.all([
    getDoc(doc(db, `users/${uid}`)),
    getDocs(collection(db, `users/${uid}/presets`)),
    getDocs(collection(db, `users/${uid}/sessions`)),
    getDocs(collection(db, `users/${uid}/badges`)),
    getDoc(doc(db, `users/${uid}/settings/main`)),
  ]);
  const file = { version: 1, exportedAt: new Date().toISOString(), exportedBy: uid, appVersion: "1.0.0", data: { ... } };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `runease-export-${new Date().toISOString().slice(0,10)}.json`; a.click();
}
```

### 8.2 Import & Validasi

**File:** `src/lib/import.ts:1`

**Langkah:**
1. User pilih file `.json` (input file, max 5MB).
2. `JSON.parse` + validasi Zod:
   ```ts
   const ExportSchema = z.object({
     version: z.literal(1),
     exportedAt: z.string().datetime(),
     data: z.object({
       presets: z.array(PresetSchema),
       sessions: z.array(SessionSchema),
       badges: z.array(BadgeSchema),
       settings: SettingsSchema,
     })
   });
   ```
3. Tampilkan preview: "Ditemukan 12 sesi (1 Jan - 5 Sep), 3 preset, 4 badge. Pilih mode: **Merge** (tambah baru, skip duplikat by id) atau **Replace** (hapus semua lalu import)."
4. Jika `Replace`, tampilkan konfirmasi 2 langkah: ketik `HAPUS` + backup otomatis export sebelum replace.
5. Tulis via `writeBatch` (max 500 writes per batch, chunk jika >500 sesi).
6. Update `users/{uid}` stats via agregasi ulang.

**Penanganan Duplikat (Merge):**
- Preset: jika `id` sudah ada → skip atau overwrite? Pilih **skip** (tampilkan "2 preset duplikat dilewati").
- Sessions: jika `id` sudah ada → skip.
- Badges: jika `id` sudah ada → skip.

**Migrasi Versi:**
- Jika `version == 1` → langsung import.
- Jika `version < 1` → tolak, minta export ulang di versi baru.
- Jika `version > 1` → tolak, minta update app.

---

## 9. Cloud Functions (Opsional tapi Direkomendasikan)

**File:** `functions/src/index.ts:1`

1. **`onSessionCreated`**: Trigger saat `sessions/{sessionId}` dibuat → hitung `xpEarned`, update `users/{uid}.xp/level/stats`, cek `streak` (bandingkan `lastDate` dengan `today`), cek `badge` eligibility, set `badges/{badgeId}` jika memenuhi.
   - Kenapa server-side? Agar streak tidak bisa dicurangi dengan ganti jam HP.

2. **`recalculateStats`**: Callable function untuk hitung ulang stats dari nol (untuk setelah import replace).

3. **`validateSoundUpload`**: Trigger Storage `onFinalize` → cek durasi audio via `ffprobe` (atau client sudah validasi, ini double-check), hapus jika >5 detik.

---

## 10. Backup & Retensi

- **Firestore Backup:** Aktifkan daily export via `gcloud firestore export` ke Cloud Storage bucket (opsional untuk produksi).
- **Retensi Client:** Tidak ada auto-delete. User bisa hapus manual per sesi atau "Hapus Semua Data" di Settings.
- **Hapus Akun:** Saat user hapus akun, Cloud Function `onUserDeleted` hapus semua subkoleksi `users/{uid}/**` (recursive delete).

---

## 11. Estimasi Biaya & Batasan

**Gratis (Spark Plan) cukup untuk MVP:**
- Firestore: 1GB storage, 50k read / 20k write per hari
- Auth: Unlimited Google
- Hosting: 10GB transfer
- Storage: 5GB

**Estimasi per user aktif:**
- 1 sesi = 1 write `sessions` + 1 update `users` + 1 read `presets` ≈ 3 operasi
- 1000 user × 3 sesi/minggu = 12k write/minggu → masih gratis.

**Batasan:**
- Max 1MB per dokumen (sessions dengan `phases` array panjang bisa mendekati — solusi: jangan simpan `phases` detail jika >100 fase, cukup ringkasan).
- Max 500 writes per batch (untuk import, chunk).

---

## 12. Checklist Implementasi

- [ ] `src/lib/firebase.ts` — init + persistence
- [ ] `firestore.rules` — uid-based
- [ ] `firestore.indexes.json` — index sessions
- [ ] Seed 5 preset bawaan saat user pertama kali
- [ ] `src/lib/export.ts` + `src/lib/import.ts` dengan Zod
- [ ] `functions/src/index.ts` — onSessionCreated untuk XP/streak/badge
- [ ] Test offline: matikan internet, buat sesi, nyalakan lagi → data sync
- [ ] Test import: export di device A, import di device B → history identik
- [ ] Test rules: coba baca `users/{otherUid}` → harus denied

---

*Dokumen ini sinkron dengan `PRD.md:1`. Perubahan schema harus bump `version` dan update `ExportSchema`.*
