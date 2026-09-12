import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, limit, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import localForage from "localforage";
import type { SessionDoc, SessionStatus } from "@/types/session";
import type { TimerConfig } from "@/types/timer";
import { calcXP } from "@/lib/gamification";

// localForage instance for guest / offline fallback
const localSessions = localForage.createInstance({ name: "runease", storeName: "sessions" });

function localKey(uid: string | null): string {
  return `sessions:${uid ?? "guest"}`;
}

export async function saveSession(params: {
  uid: string | null;
  config: TimerConfig;
  presetId: string | null;
  presetName: string;
  startedAtMs: number;
  durationSec: number;
  setsCompleted: number;
  status: SessionStatus;
}): Promise<SessionDoc> {
  const { uid, config, presetId, presetName, startedAtMs, durationSec, setsCompleted, status } = params;

  // abandoned if <60s
  const finalStatus: SessionStatus = durationSec < 60 ? "abandoned" : status;
  const xpEarned = calcXP(durationSec, config.runSec, config.walkSec, setsCompleted);

  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = Timestamp.fromMillis(startedAtMs);
  const endedAt = Timestamp.fromMillis(startedAtMs + durationSec * 1000);

  const docData: SessionDoc = {
    id,
    presetId,
    presetSnapshot: {
      name: presetName,
      runSec: config.runSec,
      walkSec: config.walkSec,
      warmupSec: config.warmupSec,
      cooldownSec: config.cooldownSec,
    },
    status: finalStatus,
    startedAt,
    endedAt,
    durationSec,
    setsCompleted,
    xpEarned,
    createdAt: serverTimestamp() as unknown as Timestamp,
  };

  if (finalStatus === "abandoned") {
    // don't persist abandoned (<60s) — per PRD, but we still return for UI
    return docData;
  }

  if (uid) {
    // Firestore (works for anon uid too, via persistence)
    try {
      const ref = doc(db, `users/${uid}/sessions/${id}`);
      await setDoc(ref, { ...docData, createdAt: serverTimestamp() });
      // also update local cache for instant history
      const key = localKey(uid);
      const existing = (await localSessions.getItem<SessionDoc[]>(key)) ?? [];
      await localSessions.setItem(key, [docData, ...existing].slice(0, 200));
      return docData;
    } catch (e) {
      // fallback to localForage if offline / permission error
      console.warn("[session] Firestore save failed, fallback local", e);
    }
  }

  // Guest or offline fallback
  const key = localKey(uid);
  const existing = (await localSessions.getItem<SessionDoc[]>(key)) ?? [];
  // convert Timestamps to plain for localForage? keep as is, but ensure serializable
  await localSessions.setItem(key, [docData, ...existing].slice(0, 200));
  return docData;
}

export async function fetchSessions(uid: string | null, max = 50): Promise<SessionDoc[]> {
  if (uid) {
    try {
      const q = query(collection(db, `users/${uid}/sessions`), orderBy("startedAt", "desc"), limit(max));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => d.data() as SessionDoc);
      // sinkronkan cache lokal dengan cloud (termasuk kasus kosong setelah hapus —
      // jangan kembalikan cache basi agar data terhapus tidak resurrect).
      await localSessions.setItem(localKey(uid), docs);
      return docs;
    } catch (e) {
      console.warn("[session] fetch Firestore failed, fallback local", e);
      const cached = (await localSessions.getItem<SessionDoc[]>(localKey(uid))) ?? [];
      return cached.slice(0, max);
    }
  }
  // guest
  const cached = (await localSessions.getItem<SessionDoc[]>(localKey(null))) ?? [];
  // sort by startedAt desc (handle Timestamp or plain)
  return cached
    .slice()
    .sort((a, b) => {
      const ta = a.startedAt && typeof (a.startedAt as unknown as { toMillis?: () => number }).toMillis === "function" ? (a.startedAt as Timestamp).toMillis() : (a.startedAt as unknown as { seconds: number }).seconds * 1000;
      const tb = b.startedAt && typeof (b.startedAt as unknown as { toMillis?: () => number }).toMillis === "function" ? (b.startedAt as Timestamp).toMillis() : (b.startedAt as unknown as { seconds: number }).seconds * 1000;
      return tb - ta;
    })
    .slice(0, max);
}

export async function deleteSession(uid: string | null, sessionId: string): Promise<void> {
  if (uid) {
    try {
      await deleteDoc(doc(db, `users/${uid}/sessions/${sessionId}`));
    } catch (e) {
      console.warn("[session] delete Firestore failed", e);
    }
    // also delete from local cache
    const key = localKey(uid);
    const existing = (await localSessions.getItem<SessionDoc[]>(key)) ?? [];
    await localSessions.setItem(
      key,
      existing.filter((s) => s.id !== sessionId)
    );
    return;
  }
  const key = localKey(null);
  const existing = (await localSessions.getItem<SessionDoc[]>(key)) ?? [];
  await localSessions.setItem(
    key,
    existing.filter((s) => s.id !== sessionId)
  );
}

/**
 * Hapus SEMUA sesi (riwayat) saja — preset custom, badge, dan progres
 * XP/level/streak dibiarkan utuh. Dipakai tombol "Hapus Semua" di halaman
 * Riwayat. Untuk reset penuh (termasuk preset) pakai deleteAllData().
 */
export async function deleteAllSessions(uid: string | null): Promise<number> {
  if (uid) {
    const snap = await getDocs(collection(db, `users/${uid}/sessions`));
    const refs = snap.docs.map((d) => d.ref);
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db);
      refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
    await Promise.all([
      localSessions.removeItem(localKey(uid)),
      localSessions.removeItem(localKey(null)),
      localSessions.removeItem("sessions:anon"),
    ]);
    return refs.length;
  }
  await Promise.all([
    localSessions.removeItem(localKey(null)),
    localSessions.removeItem("sessions:anon"),
  ]);
  return 0;
}

// helper to normalize Timestamp to millis for grouping
export function toMillis(ts: Timestamp | unknown): number {
  if (!ts) return 0;
  if (typeof (ts as Timestamp).toMillis === "function") return (ts as Timestamp).toMillis();
  const plain = ts as { seconds: number; nanoseconds?: number };
  if (typeof plain.seconds === "number") return plain.seconds * 1000 + Math.floor((plain.nanoseconds ?? 0) / 1e6);
  if (typeof ts === "number") return ts;
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

export function formatDateKey(millis: number): string {
  const d = new Date(millis);
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
