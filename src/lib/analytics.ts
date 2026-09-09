import { logEvent as fbLogEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

/**
 * Wrapper aman untuk Firebase Analytics (T-POLISH-004).
 * - No-op jika analytics belum siap / tidak didukung / measurementId kosong.
 * - Tidak pernah throw — aman dipanggil dari hot path timer.
 */
export function track(eventName: string, params?: Record<string, string | number | boolean>): void {
  try {
    if (!analytics) return;
    fbLogEvent(analytics, eventName as never, params as never);
  } catch {
    // ignore — analytics tidak boleh merusak flow utama
  }
}
