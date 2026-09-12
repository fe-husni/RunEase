import type { Phase } from "@/types/timer";

/**
 * Jalur native opsional (pilihan user: wrapper Capacitor untuk getar + notifikasi
 * yang andal saat layar mati total).
 *
 * Cara pakai (belum di-bundle agar Web tetap ringan):
 *   npm i @capacitor/core @capacitor/haptics @capacitor/local-notifications
 *   npx cap init RunEase com.runease.app --web-dir=dist
 *   npx cap add android
 * Lalu panggil `notifyNative(phase)` berdampingan dengan `notifyViaSW`.
 *
 * Semua import di sini dinamis + try/catch sehingga aman dipanggil di Web murni
 * (tanpa Capacitor terinstal → return false, fallback Web tetap jalan).
 */

const nativePatterns: Record<string, number[]> = {
  run: [400, 100, 400],
  walk: [200, 100, 200, 100, 200],
  warmup: [600],
  cooldown: [600],
};

export async function vibrateNative(phase: Phase): Promise<boolean> {
  if (phase === "idle") return false;
  try {
    // nama paket via variabel agar TS tidak mewajibkan @capacitor/* terinstal di Web murni
    const pkg: string = "@capacitor/haptics";
    const mod = (await import(/* @vite-ignore */ pkg).catch(() => null)) as {
      Haptics?: { vibrate: (opts: { duration: number }) => Promise<void> };
    } | null;
    if (!mod?.Haptics) return false;
    const pattern = nativePatterns[phase] ?? [200];
    // Haptics.vibrate() sekali; untuk pola panjang ulangi dengan jeda
    for (let i = 0; i < pattern.length; i += 2) {
      await mod.Haptics.vibrate({ duration: Math.min(1000, pattern[i]) });
      const gap = pattern[i + 1];
      if (gap) await new Promise((r) => setTimeout(r, Math.min(500, gap)));
    }
    return true;
  } catch {
    return false;
  }
}

const titles: Record<Exclude<Phase, "idle">, string> = {
  warmup: "RunEase — PEMANASAN",
  run: "RunEase — LARI!",
  walk: "RunEase — JALAN",
  cooldown: "RunEase — PENDINGINAN",
};

export async function notifyNative(phase: Phase): Promise<boolean> {
  if (phase === "idle") return false;
  try {
    const pkg: string = "@capacitor/local-notifications";
    const mod = (await import(/* @vite-ignore */ pkg).catch(() => null)) as {
      LocalNotifications?: { schedule: (opts: unknown) => Promise<void> };
    } | null;
    if (!mod?.LocalNotifications) return false;
    await mod.LocalNotifications.schedule({
      notifications: [
        {
          title: titles[phase],
          body: phase === "run" ? "Ganti ke LARI sekarang." : phase === "walk" ? "Ganti ke JALAN." : "Ganti fase sekarang.",
          id: 1001,
          ongoing: false,
          autoCancel: true,
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}
