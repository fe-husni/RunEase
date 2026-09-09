import { doc, writeBatch, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import localForage from "localforage";
import { ExportSchema, type ExportFile } from "@/lib/schemas";

const localSessions = localForage.createInstance({ name: "runease", storeName: "sessions" });

export type ImportPreview = {
  file: ExportFile;
  counts: { presets: number; sessions: number; badges: number };
};

export function parseAndValidate(text: string): { ok: true; preview: ImportPreview } | { ok: false; error: string } {
  try {
    const json = JSON.parse(text);
    const parsed = ExportSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
    }
    const file = parsed.data;
    return {
      ok: true,
      preview: {
        file,
        counts: {
          presets: file.data.presets.length,
          sessions: file.data.sessions.length,
          badges: file.data.badges.length,
        },
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function writeInBatches(uid: string, file: ExportFile, mode: "merge" | "replace"): Promise<{ added: { presets: number; sessions: number; badges: number }; skipped: { presets: number; sessions: number; badges: number } }> {
  const added = { presets: 0, sessions: 0, badges: 0 };
  const skipped = { presets: 0, sessions: 0, badges: 0 };

  if (mode === "replace") {
    // delete existing (simple: for sessions/badges/presets, we delete via batch)
    // Note: Firestore doesn't have bulk delete, we fetch then delete
    const [sessSnap, badgeSnap, presetSnap] = await Promise.all([
      getDocs(collection(db, `users/${uid}/sessions`)),
      getDocs(collection(db, `users/${uid}/badges`)),
      getDocs(collection(db, `users/${uid}/presets`)),
    ]);
    const batchDel = writeBatch(db);
    sessSnap.docs.forEach((d) => batchDel.delete(d.ref));
    badgeSnap.docs.forEach((d) => batchDel.delete(d.ref));
    presetSnap.docs.forEach((d) => {
      const data = d.data() as { isBuiltIn?: boolean };
      if (!data.isBuiltIn) batchDel.delete(d.ref);
    });
    await batchDel.commit();
    // clear local cache too
    await localSessions.removeItem(`sessions:${uid}`);
  }

  // For merge, we need to check existing IDs to skip duplicates
  const existingIds = { presets: new Set<string>(), sessions: new Set<string>(), badges: new Set<string>() };
  if (mode === "merge") {
    const [sessSnap, badgeSnap, presetSnap] = await Promise.all([
      getDocs(collection(db, `users/${uid}/sessions`)),
      getDocs(collection(db, `users/${uid}/badges`)),
      getDocs(collection(db, `users/${uid}/presets`)),
    ]);
    sessSnap.docs.forEach((d) => existingIds.sessions.add(d.id));
    badgeSnap.docs.forEach((d) => existingIds.badges.add(d.id));
    presetSnap.docs.forEach((d) => existingIds.presets.add(d.id));
    const local = (await localSessions.getItem<unknown[] & { id?: string }[]>(`sessions:${uid}`)) ?? [];
    (local as unknown as { id: string }[]).forEach((s) => existingIds.sessions.add(s.id));
  }

  // helper to chunk writes 400 per batch
  const chunks: { ref: ReturnType<typeof doc>; data: unknown }[][] = [];
  let current: { ref: ReturnType<typeof doc>; data: unknown }[] = [];
  const push = (ref: ReturnType<typeof doc>, data: unknown) => {
    current.push({ ref, data });
    if (current.length >= 400) {
      chunks.push(current);
      current = [];
    }
  };

  for (const p of file.data.presets) {
    const preset = p as { id: string; isBuiltIn?: boolean };
    if (preset.isBuiltIn) {
      skipped.presets++;
      continue;
    }
    if (mode === "merge" && existingIds.presets.has(preset.id)) {
      skipped.presets++;
      continue;
    }
    push(doc(db, `users/${uid}/presets/${preset.id}`), { ...preset, updatedAt: serverTimestamp(), createdAt: serverTimestamp() });
    added.presets++;
  }
  for (const s of file.data.sessions) {
    const sess = s as { id: string };
    if (mode === "merge" && existingIds.sessions.has(sess.id)) {
      skipped.sessions++;
      continue;
    }
    push(doc(db, `users/${uid}/sessions/${sess.id}`), { ...sess, createdAt: serverTimestamp() });
    added.sessions++;
  }
  for (const b of file.data.badges) {
    const badge = b as { id: string };
    if (mode === "merge" && existingIds.badges.has(badge.id)) {
      skipped.badges++;
      continue;
    }
    push(doc(db, `users/${uid}/badges/${badge.id}`), { ...badge, earnedAt: serverTimestamp() });
    added.badges++;
  }

  if (current.length > 0) chunks.push(current);

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(({ ref, data }) => batch.set(ref, data as never, { merge: true }));
    await batch.commit();
  }

  // also write to localForage for sessions
  if (file.data.sessions.length > 0) {
    const key = `sessions:${uid}`;
    const existingLocal = (await localSessions.getItem<unknown[]>(key)) ?? [];
    const toAdd = file.data.sessions.filter((s) => {
      const id = (s as { id: string }).id;
      return mode === "replace" || !existingIds.sessions.has(id);
    });
    await localSessions.setItem(key, [...(existingLocal as unknown[]), ...toAdd].slice(0, 500));
  }

  return { added, skipped };
}

export async function importData(uid: string | null, file: ExportFile, mode: "merge" | "replace"): Promise<{ added: { presets: number; sessions: number; badges: number }; skipped: { presets: number; sessions: number; badges: number } }> {
  if (!uid) {
    // guest: only localForage
    const key = "sessions:guest";
    const existing = (await localSessions.getItem<unknown[]>(key)) ?? [];
    const existingIds = new Set((existing as { id: string }[]).map((s) => s.id));
    let added = 0;
    let skipped = 0;
    const toAdd: unknown[] = [];
    for (const s of file.data.sessions) {
      const id = (s as { id: string }).id;
      if (existingIds.has(id) && mode === "merge") {
        skipped++;
      } else {
        toAdd.push(s);
        added++;
      }
    }
    if (mode === "replace") {
      await localSessions.setItem(key, toAdd);
    } else {
      await localSessions.setItem(key, [...(existing as unknown[]), ...toAdd].slice(0, 500));
    }
    return { added: { presets: 0, sessions: added, badges: 0 }, skipped: { presets: 0, sessions: skipped, badges: 0 } };
  }
  return writeInBatches(uid, file, mode);
}
