# DESIGNSYSTEM — Bauhaus for RunEase

> **Versi:** 1.0  
> **Tanggal:** 5 September 2026  
> **Style:** Bauhaus Constructivist Modernism — "Form Follows Function"  
> **Referensi:** `PRD.md:1`, `DATABASE.md:1`, `STYLEGUIDE.md:1`  
> **Role:** Expert Frontend + UI/UX + Visual + Typography untuk integrasi design system ke codebase

---

## 1. Mental Model — Memahami Sistem Saat Ini

### 1.1 Tech Stack (Greenfield, Direkomendasikan)

**Status repo `~/dev/RunEase` saat ini:** Kosong (no `package.json`). Ini adalah **keuntungan** — kita bisa setup Bauhaus dari hari 0 tanpa legacy constraint.

**Stack yang akan di-setup (sesuai PRD + Bauhaus):**

| Layer | Pilihan | Alasan Bauhaus |
|-------|---------|----------------|
| **Build** | `Vite 5 + React 18 + TypeScript 5` | Cepat, PWA-ready, idiomatic untuk SPA timer yang butuh Worker |
| **Styling** | `Tailwind CSS 3.4 + tailwind-merge + clsx` | Token sentralisasi via `tailwind.config.ts`, hard shadow & border presisi |
| **Komponen** | `shadcn/ui` (Radix primitives) | Headless, mudah override ke Bauhaus (border-4, shadow hard) tanpa battle CSS |
| **Font** | `Outfit 400/500/700/900` via Google Fonts | Geometrik sans, circular forms = Bauhaus |
| **Ikon** | `lucide-react` | Stroke 2px, geometris (Circle/Square/Triangle tersedia) |
| **State** | `Zustand` | Ringan untuk timer store |
| **PWA** | `vite-plugin-pwa` (Workbox) | Manifest + SW untuk background timer |
| **Backend** | `Firebase 10` (Auth/Firestore/Storage) | — |
| **Lint** | `ESLint + Prettier + tailwindcss-class-sort` | Konsistensi kelas Bauhaus |

**Alternatif yang ditolak & alasan:**
- `Next.js` — overkill untuk SPA timer, butuh SSR tidak perlu. Vite lebih ringan untuk PWA.
- `MUI / AntD` — Terlalu opinionated, sulit override ke hard border/shadow Bauhaus. shadcn/ui lebih composable.
- `CSS Modules / Styled-components` — Duplikasi token, tidak sentral. Tailwind sentral di config.

### 1.2 Existing Design Tokens (Saat Ini: Tidak Ada)

Karena greenfield, **kita definisikan token dari nol** di `tailwind.config.ts:1` sebagai single source of truth. Tidak ada legacy CSS yang perlu dimigrasi.

**Prinsip Sentralisasi:**
- Semua warna, shadow, radius, font di `tailwind.config.ts` → `theme.extend`
- Tidak ada hardcode hex di komponen kecuali via token (`bg-bauhaus-red` bukan `bg-[#D02020]` di banyak tempat — tapi untuk MVP, hex eksplisit diperbolehkan untuk kejelasan, lalu refactor ke token).
- Global styles hanya di `src/index.css:1` (reset + font import + base).

### 1.3 Component Architecture Saat Ini

**Akan dibentuk atomik (tapi pragmatis, bukan over-engineered):**

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives yang di-Bauhaus-kan (Button, Card, Input, Badge, Accordion)
│   ├── layout/          # AppShell, TopNav, BottomNav, Section
│   ├── timer/           # TimerDisplay, PhaseBadge, TimerControls, PresetChips, ProgressBar
│   ├── gamification/    # StreakFlame, BadgeCard, LevelBar, ChallengeCard
│   └── geometric/       # DecoCircle, DecoSquare, DecoTriangle, DotGrid, GeometricLogo
├── lib/
│   ├── utils.ts         # cn() helper (clsx + tailwind-merge)
│   ├── firebase.ts
│   ├── audio.ts
│   └── gamification.ts
├── stores/
├── workers/
├── hooks/
└── styles/
    ├── globals.css
    └── bauhaus-tokens.css (opsional, CSS variables untuk non-Tailwind)
