import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SettingsDoc {
  soundId: string;
  volume: number;
  vibrate: boolean;
  voiceCoach: boolean;
  countdownBeep: boolean;
  wakeLock: boolean;
  language: "id" | "en";
  notifications: boolean;
  updatedAt?: unknown;
}

export const defaultSettings: SettingsDoc = {
  soundId: "beep",
  volume: 80,
  vibrate: true,
  voiceCoach: false,
  countdownBeep: true,
  wakeLock: true,
  language: "id",
  notifications: false,
};

const localKey = "runease:settings";

export function loadLocalSettings(): SettingsDoc {
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...defaultSettings };
}

export function saveLocalSettings(s: Partial<SettingsDoc>): SettingsDoc {
  const current = loadLocalSettings();
  const next = { ...current, ...s };
  localStorage.setItem(localKey, JSON.stringify(next));
  return next;
}

export async function fetchSettings(uid: string | null): Promise<SettingsDoc> {
  if (!uid) return loadLocalSettings();
  try {
    const snap = await getDoc(doc(db, `users/${uid}/settings/main`));
    if (snap.exists()) {
      const data = snap.data() as SettingsDoc;
      // also sync to local
      localStorage.setItem(localKey, JSON.stringify(data));
      return { ...defaultSettings, ...data };
    }
  } catch (e) {
    console.warn("[settings] fetch failed, fallback local", e);
  }
  return loadLocalSettings();
}

export async function saveSettings(uid: string | null, patch: Partial<SettingsDoc>): Promise<SettingsDoc> {
  const next = saveLocalSettings(patch);
  if (!uid) return next;
  try {
    await setDoc(doc(db, `users/${uid}/settings/main`), { ...next, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn("[settings] save Firestore failed", e);
  }
  return next;
}
