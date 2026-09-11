import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakFlame({ current, longest }: { current: number; longest: number }) {
  const isActive = current > 0;
  return (
    <div className={cn("border-2 sm:border-4 border-bauhaus-black p-3 sm:p-4 shadow-bauhaus-sm sm:shadow-bauhaus", isActive ? "bg-bauhaus-red text-white" : "bg-white")}>
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border-2 border-bauhaus-black", isActive ? "bg-white text-bauhaus-red" : "bg-bauhaus-yellow text-bauhaus-black")}>
          <Flame className={cn("h-5 w-5 sm:h-6 sm:w-6", isActive && "fill-bauhaus-red")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-black text-2xl sm:text-3xl tabular-nums leading-none">{current} 🔥</div>
          <div className={cn("mt-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest", isActive ? "text-white/80" : "opacity-60")}>Hari beruntun</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-60">Terpanjang</div>
          <div className="font-black text-sm sm:text-base tabular-nums whitespace-nowrap">{longest} hari</div>
        </div>
      </div>
      {current === 0 && <p className="mt-2 text-[11px] sm:text-xs font-medium opacity-60">Selesaikan sesi ≥10 menit hari ini untuk mulai streak!</p>}
      {current > 0 && current < 3 && <p className="mt-2 text-[11px] sm:text-xs font-bold">Pertahankan! 1 hari lagi dapat badge!</p>}
    </div>
  );
}
