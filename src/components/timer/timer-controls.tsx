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
      <div className="grid grid-cols-1 gap-4">
        <Button variant="red" shape="square" size="lg" onClick={onStart} className="w-full text-lg">
          <Play className="mr-2 h-6 w-6" /> MULAI LARI
        </Button>
        <p className="text-center text-xs font-bold uppercase tracking-widest opacity-60">Tekan spasi untuk mulai • Pastikan volume aktif</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {isPaused ? (
        <Button variant="yellow" shape="square" onClick={onResume} className="col-span-1">
          <Play className="mr-1 h-5 w-5" /> LANJUT
        </Button>
      ) : (
        <Button variant="yellow" shape="square" onClick={onPause} className="col-span-1">
          <Pause className="mr-1 h-5 w-5" /> JEDA
        </Button>
      )}
      <Button variant="outline" shape="square" onClick={onSkip}>
        <SkipForward className="mr-1 h-5 w-5" /> SKIP
      </Button>
      <Button variant="red" shape="square" onClick={onStop}>
        <Square className="mr-1 h-5 w-5" /> STOP
      </Button>
    </div>
  );
}
