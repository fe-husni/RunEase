import { toMillis } from "@/lib/session";
import type { SessionDoc } from "@/types/session";

export type ChallengeId = "weekly_5_sessions" | "weekly_150_min" | "monthly_streak_15";

export interface ChallengeDef {
  id: ChallengeId;
  title: string;
  desc: string;
  target: number;
  period: "week" | "month";
  unit: "sesi" | "menit" | "hari";
}

export interface ChallengeProgress {
  def: ChallengeDef;
  current: number;
  target: number;
  done: boolean;
  pct: number;
}

export const challengeDefs: ChallengeDef[] = [
  {
    id: "weekly_5_sessions",
    title: "5 Sesi Seminggu",
    desc: "Selesaikan 5 sesi (≥60 detik) dalam 7 hari terakhir",
    target: 5,
    period: "week",
    unit: "sesi",
  },
  {
    id: "weekly_150_min",
    title: "150 Menit Seminggu",
    desc: "Kumpulkan 150 menit total dalam 7 hari terakhir",
    target: 150,
    period: "week",
    unit: "menit",
  },
  {
    id: "monthly_streak_15",
    title: "Streak 15 Hari",
    desc: "Capai streak 15 hari berturut (sesi ≥10 menit/hari)",
    target: 15,
    period: "month",
    unit: "hari",
  },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isCounted(s: SessionDoc): boolean {
  // abandoned (<60s) tidak dihitung — konsisten dengan saveSession & stats totalSessions
  return s.status !== "abandoned";
}

/**
 * Hitung progress challenge dari sessions + streak saat ini.
 * - Weekly: rolling 7 hari terakhir berbasis millis (bebas masalah zona waktu).
 * - Monthly streak: pakai streak.current agar konsisten dengan StreakFlame.
 * Tanpa claim XP (iterasi 1: progres + status Selesai saja).
 */
export function getChallengeProgress(sessions: SessionDoc[], streakCurrent: number): ChallengeProgress[] {
  const now = Date.now();
  const cutoff = now - WEEK_MS;

  const weekly = sessions.filter((s) => isCounted(s) && toMillis(s.startedAt) >= cutoff);

  const weeklySessions = weekly.length;
  const weeklyMinutes = Math.floor(weekly.reduce((sum, s) => sum + (s.durationSec || 0), 0) / 60);
  const streak = Math.max(0, streakCurrent || 0);

  const values: Record<ChallengeId, number> = {
    weekly_5_sessions: weeklySessions,
    weekly_150_min: weeklyMinutes,
    monthly_streak_15: streak,
  };

  return challengeDefs.map((def) => {
    const current = values[def.id];
    const done = current >= def.target;
    const pct = Math.min(100, Math.round((current / def.target) * 100));
    return { def, current, target: def.target, done, pct };
  });
}
