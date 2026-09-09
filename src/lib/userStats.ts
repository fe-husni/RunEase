import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, Timestamp, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SessionDoc } from "@/types/session";
import type { PresetDoc } from "@/types/preset";
import { toMillis } from "@/lib/session";
import { calcStreak } from "@/lib/streak";
import { checkBadges, getBadgeDef } from "@/lib/badges";
import { levelFromXP } from "@/lib/gamification";

export interface UserDocLean {
  xp: number;
  level: number;
  streak: { current: number; longest: number; lastDate: string | null; freezeTokens: number };
  stats: { totalSessions: number; totalDurationSec: number; totalRunSec: number; totalWalkSec: number };
}

async function ensureUserDoc(uid: string, displayName: string | null, email: string | null, photoURL: string | null): Promise<void> {
  const ref = doc(db, `users/${uid}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      displayName,
      email,
      photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      xp: 0,
      level: 1,
      streak: { current: 0, longest: 0, lastDate: null, freezeTokens: 1, updatedAt: serverTimestamp() },
      stats: { totalSessions: 0, totalDurationSec: 0, totalRunSec: 0, totalWalkSec: 0 },
    });
  } else {
    // update display fields
    await updateDoc(ref, { displayName, email, photoURL, updatedAt: serverTimestamp() });
  }
}

export async function updateUserAfterSession(params: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  session: SessionDoc;
  allSessions: SessionDoc[];
  presets: PresetDoc[];
}): Promise<{ xp: number; level: number; newBadges: string[]; streak: number }> {
  const { uid, displayName, email, photoURL, session, allSessions, presets } = params;

  await ensureUserDoc(uid, displayName, email, photoURL);

  // 1. Update XP & Level & Stats via increment (optimistic)
  const userRef = doc(db, `users/${uid}`);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data() as UserDocLean | undefined;
  const prevXP = data?.xp ?? 0;
  const newXP = prevXP + session.xpEarned;
  const newLevel = levelFromXP(newXP);

  // calc run/walk portion
  const totalPerSet = session.presetSnapshot.runSec + session.presetSnapshot.walkSec;
  const runRatio = totalPerSet > 0 ? session.presetSnapshot.runSec / totalPerSet : 0.5;
  const runSec = Math.round(session.durationSec * runRatio);
  const walkSec = session.durationSec - runSec;

  await updateDoc(userRef, {
    xp: increment(session.xpEarned),
    level: newLevel,
    "stats.totalSessions": increment(1),
    "stats.totalDurationSec": increment(session.durationSec),
    "stats.totalRunSec": increment(runSec),
    "stats.totalWalkSec": increment(walkSec),
    updatedAt: serverTimestamp(),
  });

  // 2. Calc streak (client-side, based on allSessions including new one)
  const sessionsForStreak = [...allSessions, session].sort((a, b) => toMillis(a.startedAt) - toMillis(b.startedAt));
  const prevStreak = data?.streak ?? { current: 0, longest: 0, lastDate: null, freezeTokens: 1 };
  const streakInfo = calcStreak(sessionsForStreak, prevStreak);

  await updateDoc(userRef, {
    streak: { ...streakInfo, updatedAt: serverTimestamp() },
  });

  // 3. Check badges
  const totalRunMin = Math.floor(((data?.stats.totalRunSec ?? 0) + runSec) / 60);
  const allSessionsWithNew = sessionsForStreak;
  const badgeCtx = {
    sessions: allSessionsWithNew,
    presets,
    totalRunMin,
    level: newLevel,
    streak: streakInfo.current,
  };
  const earnedIds = checkBadges(badgeCtx);

  // fetch existing badges to find new
  const badgesSnap = await getDocs(collection(db, `users/${uid}/badges`));
  const existing = new Set(badgesSnap.docs.map((d) => d.id));
  const newBadges: string[] = [];
  for (const id of earnedIds) {
    if (!existing.has(id)) {
      newBadges.push(id);
      const def = getBadgeDef(id);
      await setDoc(doc(db, `users/${uid}/badges/${id}`), {
        id,
        name: def?.name ?? id,
        description: def?.description ?? "",
        icon: def?.icon ?? "Award",
        color: def?.color ?? "yellow",
        earnedAt: serverTimestamp() as unknown as Timestamp,
        seen: false,
      });
    }
  }

  return { xp: newXP, level: newLevel, newBadges, streak: streakInfo.current };
}

export async function fetchUserDoc(uid: string): Promise<UserDocLean | null> {
  const snap = await getDoc(doc(db, `users/${uid}`));
  if (!snap.exists()) return null;
  return snap.data() as UserDocLean;
}