```

**Naming Convention:**
- Komponen: `PascalCase` (`TimerDisplay`)
- File: `kebab-case` (`timer-display.tsx`)
- Token: `bauhaus-{red|blue|yellow|black}`
- Varian: `variant="red|blue|yellow|outline|ghost"` + `shape="square|pill"` (binary, bukan 5 radius)

### 1.4 Constraints

- **Bundle size:** Bauhaus banyak border/shadow tapi tidak ada image berat. Keep <300kb gzip. Jangan import semua lucide, tree-shake.
- **Performance:** Timer tick tiap 250ms — komponen TimerDisplay harus `memo` + `tabular-nums` agar tidak reflow.
- **Aksesibilitas:** Kontras AA wajib, semua interactive punya `focus-visible` ring.
- **No legacy:** Tidak ada CSS lama yang perlu di-support.

---

## 2. Tujuan Integrasi — Scope

**Pertanyaan untuk User (sudah dijawab via PRD):**

| Pertanyaan | Jawaban untuk RunEase |
|------------|------------------------|
| Redesign komponen spesifik atau semua baru? | **Semua baru** — greenfield, jadi semua halaman baru langsung Bauhaus. Tidak ada refactor legacy. |
| Halaman prioritas? | **1. Timer** (inti), **2. History/Stats**, **3. Settings**, **4. Landing/Onboarding** |
| Perlu dark mode? | **Tidak di MVP** — Bauhaus light only (`#F0F0F0` canvas). Dark mode V2 sebagai inversi. |
| Seberapa strict Bauhaus? | **Sangat strict** — zero tolerance untuk `rounded-md`, `shadow-md`, gradient. Jika melanggar, CI warning. |

**Scope Implementasi:**
- ✅ Setup token sentral + Tailwind config
- ✅ Build 5 primitives Bauhaus: Button, Card, Input, Badge, Accordion
- ✅ Build 4 layout primitives: Section, Grid, Nav, PageShell
- ✅ Build halaman Timer full Bauhaus (geometri, color blocking, hard shadow)
- ✅ Dokumentasi storybook-lite di `DESIGNSYSTEM.md` ini + contoh kode

---

## 3. Implementation Plan — Langkah Konkret

### Fase A: Token Sentralisasi (Hari 1)

**1. Setup Tailwind + Font**

```bash
npm create vite@latest . -- --template react-ts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install tailwind-merge clsx lucide-react
npx shadcn-ui@latest init
```

**2. `tailwind.config.ts:1` — Single Source of Truth**

```ts
import type { Config } from "tailwindcss";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        bauhaus: {
          red: "#D02020",
          blue: "#1040C0",
          yellow: "#F0C020",
          black: "#121212",
          gray: "#F0F0F0",
          muted: "#E0E0E0",
          white: "#FFFFFF",
        },
        background: "#F0F0F0",
        foreground: "#121212",
        border: "#121212",
      },
      boxShadow: {
        "bauhaus-sm": "3px 3px 0px 0px #121212",
        "bauhaus": "4px 4px 0px 0px #121212",
        "bauhaus-md": "6px 6px 0px 0px #121212",
        "bauhaus-lg": "8px 8px 0px 0px #121212",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

**Kenapa ini?** Semua warna/shadow terpusat. Jika suatu hari ganti `red` ke `#C01010`, cukup 1 tempat. Tidak ada hex scattered.

