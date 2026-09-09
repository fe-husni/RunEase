# STYLEGUIDE — RunEase

> **Versi:** 1.0  
> **Tanggal:** 5 September 2026  
> **Design System:** Bauhaus Constructivist (lihat `DESIGNSYSTEM.md:1` untuk token lengkap)  
> **Stack:** Tailwind CSS + shadcn/ui + lucide-react + Outfit

---

## 1. Filosofi

**"Form Follows Function, Celebrated Geometrically"**

RunEase bukan aplikasi lari generik yang soft & gradient. Ini adalah **poster Bauhaus yang hidup** — setiap pixel adalah komposisi geometris yang disengaja. Timer bukan sekadar angka, tapi **blok warna primer yang berteriak**.

- **Jujur:** Tidak ada blur, tidak ada gradient halus. Border hitam tebal, shadow keras, warna solid.
- **Fungsional:** Timer harus terbaca dari 1 meter saat lari. Kontras maksimal, angka tabular.
- **Berani:** Asimetri, overlap, rotasi 45° — tapi tetap terstruktur grid.

---

## 2. Prinsip Desain

1. **Geometri Murni:** Hanya lingkaran (`rounded-full`), persegi (`rounded-none`), segitiga (clip-path). Tidak ada `rounded-md` atau `rounded-lg`.
2. **Color Blocking:** Section full warna primer, bukan aksen kecil. Hero biru, stats kuning, CTA merah.
3. **Hard Shadow, Bukan Soft:** `shadow-[4px_4px_0px_0px_black]` — seperti kertas yang ditumpuk.
4. **Tipografi Ekstrem:** Headline 900 uppercase vs body 500. Kontras ukuran 8xl vs base.
5. **Border adalah Desain:** Border 2-4px hitam adalah elemen visual utama, bukan pemisah halus.
6. **Aksesibilitas dulu:** Kontras AA, tap target 44px, `prefers-reduced-motion` dihormati.

---

## 3. Warna (Hanya Bauhaus Primaries)

**JANGAN tambah warna lain tanpa diskusi.**

| Token | Hex | Penggunaan | Tailwind |
|-------|-----|------------|----------|
| `background` | `#F0F0F0` | Canvas utama | `bg-[#F0F0F0]` |
| `foreground` | `#121212` | Teks utama, border | `text-[#121212]` `border-[#121212]` |
| `primary-red` | `#D02020` | CTA, LARI, badge, section Benefits | `bg-[#D02020]` |
| `primary-blue` | `#1040C0` | JALAN, link, section Hero/Blog | `bg-[#1040C0]` |
| `primary-yellow` | `#F0C020` | WARMUP, stats, highlight, streak | `bg-[#F0C020]` |
| `muted` | `#E0E0E0` | Divider, disabled | `bg-[#E0E0E0]` |
| `white` | `#FFFFFF` | Card, input | `bg-white` |

**Aturan:**
- Teks di atas merah/biru = putih (`text-white`)
- Teks di atas kuning = hitam (`text-black`)
- Jangan pakai opacity warna primer <90% kecuali untuk dekorasi background 10-20% (`bg-[#D02020]/10`)

**Contoh Kombinasi yang Disetujui:**
- Card putih + border hitam + shadow hitam + dekorasi lingkaran merah di pojok
- Section full biru + teks putih + border bawah hitam 4px
- Tombol merah + teks putih + shadow hitam + hover opacity 90%

---

## 4. Tipografi

### 4.1 Font

