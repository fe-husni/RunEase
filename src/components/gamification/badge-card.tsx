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
        "relative border-2 border-bauhaus-black p-3 text-center shadow-bauhaus-sm transition-all",
        earned ? "bg-white" : "bg-bauhaus-muted opacity-50 grayscale",
        earned && "hover:-translate-y-1"
      )}
    >
      <div className={cn("mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-bauhaus-black", earned ? (def.color === "red" ? "bg-bauhaus-red text-white" : def.color === "blue" ? "bg-bauhaus-blue text-white" : "bg-bauhaus-yellow text-bauhaus-black") : "bg-white")}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-2 font-black uppercase tracking-tight text-xs leading-tight">{def.name}</div>
      <div className="mt-1 text-[10px] font-medium leading-tight opacity-60">{def.description}</div>
      {earned && earnedAt && <div className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-40">{new Date(earnedAt).toLocaleDateString("id-ID")}</div>}
      {earned && <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-bauhaus-black bg-bauhaus-yellow" />}
    </div>
  );
}
