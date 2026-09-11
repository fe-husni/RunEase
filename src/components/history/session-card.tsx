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
      className={`flex flex-col xs:flex-row gap-3 xs:items-center border-2 border-bauhaus-black bg-white p-3 sm:p-4 shadow-bauhaus-sm transition-opacity ${isAbandoned ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-black uppercase tracking-tight text-sm truncate min-w-0">{session.presetSnapshot.name}</span>
          {session.status === "completed" && <Badge variant="blue" className="shrink-0">Selesai</Badge>}
          {session.status === "stopped" && <Badge variant="outline" className="shrink-0">Stop</Badge>}
          {isAbandoned && <Badge variant="muted" className="shrink-0">Abandoned</Badge>}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] sm:text-xs font-medium opacity-60">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock className="h-3 w-3 shrink-0" /> {formatDate(startMs)} • {formatTimeOfDay(startMs)}
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Repeat className="h-3 w-3 shrink-0" /> {session.setsCompleted} set • {formatDuration(session.durationSec)}
          </span>
          <span className="whitespace-nowrap tabular-nums">
            {session.presetSnapshot.runSec}s / {session.presetSnapshot.walkSec}s
          </span>
        </div>
      </div>
      <div className="flex w-full xs:w-auto items-center justify-between xs:justify-end gap-2 shrink-0">
        <Badge variant="yellow" className="shrink-0">+{session.xpEarned} XP</Badge>
        <Button variant="outline-icon" size="icon" aria-label="Hapus" onClick={() => onDelete(session.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
