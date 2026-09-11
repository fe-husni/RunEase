# Contributing — RunEase

## Alur Kerja

1. Branch dari `main`: `feat/...`, `fix/...`, atau `ci/...`
2. Buka Pull Request ke `main` — CI otomatis: `verify` (tsc + eslint + build) + deploy
   **preview channel 7 hari** dengan URL di comment bot. Review di URL itu.
3. Merge ke `main` → deploy **live** otomatis ke `runease-dda50.web.app`.
4. Jangan push langsung ke `main` untuk perubahan besar; perubahan kecil (typo) boleh.

## Perintah

```bash
npm install
npm run dev
npm run build
npm run lint        # harus 0 warning
npx tsc --noEmit
```

## Aturan Keras Bauhaus

Sebelum PR merge, wajib lolos (lihat `DESIGNSYSTEM.md:11`):

- Tidak ada `rounded-md/lg/xl` — hanya `rounded-none` / `rounded-full`
- Tidak ada `shadow-md/lg` / gradient — hanya `shadow-bauhaus*` (hard shadow 3–8px)
- Angka timer pakai `tabular-nums`
- Cek cepat: `rg "rounded-(md|lg|xl)" src` dan `rg "gradient" src` harus 0

## Aturan Timer

- **Dilarang `setInterval` di main thread / component** — semua detak via
  `src/workers/timer.worker.ts` + `src/hooks/useTimerWorker.ts`. Ketemu pelanggaran = bug.
- Store Zustand hanya pure state, tanpa efek browser.
- Perubahan skema Firestore/Export → bump `version` dan update `src/lib/schemas.ts` + docs.

## Secrets

Jangan commit `.env`. Untuk fitur yang butuh env baru: tambah ke `.env.example`,
ke `.github/workflows/ci.yml` (blok `env:` build prod + preview), dan ke daftar
secrets di `README.md`.
