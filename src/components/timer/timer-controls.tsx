import { Button } from "@/components/ui/button";
import { Pause, Play, SkipForward, Square } from "lucide-react";

interface Props {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onStop: () => void;
}

export function TimerControls({ isRunning, isPaused, onStart, onPause, onResume, onSkip, onStop }: Props) {
  if (!isRunning) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <Button variant="red" shape="square" size="lg" onClick={onStart} className="w-full min-h-[56px] text-base sm:text-lg">
          <Play className="h-6 w-6 shrink-0" /> MULAI LARI
        </Button>
        <p className="text-center text-[11px] sm:text-xs font-bold uppercase tracking-widest opacity-60">Tekan spasi untuk mulai • Pastikan volume aktif</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {isPaused ? (
        <Button variant="yellow" shape="square" onClick={onResume} className="min-h-[52px] px-2 text-xs sm:text-sm">
          <Play className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" /> LANJUT
        </Button>
      ) : (
        <Button variant="yellow" shape="square" onClick={onPause} className="min-h-[52px] px-2 text-xs sm:text-sm">
          <Pause className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" /> JEDA
        </Button>
      )}
      <Button variant="outline" shape="square" onClick={onSkip} className="min-h-[52px] px-2 text-xs sm:text-sm">
        <SkipForward className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" /> SKIP
      </Button>
      <Button variant="red" shape="square" onClick={onStop} className="min-h-[52px] px-2 text-xs sm:text-sm">
        <Square className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" /> STOP
      </Button>
    </div>
  );
}
