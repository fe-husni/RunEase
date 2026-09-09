import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChallengeProgress } from "@/lib/challenges";

interface ChallengeCardProps {
  progress: ChallengeProgress;
}

export function ChallengeCard({ progress }: ChallengeCardProps) {
  const { def, current, target, done, pct } = progress;
  return (
    <div
      className={cn(
        "border-2 border-bauhaus-black bg-white p-3 shadow-bauhaus-sm",
        done && "bg-bauhaus-yellow"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-xs font-black uppercase tracking-widest">{def.title}</div>
        {done ? (
          <Badge variant="blue" className="shrink-0 text-[10px]">
            Selesai
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {def.period === "week" ? "Mingguan" : "Bulanan"}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs font-medium opacity-60">{def.desc}</p>
      <div
        className="mt-2 h-3 w-full border-2 border-bauhaus-black bg-white"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={def.title}
      >
        <div
          className={cn("h-full transition-all duration-500", done ? "bg-bauhaus-blue" : "bg-bauhaus-yellow")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs font-bold uppercase tracking-widest tabular-nums">
        {current}/{target} {def.unit} • {pct}%
      </div>
    </div>
  );
}
