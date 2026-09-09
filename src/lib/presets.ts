import { collection, doc, setDoc, deleteDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import localForage from "localforage";
import type { PresetDoc } from "@/types/preset";

export const MAX_CUSTOM_PRESETS = 10;
export const MAX_PRESET_NAME = 24;

export interface PresetInput {
  name: string;
  runSec: number;
  walkSec: number;
  warmupSec?: number;
  cooldownSec?: number;
  soundId?: string;
  icon?: PresetDoc["icon"];
  color?: PresetDoc["color"];
}

const localPresets = localForage.createInstance({ name: "runease", storeName: "presets" });

function localKey(uid: string | null): string {
  return `presets:${uid ?? "guest"}`;
}

function isBuiltInId(id: string): boolean {
  return id.startsWith("builtin_");
}

/** Validasi input. Return pesan error (Indonesia) atau null jika valid. */
export function validatePresetInput(input: PresetInput, existingCustomCount: number): string | null {
  const name = input.name.trim();
  if (!name) return "Nama preset wajib diisi.";
  if (name.length > MAX_PRESET_NAME) return `Nama maksimal ${MAX_PRESET_NAME} karakter.`;
  if (!Number.isInteger(input.runSec) || input.runSec < 10 || input.runSec > 600) {
    return "Durasi lari 10–600 detik.";
  }
  if (!Number.isInteger(input.walkSec) || input.walkSec < 10 || input.walkSec > 600) {
    return "Durasi jalan 10–600 detik.";
  }
  const warm = input.warmupSec ?? 0;
  const cool = input.cooldownSec ?? 0;
  if (!Number.isInteger(warm) || warm < 0 || warm > 600) return "Warmup 0–600 detik.";
  if (!Number.isInteger(cool) || cool < 0 || cool > 600) return "Cooldown 0–600 detik.";
  if (existingCustomCount >= MAX_CUSTOM_PRESETS) {
    return `Maksimal ${MAX_CUSTOM_PRESETS} preset custom. Hapus salah satu dulu.`;
  }
  return null;
}

function buildDoc(input: PresetInput): PresetDoc {
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    runSec: input.runSec,
    walkSec: input.walkSec,
    warmupSec: input.warmupSec ?? 0,
    cooldownSec: input.cooldownSec ?? 0,
    mode: "infinite",
    soundId: input.soundId ?? "beep",
    icon: input.icon ?? "square",
    color: input.color ?? "blue",
    isBuiltIn: false,
    createdAt: serverTimestamp() as unknown,
    updatedAt: serverTimestamp() as unknown,
  };
}

async function migrateGuestToCloud(uid: string, cloudIds: Set<string>): Promise<PresetDoc[]> {
  const guest = (await localPresets.getItem<PresetDoc[]>(localKey(null))) ?? [];
  if (guest.length === 0) return [];
  const migrated: PresetDoc[] = [];
  for (const p of guest) {
    if (p.isBuiltIn || isBuiltInId(p.id)) continue;
    if (cloudIds.has(p.id)) continue;
    if (migrated.length + cloudIds.size >= MAX_CUSTOM_PRESETS) break;
    const cleaned: PresetDoc = { ...p, isBuiltIn: false, updatedAt: serverTimestamp() as unknown };
    try {
      await setDoc(doc(db, `users/${uid}/presets/${p.id}`), cleaned);
      migrated.push(cleaned);
    } catch (e) {
      console.warn("[presets] migrate item failed", e);
    }
  }
  if (migrated.length > 0) {
    console.log(`[presets] guest->${uid}: ${migrated.length} custom presets migrated`);
  }
  await localPresets.removeItem(localKey(null));
  return migrated;
}

/** Ambil preset custom. Untuk uid login sekaligus migrasi custom milik guest. */
export async function fetchPresets(uid: string | null): Promise<PresetDoc[]> {
  if (!uid) {
    return (await localPresets.getItem<PresetDoc[]>(localKey(null))) ?? [];
  }
  try {
    const snap = await getDocs(collection(db, `users/${uid}/presets`));
    const customs = snap.docs.map((d) => d.data() as PresetDoc).filter((p) => !p.isBuiltIn && !isBuiltInId(p.id));
    const ids = new Set(customs.map((p) => p.id));
    const migrated = await migrateGuestToCloud(uid, ids);
    const all = [...migrated, ...customs];
    await localPresets.setItem(localKey(uid), all);
    return all;
  } catch (e) {
    console.warn("[presets] fetch Firestore failed, fallback local", e);
    return (await localPresets.getItem<PresetDoc[]>(localKey(uid))) ?? [];
  }
}

