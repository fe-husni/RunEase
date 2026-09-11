import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime, getPhaseLabel } from "@/stores/timerStore";
import type { Phase } from "@/types/timer";
import { cn } from "@/lib/utils";

interface Props {
  remainingSec: number;
  phase: Phase;
  totalElapsedSec: number;
  setsCompleted: number;
  phaseDuration: number;
  isRunning: boolean;
}

function TimerDisplayImpl({ remainingSec, phase, totalElapsedSec, setsCompleted, phaseDuration, isRunning }: Props) {
  const progress = phaseDuration > 0 ? ((phaseDuration - remainingSec) / phaseDuration) * 100 : 0;

  const phaseColor =
    phase === "run"
      ? "bg-bauhaus-red text-white"
      : phase === "walk"
        ? "bg-bauhaus-blue text-white"
        : phase === "warmup" || phase === "cooldown"
          ? "bg-bauhaus-yellow text-bauhaus-black"
          : "bg-white text-bauhaus-black";

  const nextLabel = phase === "run" ? "JALAN" : phase === "walk" ? "LARI" : phase === "warmup" ? "LARI" : phase === "cooldown" ? "SELESAI" : "-";

  return (
    <Card deco={phase === "run" ? "red" : phase === "walk" ? "blue" : "yellow"} className="flex min-h-[42vh] xs:min-h-[45vh] sm:min-h-[50vh] flex-col items-center justify-center p-4 sm:p-8 text-center">
      <Badge
        variant={phase === "run" ? "red" : phase === "walk" ? "blue" : phase === "warmup" ? "yellow" : "outline"}
        className={cn("mb-4 sm:mb-6 border-2 shadow-bauhaus-sm", phaseColor, "px-4 py-1")}
      >
        {getPhaseLabel(phase)}
      </Badge>

      <h1
        aria-live="polite"
        aria-label={`Sisa waktu ${phase} ${formatTime(remainingSec)}`}
        className="font-black tabular-nums leading-[0.9] tracking-tighter text-6xl xs:text-7xl sm:text-8xl"
      >
        {formatTime(remainingSec)}
      </h1>

      <div
        className="mt-6 sm:mt-8 h-3 w-full max-w-sm overflow-hidden border-2 border-bauhaus-black bg-white"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(100, Math.max(0, progress)))}
        aria-label={`Progres fase ${phase}`}
      >
        <div
          className={cn("h-full transition-all duration-1000", phase === "run" ? "bg-bauhaus-red" : phase === "walk" ? "bg-bauhaus-blue" : "bg-bauhaus-yellow")}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest opacity-60">
        <span>Set {setsCompleted}</span>
        <span>•</span>
        <span>Total {formatTime(totalElapsedSec)}</span>
        <span>•</span>
        <span>Berikutnya: {nextLabel}</span>
      </div>

      {!isRunning && phase === "idle" && (
        <p className="mt-4 text-sm font-medium opacity-70">Atur waktu di bawah lalu tekan MULAI</p>
      )}

      {isRunning && (
        <div className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Berjalan
        </div>
      )}
    </Card>
  );
}

export const TimerDisplay = memo(TimerDisplayImpl);
