import type { Phase } from "@/types/timer";

export type NotifyPermission = NotificationPermission | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotifyPermission {
  if (!isNotificationSupported()) return "unsupported";
  try {
    return Notification.permission;
  } catch {
    return "unsupported";
  }
}

/**
 * Minta izin notifikasi jika masih "default".
 * Wajib dipanggil dari user gesture (tap tombol) agar prompt muncul.
 * Return true hanya jika izin granted. Tidak pernah throw.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const res = await Notification.requestPermission();
    return res === "granted";
  } catch {
    return false;
  }
}

const phaseCopy: Record<Exclude<Phase, "idle">, { title: string; body: string }> = {
  warmup: { title: "RunEase — PEMANASAN", body: "Mulai pemanasan, jalan santai dulu." },
  run: { title: "RunEase — LARI!", body: "Ganti ke LARI sekarang." },
  walk: { title: "RunEase — JALAN", body: "Ganti ke JALAN, atur napas." },
  cooldown: { title: "RunEase — PENDINGINAN", body: "Sesi hampir selesai, pendinginan." },
};

const vibratePatternFor: Record<Exclude<Phase, "idle">, number[]> = {
  run: [400, 100, 400],
  walk: [200, 100, 200, 100, 200],
  warmup: [600],
  cooldown: [600],
};

/**
 * Fallback visual saat audio berpotensi diblokir (tab background / layar kunci).
 * `silent: true` karena alarm suara sudah dibunyikan terpisah — notifikasi hanya visual.
 * Pakai `tag` sama agar notifikasi lama tertimpa, tidak menumpuk.
 * Return true jika notifikasi berhasil ditampilkan. Tidak pernah throw.
 */
export function sendPhaseNotification(phase: Phase): boolean {
  if (phase === "idle") return false;
  if (!isNotificationSupported()) return false;
  try {
    if (Notification.permission !== "granted") return false;
    const copy = phaseCopy[phase];
    new Notification(copy.title, {
      body: copy.body,
      tag: "runease-phase",
      requireInteraction: true,
      silent: true,
      icon: "/icon-192.png",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Jalur utama saat layar terkunci: tampilkan via ServiceWorkerRegistration.showNotification().
 * - `navigator.vibrate()` diabaikan browser saat document.hidden / screen off, sedangkan
 *   `showNotification({ vibrate })` dirender oleh OS sehingga bisa getar + tampil di lockscreen.
 * - `silent:false` + vibrate agar ada bunyi/getar sistem walau audio Web dibekukan.
 * - Fallback ke `sendPhaseNotification` bila SW tidak tersedia (desktop / iOS).
 * Tidak pernah throw.
 */
export async function notifyViaSW(phase: Exclude<Phase, "idle">, vibrateEnabled: boolean): Promise<boolean> {
  const copy = phaseCopy[phase];
  const vibrate = vibrateEnabled ? vibratePatternFor[phase] : undefined;
  try {
    if (!isNotificationSupported()) return false;
    if (Notification.permission !== "granted") return false;
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        // `vibrate` didukung di Chrome Android walau belum ada di TS DOM lib → cast via tipe lokal
        const options = {
          body: copy.body,
          tag: "runease-phase",
          requireInteraction: true,
          silent: false,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          vibrate,
          data: { url: "/timer", phase },
        } as NotificationOptions & { vibrate?: number[]; badge?: string };
        await reg.showNotification(copy.title, options);
        return true;
      } catch {
        // SW belum ready (mis. dev tanpa PWA) → fallback page-context
      }
    }
  } catch {
    // ignore
  }
  return sendPhaseNotification(phase);
}
