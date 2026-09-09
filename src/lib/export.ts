import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import localForage from "localforage";

const localSessions = localForage.createInstance({ name: "runease", storeName: "sessions" });

export async function exportData(uid: string | null): Promise<void> {
  let presets: unknown[] = [];
  let sessions: unknown[] = [];
  let badges: unknown[] = [];
  let user: unknown = null;
  let settings: unknown = { soundId: "beep", volume: 80, vibrate: true, voiceCoach: false, countdownBeep: true, wakeLock: true, language: "id" };

  if (uid) {
    const [userSnap, presetsSnap, sessionsSnap, badgesSnap, settingsSnap] = await Promise.all([
      getDoc(doc(db, `users/${uid}`)).catch(() => null),
      getDocs(collection(db, `users/${uid}/presets`)).catch(() => ({ docs: [] as never[] })),
      getDocs(collection(db, `users/${uid}/sessions`)).catch(() => ({ docs: [] as never[] })),
      getDocs(collection(db, `users/${uid}/badges`)).catch(() => ({ docs: [] as never[] })),
      getDoc(doc(db, `users/${uid}/settings/main`)).catch(() => null),
    ]);
    if (userSnap && (userSnap as { exists: () => boolean }).exists()) user = (userSnap as { data: () => unknown }).data();
    presets = (presetsSnap as { docs: { data: () => unknown }[] }).docs.map((d) => d.data());
    sessions = (sessionsSnap as { docs: { data: () => unknown }[] }).docs.map((d) => d.data());
    badges = (badgesSnap as { docs: { data: () => unknown }[] }).docs.map((d) => d.data());
    if (settingsSnap && (settingsSnap as { exists: () => boolean }).exists()) settings = (settingsSnap as { data: () => unknown }).data();

    // fallback local if empty
    if (sessions.length === 0) {
      const local = (await localSessions.getItem<unknown[]>(`sessions:${uid}`)) ?? [];
      if (local.length > 0) sessions = local;
    }
  } else {
    // guest
    sessions = (await localSessions.getItem<unknown[]>("sessions:guest")) ?? [];
    // presets guest not yet implemented, use builtin
  }

  const file = {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    exportedBy: uid ?? "guest",
    appVersion: "1.0.0",
    data: { user: user as never, presets: presets as never, sessions: sessions as never, badges: badges as never, settings: settings as never },
  };

  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `runease-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