**Satu-satunya font:** `Outfit` (Google Fonts)  
**Import:** `Outfit:wght@400;500;700;900`  
**File:** `src/index.css:1` atau `tailwind.config.ts:1`

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap');
```

**Fallback:** `Outfit, system-ui, sans-serif`

### 4.2 Skala & Bobot

| Elemen | Kelas | Bobot | Transform | Tracking |
|--------|-------|-------|-----------|----------|
| **Display / Timer** | `text-6xl sm:text-7xl lg:text-8xl` | `font-black (900)` | `uppercase` | `tracking-tighter` `leading-[0.9]` |
| **H1 (Hero)** | `text-4xl sm:text-6xl lg:text-8xl` | `font-black` | `uppercase` | `tracking-tighter` |
| **H2** | `text-2xl sm:text-3xl lg:text-4xl` | `font-black` | `uppercase` | `tracking-tight` |
| **H3** | `text-xl sm:text-2xl` | `font-bold (700)` | `uppercase` | `tracking-wide` |
| **Body** | `text-base sm:text-lg` | `font-medium (500)` | — | `leading-relaxed` |
| **Label / Badge** | `text-xs sm:text-sm` | `font-bold (700)` | `uppercase` | `tracking-widest` |
| **Timer Angka** | `text-7xl sm:text-8xl` | `font-black` | `tabular-nums` | `tracking-tighter` |

**Aturan:**
- Timer angka WAJIB `font-variant-numeric: tabular-nums` agar tidak loncat saat countdown (`tabular-nums` di Tailwind).
- Headline selalu uppercase, body tidak.
- Jangan pakai `font-light` atau `font-thin` — tidak Bauhaus.

### 4.3 Contoh

```tsx
// Timer Display
<h1 className="font-black text-7xl tracking-tighter leading-[0.9] tabular-nums">02:00</h1>
<p className="font-bold text-sm uppercase tracking-widest">LARI</p>

// Hero Headline
<h1 className="font-black text-4xl sm:text-6xl lg:text-8xl uppercase tracking-tighter leading-[0.9]">
  LARI <span className="text-[#D02020]">LEBIH</span> JAUH