**3. `src/index.css:1` — Global**

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { @apply border-bauhaus-black; }
  body {
    @apply bg-bauhaus-gray text-bauhaus-black font-outfit antialiased;
    font-feature-settings: "tnum" 1; /* tabular-nums global fallback */
  }
  /* Hormati reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer utilities {
  .text-balance { text-wrap: balance; }
}
```

**4. `src/lib/utils.ts:1` — cn helper**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Fase B: Primitives Bauhaus (Hari 1-2)

**Prinsip:** Override shadcn/ui default yang soft (rounded-md, shadow-sm) menjadi Bauhaus hard. Setiap primitive harus punya `variant` dan `shape` yang eksplisit.

**1. Button — `src/components/ui/button.tsx:1`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-bold uppercase tracking-wider border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  {
    variants: {
      variant: {
        red: "bg-bauhaus-red text-white border-bauhaus-black shadow-bauhaus hover:bg-bauhaus-red/90",
        blue: "bg-bauhaus-blue text-white border-bauhaus-black shadow-bauhaus hover:bg-bauhaus-blue/90",
        yellow: "bg-bauhaus-yellow text-bauhaus-black border-bauhaus-black shadow-bauhaus hover:bg-bauhaus-yellow/90",
        outline: "bg-white text-bauhaus-black border-bauhaus-black shadow-bauhaus hover:bg-bauhaus-gray",
        ghost: "bg-transparent border-transparent shadow-none hover:bg-bauhaus-muted",
      },
      shape: {
        square: "rounded-none",
        pill: "rounded-full",
      },
      size: {
        sm: "px-4 py-2 text-xs",
        default: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base",
        icon: "w-12 h-12 p-0",
      },
    },
    defaultVariants: { variant: "red", shape: "square", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, shape, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, shape, size }), className)} {...props} />
));
Button.displayName = "Button";
```

**Kenapa cva?** Reusability & composability. Tidak ada duplikasi string kelas di tiap halaman. Varian terpusat.

**2. Card — `src/components/ui/card.tsx:1`**

```tsx
export function Card({ className, children, deco = "red", ...props }: { deco?: "red"|"blue"|"yellow" } & React.HTMLAttributes<HTMLDivElement>) {
  const decoColor = { red: "bg-bauhaus-red", blue: "bg-bauhaus-blue", yellow: "bg-bauhaus-yellow" }[deco];
  return (
    <div className={cn("relative bg-white border-4 border-bauhaus-black shadow-bauhaus-lg rounded-none p-6 sm:p-8 hover:-translate-y-1 transition-transform duration-200", className)} {...props}>
      <div className={cn("absolute -top-2 -right-2 w-3 h-3 rounded-full border-2 border-bauhaus-black", decoColor)} />
      {children}
    </div>
  );
}
// Deco: lingkaran/kotak/segitiga kecil di pojok — mandatory Bauhaus, bukan opsional
```

**Kenapa deco wajib?** Non-genericness. Card tanpa deco terlihat seperti Tailwind generik. Deco membuat setiap card adalah komposisi.

**3. Input — `src/components/ui/input.tsx:1`**

```tsx
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("w-full bg-white border-2 border-bauhaus-black rounded-none shadow-bauhaus-sm px-4 py-3 font-medium placeholder:text-bauhaus-black/50 focus:outline-none focus:shadow-bauhaus focus:-translate-x-[1px] focus:-translate-y-[1px] transition-all", className)} {...props} />
));
```

**4. Badge — `src/components/ui/badge.tsx:1`**

```tsx
const badgeVariants = cva("inline-flex items-center border-2 font-bold uppercase tracking-widest text-xs px-3 py-1 rounded-full", {
  variants: {
    variant: { red: "bg-bauhaus-red text-white border-bauhaus-black", blue: "bg-bauhaus-blue text-white border-bauhaus-black", yellow: "bg-bauhaus-yellow text-bauhaus-black border-bauhaus-black", outline: "bg-white text-bauhaus-black border-bauhaus-black" }
  },
  defaultVariants: { variant: "red" }
});
```

**5. Accordion — `src/components/ui/accordion.tsx:1`**

Override Radix Accordion: closed `bg-white border-4 shadow-bauhaus`, open header `bg-bauhaus-red text-white`, content `bg-[#FFF9C4] border-t-4`.

### Fase C: Layout Primitives (Hari 2)

**1. Section — `src/components/layout/section.tsx:1`**

```tsx
export function Section({ color = "gray", children, className, ...props }: { color?: "gray"|"blue"|"yellow"|"red"|"black" } & React.HTMLAttributes<HTMLElement>) {
  const bg = { gray: "bg-bauhaus-gray text-bauhaus-black", blue: "bg-bauhaus-blue text-white", yellow: "bg-bauhaus-yellow text-bauhaus-black", red: "bg-bauhaus-red text-white", black: "bg-bauhaus-black text-white" }[color];
  return <section className={cn("py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-b-4 border-bauhaus-black relative overflow-hidden", bg, className)} {...props}>{children}</section>;
}
```

**Kenapa Section punya color prop?** Color blocking adalah mandatory Bauhaus. Section bukan div generik, tapi blok warna solid.

**2. Geometric Decor — `src/components/geometric/deco.tsx:1`**

```tsx
export function DecoCircle({ className, size=32 }: { className?: string; size?: number }) {
  return <div className={cn("rounded-full bg-bauhaus-red border-2 border-bauhaus-black", className)} style={{ width: size, height: size }} />;
}
export function DecoSquare({ className, size=32, rotate=false }: { className?: string; size?: number; rotate?: boolean }) {
  return <div className={cn("bg-bauhaus-blue border-2 border-bauhaus-black", rotate && "rotate-45", className)} style={{ width: size, height: size }} />;
}
export function DecoTriangle({ className, size=32 }: { className?: string; size?: number }) {
  return <div className={cn("w-0 h-0 border-l-transparent border-r-transparent border-b-bauhaus-yellow", className)} style={{ borderLeftWidth: size/2, borderRightWidth: size/2, borderBottomWidth: size }} />;
}
export function DotGrid({ className }: { className?: string }) {
  return <div className={cn("absolute inset-0 opacity-[0.05] pointer-events-none", className)} style={{ backgroundImage: "radial-gradient(#121212 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }} />;
}
```

**Kenapa komponen terpisah?** Reusability. Pola dot grid dan shapes dipakai di banyak section, jangan copy-paste CSS.

### Fase D: Halaman Timer — Komposisi Bauhaus (Hari 3)

**File:** `src/pages/timer.tsx:1` atau `src/components/timer/timer-display.tsx:1`

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/layout/section";

export function TimerDisplay({ remaining, phase, sets }: { remaining: number; phase: "run"|"walk"; sets: number }) {
  const phaseConfig = {
    run: { label: "LARI", bg: "bg-bauhaus-red text-white", progress: "bg-bauhaus-red" },
    walk: { label: "JALAN", bg: "bg-bauhaus-blue text-white", progress: "bg-bauhaus-blue" },
  }[phase];

  return (
    <Card deco={phase === "run" ? "red" : "blue"} className="min-h-[50vh] flex flex-col items-center justify-center text-center">
      <span className={cn("inline-flex px-4 py-1 border-2 border-bauhaus-black shadow-bauhaus-sm rounded-full font-black uppercase tracking-widest text-xs mb-6", phaseConfig.bg)}>
        {phaseConfig.label}
      </span>
      <h1 className="font-black text-7xl sm:text-8xl tracking-tighter leading-[0.9] tabular-nums">
        {formatTime(remaining)}
      </h1>
      <div className="w-full max-w-sm h-3 bg-white border-2 border-bauhaus-black rounded-none overflow-hidden mt-8">
        <div className={cn("h-full transition-all duration-1000", phaseConfig.progress)} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-4 font-bold uppercase tracking-widest text-xs opacity-60">SET {sets} • BERIKUTNYA: {nextPhase}</p>
    </Card>
  );
}
```

**Kenapa ini Bauhaus?**
- Card putih + border 4px + shadow 8px (bukan shadow soft)
- Badge fase pill + border 2px + shadow 3px
- Angka 7xl/8xl font-black tabular-nums (bukan font-normal)
- Progress bar rounded-none + border 2px
- Tidak ada gradient, tidak ada blur.

---

## 4. Design Token System — DNA Lengkap

### 4.1 Colors (Hanya 6 + Putih)

| Token | Hex | Tailwind | Penggunaan |
|-------|-----|----------|------------|
| `bauhaus.gray` | `#F0F0F0` | `bg-bauhaus-gray` | Canvas |
| `bauhaus.black` | `#121212` | `bg-bauhaus-black` `border-bauhaus-black` `text-bauhaus-black` | Teks, border, shadow |
| `bauhaus.red` | `#D02020` | `bg-bauhaus-red` | LARI, CTA, error, badge |
| `bauhaus.blue` | `#1040C0` | `bg-bauhaus-blue` | JALAN, link, info |
| `bauhaus.yellow` | `#F0C020` | `bg-bauhaus-yellow` | WARMUP, stats, streak |
| `bauhaus.muted` | `#E0E0E0` | `bg-bauhaus-muted` | Divider, disabled |
| `white` | `#FFFFFF` | `bg-white` | Card, input |

**Aturan Kontras (WCAG AA):**
- Merah `#D02020` di atas putih 5.5:1 ✅
- Biru `#1040C0` di atas putih 8.2:1 ✅
- Kuning `#F0C020` → teks hitam (bukan putih) karena kontras kuning-putih 1.2:1 ❌

### 4.2 Typography

**Font:** `Outfit:wght@400;500;700;900` — import sekali di `index.css`, jangan via `<link>` di HTML (FOUC).

**Skala:**
```
Display: text-4xl (mobile) → text-6xl (tablet) → text-8xl (desktop)
H2: text-2xl → text-3xl → text-4xl
Body: text-base → text-lg
Label: text-xs → text-sm uppercase tracking-widest font-bold
Timer: text-7xl → text-8xl font-black tabular-nums tracking-tighter leading-[0.9]
```

**Bobot:**
- Headline: `font-black (900)` + `uppercase` + `tracking-tighter`
- Subheading: `font-bold (700)` + `uppercase`
- Body: `font-medium (500)`
- Label: `font-bold (700)` + `uppercase` + `tracking-widest`

### 4.3 Radius & Border

- **Radius:** Hanya `rounded-none` (0) atau `rounded-full` (9999). **JANGAN** `rounded-md/lg/xl/2xl`.
- **Border Width:** `border-2` (mobile) → `border-4` (desktop, via `sm:border-4`). Nav & section divider `border-b-4`.
- **Border Color:** Selalu `border-bauhaus-black`.

### 4.4 Shadows (Hard Offset, No Blur)

```ts
"bauhaus-sm": "3px 3px 0px 0px #121212"  // button, badge, input
"bauhaus":    "4px 4px 0px 0px #121212"  // button default
"bauhaus-md": "6px 6px 0px 0px #121212"  // card hover
"bauhaus-lg": "8px 8px 0px 0px #121212"  // card utama
```

**Interaksi:** `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` untuk semua button/card yang clickable.

### 4.5 Spacing

Skala 4px: `1,2,3,4,6,8,12,16,24`  
Section: `py-12 px-4 sm:py-16 sm:px-6 lg:py-24 lg:px-8`  
Card: `p-6 sm:p-8`  
Gap: `gap-6 sm:gap-8`

---

## 5. Component Stylings — Referensi Lengkap

### 5.1 Buttons

| Varian | Kelas |
|--------|-------|
| Red | `bg-bauhaus-red text-white border-2 border-bauhaus-black shadow-bauhaus` |
| Blue | `bg-bauhaus-blue text-white border-2 border-bauhaus-black shadow-bauhaus` |
| Yellow | `bg-bauhaus-yellow text-bauhaus-black border-2 border-bauhaus-black shadow-bauhaus` |
| Outline | `bg-white text-bauhaus-black border-2 border-bauhaus-black shadow-bauhaus` |
| Ghost | `bg-transparent border-transparent shadow-none hover:bg-bauhaus-muted` |

Shape: `rounded-none` (default, square) atau `rounded-full` (pill).  
Hover: `hover:bg-{color}/90`  
Active: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`

### 5.2 Cards

- Base: `bg-white border-4 border-bauhaus-black shadow-bauhaus-lg rounded-none`
- Deco: `absolute -top-2 -right-2 w-3 h-3 {bg-color} rounded-full border-2 border-bauhaus-black` atau `rounded-none` untuk square, atau triangle via clip-path.
- Hover: `hover:-translate-y-1`

### 5.3 Accordion

- Closed: `bg-white border-4 border-bauhaus-black shadow-bauhaus rounded-none`
- Open header: `bg-bauhaus-red text-white`
- Content: `bg-[#FFF9C4] text-bauhaus-black border-t-4 border-bauhaus-black`
- Chevron: `rotate-180` saat open, `duration-300`

### 5.4 Input & Toggle

- Input: `bg-white border-2 border-bauhaus-black rounded-none shadow-bauhaus-sm focus:shadow-bauhaus`
- Toggle: `w-12 h-6 bg-white border-2 border-bauhaus-black rounded-full` knob `w-5 h-5 bg-bauhaus-black rounded-full` translate saat checked ke `bg-bauhaus-red` atau `bg-bauhaus-blue`.

---

## 6. Layout & Spacing

- **Container:** `max-w-7xl mx-auto` (landing) atau `max-w-md mx-auto` (app)
- **Section:** Selalu `border-b-4 border-bauhaus-black`. Padding `py-12 sm:py-16 lg:py-24`.
- **Grid:**
  - Stats: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-bauhaus-black border-2 sm:border-4 border-bauhaus-black`
  - Features: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8`
- **Section Colors (Wajib Color Blocking):**
  - Hero right panel: `bg-bauhaus-blue`
  - Stats: `bg-bauhaus-yellow`
  - Benefits: `bg-bauhaus-red`
  - Blog: `bg-bauhaus-blue`
  - Final CTA: `bg-bauhaus-yellow`
  - Footer: `bg-bauhaus-black`

---

## 7. Non-Genericness — Wajib Bauhaus

**Jika tidak ada ini, desain terlihat generik Tailwind:**

1. **Color Blocking Full Section** — bukan aksen kecil.
2. **Geometric Logo** — 3 bentuk (circle/square/triangle) di nav.
3. **Geometric Compositions** — overlapping shapes di hero (circle + rotated square + triangle), di CTA (circle 50% opacity).
4. **Rotated Elements** — tiap elemen ke-3 rotate 45°, step numbers counter-rotate.
5. **Image Treatment** — `grayscale` default, `hover:grayscale-0`, shape `rounded-full` atau `rounded-none`.
6. **Small Deco Shapes** — 8-16px di pojok card, rotasi warna merah/biru/kuning.

**Contoh Hero Kanan (Bauhaus):**
```tsx
<div className="bg-bauhaus-blue border-4 border-bauhaus-black shadow-bauhaus-lg relative overflow-hidden min-h-[400px] flex items-center justify-center">
  <DotGrid />
  <div className="absolute w-48 h-48 rounded-full bg-white/10 border-2 border-white/20" />
  <div className="absolute w-32 h-32 bg-bauhaus-yellow rotate-45 border-4 border-bauhaus-black" />
  <div className="relative w-24 h-24 bg-white border-4 border-bauhaus-black shadow-bauhaus flex items-center justify-center">
    <Triangle className="w-12 h-12 text-bauhaus-red" />
  </div>
</div>
```

---

## 8. Icons & Imagery

- **Library:** `lucide-react` — hanya `Circle, Square, Triangle, Check, Quote, ArrowRight, ChevronDown, Play, Pause, Flame, Award, Clock`
- **Style:** `strokeWidth={2}` (default) atau `2.5` (emphasis), `h-6 w-6` ke `h-8 w-8`.
- **Container:** Selalu di dalam `bg-white border-2 border-bauhaus-black shadow-bauhaus-sm rounded-none w-12 h-12 flex items-center justify-center`

---

## 9. Responsive Strategy

- **Mobile-first:** Default 1 col, expand ke grid di `sm:` / `lg:`.
- **Breakpoints:** `sm:640px, md:768px, lg:1024px`
- **Typography:** `text-4xl sm:text-6xl lg:text-8xl` untuk semua display.
- **Border/Shadow Scaling:** `border-2 sm:border-4` dan `shadow-bauhaus-sm sm:shadow-bauhaus` agar tidak terlalu berat di mobile.
- **Nav:** Hamburger `md:hidden`, full nav `hidden md:flex`.

---

## 10. Animation & Micro-Interactions

- **Feel:** Mekanikal, snappy. `duration-200` atau `duration-300`, `ease-out`.
- **Button:** `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`
- **Card:** `hover:-translate-y-1` / `-translate-y-2`
- **Accordion:** `rotate-180` + `max-height` transition
- **JANGAN:** `transition-all duration-500 ease-in-out` yang soft — tidak Bauhaus.

---

## 11. Checklist Integrasi — Sebelum Merge

- [ ] `tailwind.config.ts` berisi `bauhaus` tokens & `boxShadow` hard?
- [ ] `src/index.css` import Outfit & set `font-outfit`?
- [ ] Tidak ada `rounded-md/lg/xl` di codebase? (`rg "rounded-(md|lg|xl)"` harus 0)
- [ ] Tidak ada `shadow-md/lg` soft? (`rg "shadow-(md|lg|xl)"` harus 0)
- [ ] Tidak ada `bg-gradient`? (`rg "gradient"` harus 0)
- [ ] Semua Button punya `active:translate` + `shadow-none`?
- [ ] Semua Card punya `border-4` + `shadow-bauhaus-lg` + deco?
- [ ] Semua Section punya `border-b-4 border-bauhaus-black`?
- [ ] Timer angka `tabular-nums` + `font-black`?
- [ ] Logo 3 geometri ada di nav?
- [ ] Kontras AA lolos (cek WebAIM)?
- [ ] `prefers-reduced-motion` dihormati?
- [ ] Tap target >=44px di mobile?

---

## 12. Contoh Kontras — Before vs After Bauhaus

**Before (Generik Tailwind):**
```tsx
<button className="bg-blue-500 text-white rounded-lg shadow-md px-4 py-2">Mulai</button>
<div className="bg-white rounded-xl shadow-lg p-6">Card</div>
```

**After (Bauhaus RunEase):**
```tsx
<Button variant="blue" shape="square" size="lg">MULAI LARI</Button>
<Card deco="red" className="hover:-translate-y-1">...</Card>
```

Perbedaan: border hitam tebal, shadow keras tanpa blur, uppercase tracking-wider, square vs pill yang disengaja, deco geometri.

---

## 13. Roadmap Integrasi

| Hari | Tugas | File |
|------|-------|------|
| **Day 1** | Setup Vite + Tailwind + shadcn + Outfit + tokens | `tailwind.config.ts:1`, `src/index.css:1`, `src/lib/utils.ts:1` |
| **Day 1** | Build Button, Badge, Input | `src/components/ui/*:1` |
| **Day 2** | Build Card, Accordion, Section, Geometric primitives | `src/components/ui/card.tsx:1`, `src/components/layout/section.tsx:1`, `src/components/geometric/*:1` |
| **Day 2** | Build Nav (Top + Bottom) + Logo | `src/components/layout/app-shell.tsx:1` |
| **Day 3** | Halaman Timer full composition | `src/pages/timer.tsx:1`, `src/components/timer/*:1` |
| **Day 3** | Halaman History/Stats (heatmap, card) | `src/pages/history.tsx:1` |
| **Day 4** | Settings + Onboarding + Landing hero | `src/pages/settings.tsx:1`, `src/pages/landing.tsx:1` |
| **Day 4** | Polish: dot grid, rotated squares, hover states, a11y | Semua file |
| **Day 5** | Audit checklist + Lighthouse + hapus generic styles | — |

---

## 14. Alasan Arsitektur — Kenapa Begini?

1. **Kenapa Tailwind + cva bukan CSS Modules?** Token sentral di config, varian type-safe via `cva`, tidak ada duplikasi. Bauhaus butuh konsistensi `border-4` + `shadow-bauhaus` — dengan cva, satu perubahan propagasi ke semua button.

2. **Kenapa shadcn/ui bukan MUI?** shadcn adalah copy-paste, bukan dependency. Kita bisa edit `button.tsx` langsung jadi Bauhaus tanpa fight dengan `!important`. MUI butuh theme override yang kompleks dan tetap bawa soft shadow.

3. **Kenapa hard shadow bukan soft?** Bauhaus adalah layering kertas — bayangan keras 4-8px offset tanpa blur. Soft shadow (`0 4px 6px rgba(0,0,0,0.1)`) adalah estetika 2018, bukan 1920s constructivism.

4. **Kenapa hanya rounded-none / rounded-full?** Bauhaus geometri murni: persegi dan lingkaran. `rounded-md` adalah kompromi yang tidak jujur — tidak persegi, tidak lingkaran.

5. **Kenapa Outfit?** Letterforms circular, x-height besar, geometrik — mirip `Futura` yang dipakai Bauhaus asli. Alternatif `Space Grotesk` terlalu quirky, `Inter` terlalu netral.

---

*Dokumen ini adalah blueprint. Saat implementasi, match pola folder & naming yang sudah ada. Jika codebase sudah punya komponen, refactor bertahap — jangan rewrite sekaligus. Prioritaskan Timer page dulu sebagai showcase Bauhaus.*
