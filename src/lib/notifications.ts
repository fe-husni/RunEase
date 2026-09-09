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