</h1>
```

---

## 5. Spacing, Border, Radius, Shadow

### 5.1 Spacing

Gunakan skala 4px: `1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 12 (48px), 16 (64px), 24 (96px)`

- Section padding: `py-12 px-4 sm:py-16 sm:px-6 lg:py-24 lg:px-8`
- Card padding: `p-6 sm:p-8`
- Gap grid: `gap-6 sm:gap-8`

### 5.2 Border

- **Width:** `border-2` (mobile) → `border-4` (desktop, `sm:border-4` atau `lg:border-4`)
- **Major division:** `border-b-4 border-black`
- **Color:** Selalu `border-[#121212]` (hitam). Jangan pakai `border-gray-200`.

### 5.3 Radius

**Hanya dua opsi — tidak ada di antaranya:**

- `rounded-none` (0px) — untuk persegi, card, button square, input
- `rounded-full` (9999px) — untuk lingkaran, pill button, avatar, badge

**JANGAN pakai** `rounded-md`, `rounded-lg`, `rounded-xl`.

### 5.4 Shadow (Hard Offset)

**JANGAN pakai** `shadow-md`, `shadow-lg` (soft blur). Hanya hard offset:

| Nama | Kelas | Penggunaan |
|------|-------|------------|
| Small | `shadow-[3px_3px_0px_0px_black]` `sm:shadow-[4px_4px_0px_0px_black]` | Button, input, badge |
| Medium | `shadow-[6px_6px_0px_0px_black]` | Card hover, modal |
| Large | `shadow-[8px_8px_0px_0px_black]` | Card utama, hero panel |

**Interaksi:**
- Button active: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` (tertekan)
- Card hover: `hover:-translate-y-1` atau `hover:-translate-y-2` + `transition-transform duration-200`

---

## 6. Komponen

### 6.1 Button

**File:** `src/components/ui/button.tsx:1` (shadcn/ui yang di-override Bauhaus)

```tsx
// Varian
<Button variant="red">MULAI LARI</Button>       // bg-[#D02020] text-white border-2 border-black shadow-[4px_...]
<Button variant="blue">JEDA</Button>            // bg-[#1040C0]
<Button variant="yellow">LANJUT</Button>        // bg-[#F0C020] text-black
<Button variant="outline">BATAL</Button>        // bg-white text-black
<Button variant="ghost">Lewati</Button>         // border-none

// Bentuk
<Button shape="square"> // rounded-none (default)
<Button shape="pill">   // rounded-full

// Ukuran
<Button size="sm"> // px-4 py-2 text-xs
<Button size="default"> // px-6 py-3 text-sm
<Button size="lg"> // px-8 py-4 text-base
<Button size="icon"> // w-12 h-12
```

**Kelas Wajib Button Primer:**
```
bg-[#D02020] text-white border-2 border-black 
shadow-[4px_4px_0px_0px_black] 
rounded-none 
font-bold uppercase tracking-wider 
hover:bg-[#D02020]/90 
active:translate-x-[2px] active:translate-y-[2px] active:shadow-none 
transition-all duration-200
```

### 6.2 Card

**File:** `src/components/ui/card.tsx:1`

```tsx
<Card> // bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] rounded-none p-6 relative
  <div className="absolute top-0 right-0 w-3 h-3 bg-[#D02020] rounded-full -mt-1 -mr-1" /> {/* dekorasi */}
  <CardTitle className="font-black uppercase tracking-tight">Seimbang 2:1</CardTitle>
  <CardContent className="font-medium leading-relaxed">2 menit lari, 1 menit jalan</CardContent>
</Card>
```

**Varian:**
- `Card` default: putih + border hitam + shadow besar
- `Card` colored: `bg-[#F0C020] border-4 border-black` untuk stats
- Dekorasi: lingkaran/kotak/segitiga 8-12px di pojok kanan atas, warna rotasi merah/biru/kuning

### 6.3 Input & Select

```tsx
<Input className="bg-white border-2 border-black rounded-none shadow-[3px_3px_0px_0px_black] focus:shadow-[4px_4px_0px_0px_black] focus:translate-x-[-1px] focus:translate-y-[-1px] font-medium" />
<Select> // trigger sama seperti Input, content: bg-white border-2 border-black shadow-[4px_...] rounded-none
```

**Timer Input Khusus:**
- Dua input `mm` dan `ss` dengan `:` di tengah, font `text-4xl font-black tabular-nums` inside.

### 6.4 Badge & Chip

```tsx
<Badge variant="red"> // bg-[#D02020] text-white border-2 border-black rounded-full px-3 py-1 font-bold uppercase tracking-widest text-xs
<Badge variant="yellow"> // bg-[#F0C020] text-black
<PresetChip active={true}> // bg-[#1040C0] text-white border-2 border-black shadow-[3px_...] rounded-full vs inactive: bg-white
```

### 6.5 Progress & Timer

```tsx
// Progress bar fase
<div className="h-3 bg-white border-2 border-black rounded-none overflow-hidden">
  <div className="h-full bg-[#D02020] transition-all duration-1000" style={{ width: `${percent}%` }} />
</div>

// Timer Circle (opsional)
<div className="w-64 h-64 rounded-full border-4 border-black bg-white shadow-[8px_8px_0px_0px_black] flex items-center justify-center relative">
  <div className="absolute inset-2 rounded-full border-2 border-black/10" />
  <span className="font-black text-7xl tabular-nums">02:00</span>
</div>
```

### 6.6 Accordion (FAQ)

- Closed: `bg-white border-4 border-black shadow-[4px_...] rounded-none`
- Open header: `bg-[#D02020] text-white`
- Content: `bg-[#FFF9C4] text-black border-t-4 border-black`
- Icon: `ChevronDown` rotate-180 saat open

---

## 7. Layout & Grid

### 7.1 Container

- **Max width:** `max-w-7xl mx-auto` untuk landing, `max-w-md mx-auto` untuk app (timer/history)
- **Padding:** `px-4 sm:px-6 lg:px-8`

### 7.2 Section

Setiap section WAJIB `border-b-4 border-black` untuk ritme horizontal poster:

```tsx
<section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-b-4 border-black bg-[#F0F0F0]">
<section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-b-4 border-black bg-[#1040C0] text-white">
<section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-b-4 border-black bg-[#F0C020]">
```

### 7.3 Grid

| Konteks | Mobile | Tablet | Desktop | Kelas |
|---------|--------|--------|---------|-------|
| Stats | 1 col | 2 col | 4 col | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black border-2 sm:border-4 border-black` |
| Features | 1 col | 2 col | 3 col | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8` |
| Pricing/Preset | 1 col | 1 col | 3 col | `grid grid-cols-1 lg:grid-cols-3 gap-6` |
| Timer Controls | 2 col | 3 col | 3 col | `grid grid-cols-2 sm:grid-cols-3 gap-4` |

---

## 8. Ikon & Imagery

### 8.1 Ikon

- **Library:** `lucide-react` only
- **Yang diizinkan:** `Circle`, `Square`, `Triangle`, `Play`, `Pause`, `SkipForward`, `Square` (stop), `Award`, `Flame`, `Clock`, `Settings`, `ChevronDown`, `Check`, `Plus`, `X`
- **Style:** `strokeWidth={2}` default, `2.5` untuk emphasis. Ukuran `h-6 w-6` atau `h-8 w-8`.
- **Container:** Ikon di dalam kotak/bulat bordered:
  ```tsx
  <div className="w-12 h-12 bg-white border-2 border-black shadow-[3px_3px_0px_0px_black] rounded-none flex items-center justify-center">
    <Play className="w-6 h-6" />
  </div>
  ```

### 8.2 Logo Geometris

**Wajib di Nav:** Tiga bentuk primer:

```tsx
<div className="flex items-center gap-1">
  <div className="w-3 h-3 rounded-full bg-[#D02020] border border-black" />
  <div className="w-3 h-3 bg-[#1040C0] border border-black" />
  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-[#F0C020] drop-shadow-[0_1px_0_black]" />
  <span className="ml-2 font-black uppercase tracking-tighter text-xl">RunEase</span>
</div>
```

### 8.3 Gambar

- **Filter:** `grayscale` default, `hover:grayscale-0` + `transition-all duration-300`
- **Shape:** `rounded-full` atau `rounded-none` — jangan `rounded-lg`
- **Border:** `border-4 border-black` untuk foto testimoni/avatar

---

## 9. Navigasi

### 9.1 Top Nav (Landing)

```tsx
<nav className="sticky top-0 z-50 bg-[#F0F0F0] border-b-4 border-black px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
  <Logo />
  <div className="hidden md:flex gap-6 font-bold uppercase tracking-wider text-sm">
    <a className="hover:text-[#D02020] transition-colors">Timer</a>
    <a className="hover:text-[#D02020]">Riwayat</a>
  </div>
  <Button variant="red" shape="pill" className="hidden md:flex">MULAI</Button>
  <button className="md:hidden w-10 h-10 bg-white border-2 border-black shadow-[3px_3px_0px_0px_black] rounded-none flex items-center justify-center">
    <Menu className="w-5 h-5" />
  </button>
</nav>
```

### 9.2 Bottom Nav (App Mobile)

```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black flex justify-around py-2 sm:hidden">
  <NavItem icon={Clock} label="TIMER" active />
  <NavItem icon={History} label="RIWAYAT" />
  <NavItem icon={BarChart} label="STAT" />
  <NavItem icon={Settings} label="ATUR" />
</nav>
// NavItem active: bg-[#121212] text-white border-2 border-black rounded-full
```

---

## 10. Animasi & Micro-interaction

**Feel:** Mekanikal, snap, bukan organic.

| Interaksi | Kelas | Durasi |
|-----------|-------|--------|
| Button press | `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` | `duration-200` |
| Card hover | `hover:-translate-y-1` | `duration-200 ease-out` |
| Accordion open | `rotate-180` pada Chevron | `duration-300` |
| Page transition | `ease-out` | `duration-200` |
| Background pattern | `static` (jangan animasikan) | — |

**Hormati `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

---

## 11. Pola Dekoratif

Gunakan untuk mengisi ruang kosong agar tidak generik:

1. **Dot Grid (di section terang):**
   ```css
   background-image: radial-gradient(#121212 1.5px, transparent 1.5px);
   background-size: 20px 20px;
   opacity: 0.05;
   ```

2. **Geometric Shapes Background (di section warna):**
   ```tsx
   <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10 border-2 border-white/20" />
   <div className="absolute bottom-10 left-10 w-24 h-24 bg-[#F0C020]/20 rotate-45 border-2 border-black/10" />
   ```

3. **Rotated Square:** Tiap elemen ke-3 di grid, rotate 45° untuk aksen Bauhaus.

---

## 12. Page-Specific Guidance

### 12.1 Halaman Timer (Paling Penting)

```
[Top Bar: Preset Chips horizontal scroll, bg-white border-b-4 border-black]
[Main: Timer Display — full width, bg-white border-4 border-black shadow-[8px_...] rounded-none, centered, min-h-[50vh]]
  - Angka 02:00 font-black 7xl tabular-nums
  - Label LARI/JALAN pill badge di atas angka (bg-red/blue + border-2 + shadow)
  - Progress bar di bawah angka
  - Next phase preview kecil di bawah progress
[Controls: 3 tombol besar — PAUSE (kuning), SKIP (outline), STOP (merah), grid 3 col, gap-4]
[Stats ringkas: Set 3/10 | Total 12:34, font-bold uppercase tracking-widest text-xs]
```

**Warna Fase:**
- Run: `bg-[#D02020] text-white` untuk label, progress `bg-[#D02020]`
- Walk: `bg-[#1040C0] text-white`
- Warmup/Cooldown: `bg-[#F0C020] text-black`

### 12.2 History & Stats

- Heatmap: grid 7xN, kotak `w-3 h-3 rounded-none border border-black` — intensitas via opacity kuning/merah.
- Card history: `bg-white border-2 border-black shadow-[4px_...] rounded-none p-4` + dekorasi lingkaran kecil di pojok.

### 12.3 Settings

- Section `border-b-4 border-black` per grup (Suara, Getar, Data).
- Toggle: custom Bauhaus toggle — `w-12 h-6 bg-white border-2 border-black rounded-full` dengan knob `w-5 h-5 bg-[#121212] rounded-full` yang slide.

---

## 13. Aksesibilitas

- **Kontras:** Semua kombinasi warna di atas sudah AA (cek via WebAIM). Merah `#D02020` di atas putih 5.5:1, biru `#1040C0` di atas putih 8.2:1.
- **Focus:** `focus-visible:ring-2 focus-visible:ring-[#1040C0] focus-visible:ring-offset-2 focus-visible:ring-offset-white`
- **Tap Target:** Minimal `44x44px` untuk semua button/nav item.
- **Aria:** Timer `aria-live="polite"` untuk screen reader, `aria-label="Sisa waktu lari 2 menit"` .
- **Keyboard:** Semua kontrol bisa via Space (pause), S (skip), Esc (stop).

---

## 14. Do & Don't

| Do | Don't |
|----|-------|
| Pakai `border-4 border-black` + `shadow-[8px_...]` | Jangan pakai `shadow-lg blur` |
| Pakai `rounded-none` atau `rounded-full` | Jangan pakai `rounded-md/lg` |
| Pakai `font-black uppercase tracking-tighter` | Jangan pakai `font-light` |
| Pakai `bg-[#D02020]` solid | Jangan pakai `bg-gradient-to-r` |
| Pakai `Outfit` | Jangan pakai `Poppins` atau `Inter` |
| Hover `translate-y` 1-2px | Jangan pakai `scale-105` besar |
| Ikon di dalam bordered box | Jangan pakai ikon tanpa container |

---

## 15. Implementasi Tailwind

**File:** `tailwind.config.ts:1`

```ts
import type { Config } from "tailwindcss";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { outfit: ["Outfit", "system-ui", "sans-serif"] },
      colors: {
        bauhaus: {
          red: "#D02020",
          blue: "#1040C0",
          yellow: "#F0C020",
          black: "#121212",
          gray: "#F0F0F0",
          muted: "#E0E0E0",
        }
      },
      boxShadow: {
        "bauhaus-sm": "3px 3px 0px 0px #121212",
        "bauhaus": "4px 4px 0px 0px #121212",
        "bauhaus-md": "6px 6px 0px 0px #121212",
        "bauhaus-lg": "8px 8px 0px 0px #121212",
      }
    }
  }
} satisfies Config;
```

**File:** `src/index.css:1`

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-[#F0F0F0] text-[#121212] font-outfit antialiased; }
  * { @apply border-[#121212]; }
}
```

---

## 16. Checklist Review

Sebelum merge, cek:

- [ ] Tidak ada `rounded-md/lg/xl` tersisa?
- [ ] Semua card punya `border-black` + `shadow-bauhaus`?
- [ ] Semua headline `font-black uppercase tracking-tighter`?
- [ ] Timer angka `tabular-nums`?
- [ ] Button punya `active:translate + shadow-none`?
- [ ] Section punya `border-b-4 border-black`?
- [ ] Logo geometris 3 bentuk ada di nav?
- [ ] Kontras teks di atas warna primer terbaca?
- [ ] `prefers-reduced-motion` dihormati?
- [ ] Tap target >=44px di mobile?

---

*Styleguide ini adalah turunan dari `DESIGNSYSTEM.md:1`. Jika ada konflik, DESIGNSYSTEM.md menang untuk token, STYLEGUIDE.md menang untuk konteks RunEase.*
