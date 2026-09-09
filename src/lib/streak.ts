import { toMillis } from "@/lib/session";
import type { SessionDoc } from "@/types/session";

export interface StreakInfo {
  current: number;
  longest: number;
  lastDate: string | null; // YYYY-MM-DD Asia/Jakarta
  freezeTokens: number;
}

function toJakartaDateString(millis: number): string {
  // Convert to Asia/Jakarta (UTC+7) date string YYYY-MM-DD
  const d = new Date(millis);
  // Jakarta is UTC+7, so add 7 hours to UTC
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const jakarta = new Date(utc + 7 * 60 * 60000);
  const y = jakarta.getUTCFullYear();
  const m = String(jakarta.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jakarta.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayJakarta(): string {
  return toJakartaDateString(Date.now());
}

function diffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00+07:00").getTime();
  const db = new Date(b + "T00:00:00+07:00").getTime();
  return Math.round((db - da) / (24 * 60 * 60 * 1000));
}

/**
 * Hitung streak dari sessions yang completed dan duration >=10m (600s)
 * Urut desc, ambil tanggal unik yang ada sesi valid
 */
export function calcStreak(sessions: SessionDoc[], prev: StreakInfo | null): StreakInfo {
  const valid = sessions
    .filter((s) => s.status === "completed" || s.status === "stopped")
    .filter((s) => s.durationSec >= 600)
    .map((s) => toJakartaDateString(toMillis(s.startedAt)))
    .filter((v, i, arr) => arr.indexOf(v) === i) // unique
    .sort(); // asc

  if (valid.length === 0) {
    return {
      current: 0,
      longest: prev?.longest ?? 0,
      lastDate: prev?.lastDate ?? null,
      freezeTokens: prev?.freezeTokens ?? 1,
    };
  }

  // hitung longest streak
  let longest = 1;
  let curRun = 1;
  for (let i = 1; i < valid.length; i++) {
    if (diffDays(valid[i - 1], valid[i]) === 1) curRun++;
    else {
      longest = Math.max(longest, curRun);
      curRun = 1;
    }
  }
  longest = Math.max(longest, curRun);
  if (prev?.longest) longest = Math.max(longest, prev.longest);

  // hitung current streak: harus berakhir di hari ini atau kemarin (allow 1 day grace dengan freeze)
  const today = todayJakarta();
  const last = valid[valid.length - 1];
  const diffToday = diffDays(last, today);

  let current = 0;
  let freezeTokens = prev?.freezeTokens ?? 1;

  if (diffToday === 0) {
    // hari ini ada sesi, hitung mundur
    current = 1;
    for (let i = valid.length - 1; i > 0; i--) {
      if (diffDays(valid[i - 1], valid[i]) === 1) current++;
      else break;
    }
  } else if (diffToday === 1) {
    // kemarin terakhir, hari ini belum → current tetap, tapi besok jika tidak isi akan reset
    // cek apakah ada gap yang bisa pakai freeze (1 token per minggu, tapi MVP sederhana: 1 token total)
    // Untuk MVP: jika gap 2 hari dan ada freeze token, anggap freeze terpakai dan current tetap
    // Tapi jika gap 1 hari, current tetap (belum reset)
    current = 1;
    for (let i = valid.length - 1; i > 0; i--) {
      if (diffDays(valid[i - 1], valid[i]) === 1) current++;
      else break;
    }
    // tidak increment freeze, tapi akan dipakai jika besok masih kosong
  } else if (diffToday === 2 && freezeTokens > 0) {
    // lewat 1 hari kosong, pakai freeze
    freezeTokens -= 1;
    current = 1;
    for (let i = valid.length - 1; i > 0; i--) {
      if (diffDays(valid[i - 1], valid[i]) <= 2) {
        // allow 1 gap
        current++;
        // skip one gap only once
        if (diffDays(valid[i - 1], valid[i]) === 2) {
          // freeze used
          break;
        }
      } else break;
    }
  } else {
    // gap >1 dan no freeze, reset
    current = 0;
  }

  return {
    current,
    longest: Math.max(longest, current),
    lastDate: last,
    freezeTokens,
  };
}
