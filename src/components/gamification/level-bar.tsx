import { progressToNextLevel, xpForLevel, titleForLevel } from "@/lib/gamification";

export function LevelBar({ xp, level }: { xp: number; level: number }) {
  const progress = progressToNextLevel(xp, level);
  const nextXP = xpForLevel(level + 1);
  const curXP = xpForLevel(level);
  const title = titleForLevel(level);

  return (
    <div className="border-4 border-bauhaus-black bg-white p-4 shadow-bauhaus">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-widest opacity-60">Level {level}</div>
          <div className="font-black uppercase tracking-tight text-xl">{title}</div>
        </div>
        <div className="text-right">
          <div className="font-black text-lg tabular-nums">{xp} XP</div>
          <div className="text-xs font-medium opacity-60">{curXP} / {nextXP}</div>
        </div>
      </div>
      <div className="mt-3 h-3 overflow-hidden border-2 border-bauhaus-black bg-bauhaus-gray">
        <div className="h-full bg-bauhaus-yellow transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-1 text-center text-xs font-bold uppercase tracking-widest opacity-60">{Math.round(progress)}% ke Level {level + 1}</div>
    </div>
  );
}
