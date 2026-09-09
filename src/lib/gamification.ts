/**
 * XP & Level — sesuai PRD 5.7 & DATABASE 3.1
 * XP = floor(runMin*2 + walkMin*1) + bonus
 * Bonus: +5 jika durasi >=30m
 * Level curve: XP untuk level N = 50 * N * (N+1)/2
 */

export function calcXP(
  durationSec: number,
  runSec: number,
  walkSec: number,
  setsCompleted: number
): number {
  // estimasi proporsi run vs walk dalam sesi
  // total per set = runSec + walkSec
  // runMenit = (setsCompleted * runSec + remaining run portion) / 60
  // Untuk MVP: pakai durasi total * rasio run/(run+walk)
  const totalPerSet = runSec + walkSec;
  const runRatio = totalPerSet > 0 ? runSec / totalPerSet : 0.5;
  const durationMin = durationSec / 60;
  const runMin = durationMin * runRatio;
  const walkMin = durationMin * (1 - runRatio);
  let xp = Math.floor(runMin * 2 + walkMin * 1);
  if (durationSec >= 30 * 60) xp += 5;
  // minimal 1 XP jika sesi >=60s
  if (durationSec >= 60 && xp < 1) xp = 1;
  // abandoned (<60s) sudah di-filter sebelum calc, tapi jaga
  if (durationSec < 60) xp = 0;
  // tweak sets bonus: jika banyak set, tambah sedikit
  if (setsCompleted >= 10) xp += 2;
  return xp;
}

export function xpForLevel(level: number): number {
  // XP kumulatif untuk mencapai level N
  // Level 1 = 0 XP (start), Level 2 = 50, Level 3 = 150, etc.
  // Formula: 50 * (level-1)*level/2
  if (level <= 1) return 0;
  return 50 * ((level - 1) * level) / 2;
}

export function levelFromXP(xp: number): number {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}

export function xpForNextLevel(currentLevel: number): number {
  return xpForLevel(currentLevel + 1);
}

export function progressToNextLevel(xp: number, level: number): number {
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  if (next === cur) return 100;
  return Math.min(100, Math.max(0, ((xp - cur) / (next - cur)) * 100));
}

export function titleForLevel(level: number): string {
  if (level >= 50) return "Legenda";
  if (level >= 40) return "Marathoner";
  if (level >= 30) return "Veteran";
  if (level >= 20) return "Pejuang";
  if (level >= 10) return "Pelari Tetap";
  if (level >= 5) return "Pejuang Napas";
  return "Pemula";
}
