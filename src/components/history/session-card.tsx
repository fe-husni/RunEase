import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, Repeat } from "lucide-react";
import { toMillis } from "@/lib/session";
import type { SessionDoc } from "@/types/session";

function formatDate(millis: number): string {
  return new Date(millis).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function formatTimeOfDay(millis: number): string {
  return new Date(millis).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SessionCard({ session, onDelete }: { session: SessionDoc; onDelete: (id: string) => void }) {
  const startMs = toMillis(session.startedAt);
  const isAbandoned = session.status === "abandoned";
  return (
    <div
      className={`flex items-center justify-between border-2 border-bauhaus-black bg-white p-3 shadow-bauhaus-sm transition-opacity ${isAbandoned ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-black uppercase tracking-tight text-sm truncate">{session.presetSnapshot.name}</span>
          {session.status === "stopped" && <Badge variant="outline" className="text-[10px]">Stop</Badge>}
          {isAbandoned && <Badge variant="muted" className="text-[10px]">Abandoned</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium opacity-60">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDate(startMs)} • {formatTimeOfDay(startMs)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat className="h-3 w-3" /> {session.setsCompleted} set • {formatDuration(session.durationSec)}
          </span>
          <span>
            {session.presetSnapshot.runSec}s / {session.presetSnapshot.walkSec}s
          </span>
        </div>
      </div>
      <div className="ml-3 flex items-center gap-2 shrink-0">
        <Badge variant="yellow" className="border-2">+{session.xpEarned} XP</Badge>
        <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => onDelete(session.id)} className="h-8 w-8 border-2 border-bauhaus-black rounded-none">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
