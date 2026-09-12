import { collection, getDocs, writeBatch, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import localForage from "localforage";

const localSessions = localForage.createInstance({ name: "runease", storeName: "sessions" });
const localPresets = localForage.createInstance({ name: "runease", storeName: "presets" });

export async function deleteAllData(uid: string | null): Promise<void> {
  // kunci lokal yang wajib dibersihkan di semua skenario (hindari resurrect via cache/migrasi)
  const LOCAL_STORAGE_KEYS = [
    "runease:customPresets",
    "runease:settings",
    "runease:authAttempt",
    "runease:pendingGuestMigrate",
    "runease:activeTimer",
    "runease:activePresetId",
  ];

  if (uid) {
    // Firestore: delete sessions, badges, custom presets, reset user doc
    const [sessSnap, badgeSnap, presetSnap] = await Promise.all([
      getDocs(collection(db, `users/${uid}/sessions`)),
      getDocs(collection(db, `users/${uid}/badges`)),
      getDocs(collection(db, `users/${uid}/presets`)),
    ]);

    // batch delete (chunk 400)
    const allDocs = [
      ...sessSnap.docs.map((d) => d.ref),
      ...badgeSnap.docs.map((d) => d.ref),
      ...presetSnap.docs.filter((d) => !(d.data() as { isBuiltIn?: boolean }).isBuiltIn).map((d) => d.ref),
    ];

    for (let i = 0; i < allDocs.length; i += 400) {
      const batch = writeBatch(db);
      allDocs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    // reset user stats
    await updateDoc(doc(db, `users/${uid}`), {
      xp: 0,
      level: 1,
      streak: { current: 0, longest: 0, lastDate: null, freezeTokens: 1, updatedAt: serverTimestamp() },
      stats: { totalSessions: 0, totalDurationSec: 0, totalRunSec: 0, totalWalkSec: 0 },
      updatedAt: serverTimestamp(),
    });

    // also clear settings/main? keep
    await Promise.all([
      localSessions.removeItem(`sessions:${uid}`),
      localSessions.removeItem(`sessions:guest`),
      localSessions.removeItem(`sessions:anon`),
      localPresets.removeItem(`presets:${uid}`),
      localPresets.removeItem(`presets:guest`),
    ]);
    LOCAL_STORAGE_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  } else {
    // guest only — bersihkan semua sisa agar tidak resurrect setelah login/migrasi
    await Promise.all([
      localSessions.removeItem("sessions:guest"),
      localSessions.removeItem("sessions:anon"),
      localPresets.removeItem("presets:guest"),
    ]);
    LOCAL_STORAGE_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  }
}