export async function addPreset(uid: string | null, input: PresetInput): Promise<PresetDoc> {
  const existing = uid
    ? ((await localPresets.getItem<PresetDoc[]>(localKey(uid))) ?? [])
    : ((await localPresets.getItem<PresetDoc[]>(localKey(null))) ?? []);
  // Jika cache lokal kosong tapi login, cek Firestore agar hitungan max akurat
  let count = existing.filter((p) => !p.isBuiltIn).length;
  if (uid && existing.length === 0) {
    try {
      const snap = await getDocs(collection(db, `users/${uid}/presets`));
      count = snap.docs.map((d) => d.data() as PresetDoc).filter((p) => !p.isBuiltIn).length;
    } catch {
      // ignore, pakai cache lokal
    }
  }
  const err = validatePresetInput(input, count);
  if (err) throw new Error(err);

  const preset = buildDoc(input);
  if (uid) {
    try {
      await setDoc(doc(db, `users/${uid}/presets/${preset.id}`), preset);
    } catch (e) {
      console.warn("[presets] save Firestore failed, simpan lokal saja", e);
    }
    const key = localKey(uid);
    const list = (await localPresets.getItem<PresetDoc[]>(key)) ?? [];
    await localPresets.setItem(key, [preset, ...list].slice(0, MAX_CUSTOM_PRESETS + 5));
  } else {
    const key = localKey(null);
    const list = (await localPresets.getItem<PresetDoc[]>(key)) ?? [];
    await localPresets.setItem(key, [preset, ...list].slice(0, MAX_CUSTOM_PRESETS + 5));
  }
  return preset;
}

export async function updatePreset(
  uid: string | null,
  id: string,
  patch: Partial<PresetInput>
): Promise<PresetDoc> {
  if (isBuiltInId(id)) throw new Error("Preset bawaan tidak bisa diubah.");
  const key = localKey(uid);
  const list = (await localPresets.getItem<PresetDoc[]>(key)) ?? [];
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error("Preset tidak ditemukan.");
  const merged: PresetDoc = {
    ...list[idx],
    name: patch.name !== undefined ? patch.name.trim() : list[idx].name,
    runSec: patch.runSec ?? list[idx].runSec,
    walkSec: patch.walkSec ?? list[idx].walkSec,
    warmupSec: patch.warmupSec ?? list[idx].warmupSec,
    cooldownSec: patch.cooldownSec ?? list[idx].cooldownSec,
    soundId: patch.soundId ?? list[idx].soundId,
    icon: patch.icon ?? list[idx].icon,
    color: patch.color ?? list[idx].color,
  };
  const err = validatePresetInput(
    { name: merged.name, runSec: merged.runSec, walkSec: merged.walkSec, warmupSec: merged.warmupSec, cooldownSec: merged.cooldownSec },
    0 // update tidak menambah jumlah
  );
  if (err) throw new Error(err);
  const next = { ...merged, updatedAt: serverTimestamp() as unknown };
  if (uid) {
    try {
      await setDoc(doc(db, `users/${uid}/presets/${id}`), next, { merge: true });
    } catch (e) {
      console.warn("[presets] update Firestore failed", e);
    }
  }
  const copy = list.slice();
  copy[idx] = next;
  await localPresets.setItem(key, copy);
  return next;
}

export async function deletePreset(uid: string | null, id: string): Promise<void> {
  if (isBuiltInId(id)) throw new Error("Preset bawaan tidak bisa dihapus.");
  if (uid) {
    try {
      await deleteDoc(doc(db, `users/${uid}/presets/${id}`));
    } catch (e) {
      console.warn("[presets] delete Firestore failed", e);
    }
  }
  const key = localKey(uid);
  const list = (await localPresets.getItem<PresetDoc[]>(key)) ?? [];
  await localPresets.setItem(
    key,
    list.filter((p) => p.id !== id)
  );
}
