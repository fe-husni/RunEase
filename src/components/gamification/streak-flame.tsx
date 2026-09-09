import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakFlame({ current, longest }: { current: number; longest: number }) {
  const isActive = current > 0;
  return (
    <div className={cn("border-4 border-bauhaus-black p-4 shadow-bauhaus", isActive ? "bg-bauhaus-red text-white" : "bg-white")}>
      <div className="flex items-center gap-3">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full border-2 border-bauhaus-black", isActive ? "bg-white text-bauhaus-red" : "bg-bauhaus-yellow text-bauhaus-black")}>
          <Flame className={cn("h-6 w-6", isActive && "fill-bauhaus-red")} />
        </div>
        <div>
          <div className="font-black text-3xl tabular-nums">{current} 🔥</div>
          <div className={cn("text-xs font-bold uppercase tracking-widest", isActive ? "text-white/80" : "opacity-60")}>Hari beruntun</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs font-bold uppercase tracking-widest opacity-60">Terpanjang</div>
          <div className="font-black">{longest} hari</div>
        </div>
      </div>
      {current === 0 && <p className="mt-2 text-xs font-medium opacity-60">Selesaikan sesi ≥10 menit hari ini untuk mulai streak!</p>}
      {current > 0 && current < 3 && <p className="mt-2 text-xs font-bold">Pertahankan! 1 hari lagi dapat badge!</p>}
    </div>
  );
}
