import { toMillis } from "@/lib/session";
import type { SessionDoc } from "@/types/session";

function getIntensity(durationSec: number): string {
  if (durationSec === 0) return "bg-bauhaus-gray";
  if (durationSec < 600) return "bg-bauhaus-yellow/40"; // <10m
  if (durationSec < 1800) return "bg-bauhaus-yellow"; // 10-30m
  if (durationSec < 3600) return "bg-bauhaus-red/70"; // 30-60m
  return "bg-bauhaus-red"; // 60m+
}

export function Heatmap({ sessions }: { sessions: SessionDoc[] }) {
  // build 5 weeks (35 days) ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: Date; duration: number }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ date: d, duration: 0 });
  }

  // map sessions to days
  const byDay = new Map<string, number>();
  sessions.forEach((s) => {
    const ms = toMillis(s.startedAt);
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + s.durationSec);
  });

  days.forEach((d) => {
    const key = d.date.toISOString().slice(0, 10);
    d.duration = byDay.get(key) ?? 0;
  });

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((d, i) => (
          <div
            key={i}
            title={`${d.date.toLocaleDateString("id-ID")} • ${Math.floor(d.duration / 60)}m`}
            className={`h-7 xs:h-6 sm:h-7 min-w-0 w-full border border-bauhaus-black ${getIntensity(d.duration)}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-xs font-bold uppercase tracking-widest opacity-60">
        <span className="shrink-0">35 hari terakhir</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <span className="h-3 w-3 shrink-0 border border-bauhaus-black bg-bauhaus-gray" /> 0
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <span className="h-3 w-3 shrink-0 border border-bauhaus-black bg-bauhaus-yellow/40" /> &lt;10m
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <span className="h-3 w-3 shrink-0 border border-bauhaus-black bg-bauhaus-yellow" /> 10-30m
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <span className="h-3 w-3 shrink-0 border border-bauhaus-black bg-bauhaus-red" /> 30m+
          </span>
        </span>
      </div>
    </div>
  );
}
