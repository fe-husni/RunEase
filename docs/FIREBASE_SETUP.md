# Firebase Setup RunEase — Opsi A (Spark Gratis, Storage Skip, Analytics ON)

> **Untuk pemula — ikuti urutan A → B → C → D → E.** Saat ini `firebase.json` sudah di-set tanpa Storage (Opsi A), `src/lib/firebase.ts` siap baca `.env`.

---

## Fase A — Buat Project (via Browser)

### A1. Buat Project
1. Buka https://console.firebase.google.com → **Add project / Buat project**
2. Nama: `RunEase` → ID jadi `runease-xxxxx` (catat, ini `VITE_FIREBASE_PROJECT_ID`)
3. Analytics: **biarkan Enable** (kamu sudah enable) → pilih akun Analytics default → **Create project** → **Continue**

### A2. Buat Web App & Copy Config
1. Dashboard Project → klik icon **Web `</>`**
2. Nickname: `RunEase Web` → **Register app** (jangan centang Hosting)
3. Pilih **Config** (bukan CDN), copy:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "runease-xxxxx.firebaseapp.com",
     projectId: "runease-xxxxx",
     storageBucket: "runease-xxxxx.appspot.com",
     messagingSenderId: "123...",
     appId: "1:123...:web:abc",
     measurementId: "G-XXXXXXXX"
   };
   ```
4. Simpan di Notepad. Jika terlewat: **Project Settings (gear) → General → Your apps → SDK setup → Config**

---

## Fase B — Aktifkan Produk

### B1. Authentication → Google
1. Console → **Build → Authentication → Get started**
2. **Sign-in method → Add new provider → Google → Enable** → pilih email support → **Save**
3. **Web SDK configuration** (Web client ID/Secret) → **biarkan kosong/default**, jangan diisi manual (auto dari Google Cloud)
4. **Authorized domains** pastikan `localhost` ada

### B2. Firestore Database (asia-southeast1)
1. **Build → Firestore Database → Create database**
2. Location: `asia-southeast1` (Singapore) → **Next**
3. Rules: **Start in test mode** → **Create** (nanti akan di-overwrite oleh `firestore.rules`)
4. Tunggu provisioning selesai

### B3. Storage — SKIP (Opsi A)
- **Jangan buat bucket.** MVP tidak pakai upload (nada via Oscillator `src/lib/audio.ts`). `firebase.json` sudah tanpa Storage.

### B4. Analytics
- Sudah enable di A1, tidak perlu apa-apa. `measurementId` G-... sudah ada di Config A2.

---

## Fase C — Hubungkan Kode Lokal

### C1. Isi `.env`
1. Di WSL, buka `~/dev/RunEase/.env.example` sebagai referensi
2. Edit `~/dev/RunEase/.env` (sekarang masih `demo_key`):
   ```
   VITE_FIREBASE_API_KEY=AIza... (dari A2)
   VITE_FIREBASE_AUTH_DOMAIN=runease-xxxxx.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=runease-xxxxx
   VITE_FIREBASE_STORAGE_BUCKET=runease-xxxxx.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123...
   VITE_FIREBASE_APP_ID=1:123...:web:abc
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX
   VITE_APP_VERSION=1.0.0
   ```
3. Jangan commit `.env` (sudah di `.gitignore`)

### C2. Test Lokal
```bash
export PATH="/home/tux00/.nvm/versions/node/v22.14.0/bin:/usr/local/bin:/usr/bin:/bin"
cd ~/dev/RunEase
npm run dev
# Buka http://localhost:5173 → /login → Login dengan Google → popup harus muncul
# Jika error auth/invalid-api-key → .env belum benar
# Setelah login, TopNav tampil avatar → /timer → STOP ≥60s → /history harus ada sesi
```

---

## Fase D — Deploy Rules & Indexes (Tanpa Storage)

### D1. Install & Login
```bash
npm install -g firebase-tools
firebase login                    # buka browser, login Google yang sama
firebase projects:list            # pastikan runease-xxxxx muncul
```

### D2. Link Project
```bash
cd ~/dev/RunEase
firebase use --add                # pilih runease-xxxxx → alias default
cat .firebaserc                   # harus {"projects":{"default":"runease-xxxxx"}}
```

### D3. Deploy (HANYA Firestore)
```bash
firebase deploy --only firestore:rules    # upload firestore.rules (users/{uid} only)
firebase deploy --only firestore:indexes  # upload firestore.indexes.json (sessions startedAt DESC)
# JANGAN: firebase deploy --only storage (skip Opsi A)
```
Cek di Console → **Firestore → Rules** harus berubah jadi `users/{uid}` only, **Indexes** status `Enabled`.

### D4. Emulator (Opsional, untuk test offline tanpa kuota)
```bash
firebase emulators:start --only auth,firestore,hosting
# UI di http://localhost:4000
```

---

## Fase E — Verifikasi End-to-End
- [ ] `npm run dev` → `/login` Google sukses (bukan invalid-api-key)
- [ ] `/timer` 0:10/0:05 → MULAI → STOP ≥60s → modal +XP → `/history` muncul, heatmap terisi
- [ ] Refresh → sesi tetap ada (Firestore persistence)
- [ ] Console → Firestore → `users/{uid}/sessions/{id}` ada doc
- [ ] Tanpa login (guest) → sesi tetap tersimpan di IndexedDB `runease` → `sessions:guest` → History tampil "Guest mode"
- [ ] Rules test: coba baca `users/{otherUid}` → Denied

---

## Fase F — Hosting (Setelah E OK)
```bash
npm run build
firebase deploy --only hosting   # upload dist/ ke https://runease-xxxxx.web.app
```

---

## Troubleshooting Pemula
- `auth/unauthorized-domain` → Authentication → Settings → Authorized domains → tambah domain
- `Missing or insufficient permissions` → belum deploy rules → `firebase deploy --only firestore:rules`
- Popup blocked → Allow popup atau akan fallback `signInWithRedirect` (`src/stores/userStore.ts`)
- `measurementId` kosong → isi G-... dari Config, jika kosong analytics nonaktif (tidak error)
