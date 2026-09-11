import { progressToNextLevel, xpForLevel, titleForLevel } from "@/lib/gamification";

export function LevelBar({ xp, level }: { xp: number; level: number }) {
  const progress = progressToNextLevel(xp, level);
  const nextXP = xpForLevel(level + 1);
  const curXP = xpForLevel(level);
  const title = titleForLevel(level);

  return (
    <div className="border-2 sm:border-4 border-bauhaus-black bg-white p-3 sm:p-4 shadow-bauhaus-sm sm:shadow-bauhaus">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-60">Level {level}</div>
          <div className="font-black uppercase tracking-tight text-base sm:text-xl break-words leading-tight">{title}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-black text-base sm:text-lg tabular-nums whitespace-nowrap">{xp} XP</div>
          <div className="text-[11px] sm:text-xs font-medium opacity-60 tabular-nums whitespace-nowrap">{curXP} / {nextXP}</div>
        </div>
      </div>
      <div className="mt-3 h-3 overflow-hidden border-2 border-bauhaus-black bg-bauhaus-gray">
        <div className="h-full bg-bauhaus-yellow transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-1 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-60">{Math.round(progress)}% ke Level {level + 1}</div>
    </div>
  );
}
