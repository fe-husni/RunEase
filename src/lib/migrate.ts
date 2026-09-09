import localForage from "localforage";
import { collection, doc, writeBatch, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const localSessions = localForage.createInstance({ name: "runease", storeName: "sessions" });

export async function migrateGuestToUid(uid: string): Promise<{ migrated: number; skipped: number }> {
  const guestKey = "sessions:guest";
  const targetKey = `sessions:${uid}`;
  const guest = (await localSessions.getItem<unknown[]>(guestKey)) ?? [];
  if (guest.length === 0) return { migrated: 0, skipped: 0 };

  // check existing in Firestore to skip duplicates
  const snap = await getDocs(collection(db, `users/${uid}/sessions`)).catch(() => ({ docs: [] as never[] }));
  const existingIds = new Set((snap as { docs: { id: string }[] }).docs.map((d) => d.id));
  const targetLocal = (await localSessions.getItem<unknown[]>(targetKey)) ?? [];
  (targetLocal as { id: string }[]).forEach((s) => existingIds.add(s.id));

  const toMigrate = (guest as { id: string }[]).filter((s) => !existingIds.has(s.id));
  const skipped = guest.length - toMigrate.length;

  if (toMigrate.length === 0) {
    await localSessions.removeItem(guestKey);
    return { migrated: 0, skipped };
  }

  // write to Firestore in batches 400
  for (let i = 0; i < toMigrate.length; i += 400) {
    const batch = writeBatch(db);
    toMigrate.slice(i, i + 400).forEach((s) => {
      const data = s as Record<string, unknown>;
      batch.set(doc(db, `users/${uid}/sessions/${data.id as string}`), { ...data, migratedAt: serverTimestamp() });
    });
    await batch.commit();
  }

  // also merge to local target
  await localSessions.setItem(targetKey, [...(targetLocal as unknown[]), ...toMigrate].slice(0, 500));
  await localSessions.removeItem(guestKey);

  return { migrated: toMigrate.length, skipped };
}

export async function migrateAnonLocalToUid(uid: string): Promise<{ migrated: number }> {
  // For anon -> Google link case, Firestore data already under same uid, just need to ensure local cache sync
  // Nothing to do for Firestore, but we can ensure localForage anon key cleared if exists
  const anonKey = `sessions:${uid}`;
  const guest = (await localSessions.getItem<unknown[]>("sessions:guest")) ?? [];
  if (guest.length > 0) {
    return migrateGuestToUid(uid);
  }
  // if there is local anon cache separate, keep it (already under uid)
  return { migrated: 0 };
}
