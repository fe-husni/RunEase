import { Award, Flame, Repeat, Footprints, Sunrise, Moon, Layers, Compass, Trophy, Clock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeDef } from "@/lib/badges";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints,
  Flame,
  Repeat,
  Award,
  Sunrise,
  Moon,
  Layers,
  Compass,
  Trophy,
  Clock,
  Crown,
};

export function BadgeCard({ def, earned, earnedAt }: { def: BadgeDef; earned: boolean; earnedAt?: string }) {
  const Icon = iconMap[def.icon] ?? Award;
  return (
    <div
      className={cn(
        "relative min-w-0 border-2 border-bauhaus-black p-2 sm:p-3 text-center shadow-bauhaus-sm transition-all",
        earned ? "bg-white" : "bg-bauhaus-muted opacity-50 grayscale",
        earned && "hover:-translate-y-1"
      )}
    >
      <div className={cn("mx-auto flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 border-bauhaus-black", earned ? (def.color === "red" ? "bg-bauhaus-red text-white" : def.color === "blue" ? "bg-bauhaus-blue text-white" : "bg-bauhaus-yellow text-bauhaus-black") : "bg-white")}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="mt-2 font-black uppercase tracking-tight text-[11px] sm:text-xs leading-tight break-words">{def.name}</div>
      <div className="mt-1 text-[10px] font-medium leading-tight opacity-60 line-clamp-2 break-words">{def.description}</div>
      {earned && earnedAt && <div className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-40 tabular-nums">{new Date(earnedAt).toLocaleDateString("id-ID")}</div>}
      {earned && <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-bauhaus-black bg-bauhaus-yellow" />}
    </div>
  );
}
