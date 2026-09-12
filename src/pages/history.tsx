import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";
import { SessionCard } from "@/components/history/session-card";
import { Heatmap } from "@/components/history/heatmap";
import { toMillis, formatDateKey } from "@/lib/session";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { RefreshCw, Trash2 } from "lucide-react";

export default function HistoryPage() {
  const user = useUserStore((s) => s.user);
  const { sessions, loading, fetch, remove } = useSessionStore();
  const { confirm, notify } = useConfirmDialog();
  const [filter, setFilter] = useState<"all" | "week">("all");

  const uid = user?.uid ?? null;

  useEffect(() => {
    fetch(uid);
  }, [uid, fetch]);

  const filtered = useMemo(() => {
    if (filter === "week") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return sessions.filter((s) => toMillis(s.startedAt) >= weekAgo);
    }
    return sessions;
  }, [sessions, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((s) => {
      const key = formatDateKey(toMillis(s.startedAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    // sort keys desc
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totals = useMemo(() => {
    const totalSec = filtered.reduce((sum, s) => sum + s.durationSec, 0);
    const totalXP = filtered.reduce((sum, s) => sum + s.xpEarned, 0);
    const totalSets = filtered.reduce((sum, s) => sum + s.setsCompleted, 0);
    return { totalSec, totalXP, totalSets };
  }, [filtered]);

  return (
    <div className="container-app space-y-3 sm:space-y-4 py-3 sm:py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="page-title">Riwayat</h1>
        <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={() => fetch(uid)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card deco="yellow">
        <div className="flex flex-wrap gap-2">
          <Button variant={filter === "all" ? "blue" : "outline"} size="sm" className="flex-1 xs:flex-none" onClick={() => setFilter("all")}>
            Semua
          </Button>
          <Button variant={filter === "week" ? "blue" : "outline"} size="sm" className="flex-1 xs:flex-none" onClick={() => setFilter("week")}>
            7 Hari
          </Button>
        </div>
        <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="border-2 border-bauhaus-black bg-white p-2 sm:p-3 shadow-bauhaus-sm min-w-0">
            <div className="stat-label">Sesi</div>
            <div className="stat-value">{filtered.length}</div>
          </div>
          <div className="border-2 border-bauhaus-black bg-white p-2 sm:p-3 shadow-bauhaus-sm min-w-0">
            <div className="stat-label">Durasi</div>
            <div className="stat-value">
              {Math.floor(totals.totalSec / 60)}m {totals.totalSec % 60}s
            </div>
          </div>
          <div className="border-2 border-bauhaus-black bg-bauhaus-yellow p-2 sm:p-3 shadow-bauhaus-sm min-w-0">
            <div className="stat-label">XP</div>
            <div className="stat-value">+{totals.totalXP}</div>
          </div>
        </div>
        <div className="mt-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-60 break-words">{totals.totalSets} set • {user ? "Sinkron cloud" : "Lokal (guest)"}</div>
      </Card>

      <Card deco="blue">
        <h3 className="font-black uppercase tracking-tight text-sm sm:text-base">Heatmap 35 Hari</h3>
        <div className="mt-3">
          <Heatmap sessions={sessions} />
        </div>
      </Card>

      {loading && sessions.length === 0 ? (
        <Card deco="red">
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-bauhaus-black border-t-transparent" />
            <p className="mt-2 font-bold uppercase tracking-widest text-xs sm:text-sm">Memuat riwayat...</p>
          </div>
        </Card>
      ) : grouped.length === 0 ? (
        <Card deco="red">
          <div className="py-8 text-center px-2">
            <p className="font-black uppercase tracking-tight text-balance">Belum ada sesi</p>
            <p className="mt-1 text-sm font-medium opacity-60">Selesaikan sesi minimal 60 detik di halaman Timer.</p>
            <Badge variant="yellow" className="mt-3">
              {user ? "Login aktif" : "Guest mode"}
            </Badge>
          </div>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {grouped.map(([dateKey, list]) => {
            const dayTotal = list.reduce((s, x) => s + x.durationSec, 0);
            const dayXP = list.reduce((s, x) => s + x.xpEarned, 0);
            return (
              <div key={dateKey}>
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="font-black uppercase tracking-tight text-xs sm:text-sm break-words min-w-0">
                    {new Date(dateKey).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </h3>
                  <Badge variant="outline" className="shrink-0">
                    {list.length} sesi • {Math.floor(dayTotal / 60)}m • +{dayXP} XP
                  </Badge>
                </div>
                <div className="space-y-2">
                  {list.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onDelete={async (id) => {
                        const ok = await confirm({
                          title: "Hapus sesi ini?",
                          message: "Sesi yang dihapus tidak bisa dikembalikan.",
                          confirmLabel: "Hapus",
                          variant: "red",
                        });
                        if (ok) remove(uid, id);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sessions.length > 0 && (
        <Card deco="red" className="border-bauhaus-red">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest break-words flex-1">Hapus semua riwayat?</span>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 w-full xs:w-auto"
              onClick={async () => {
                const ok = await confirm({
                  title: "Hapus semua riwayat?",
                  message: "Semua sesi akan dihapus permanen. Preset custom, badge, dan progres XP tetap aman.",
                  confirmLabel: "Hapus Semua",
                  variant: "red",
                });
                if (!ok) return;
                try {
                  const { deleteAllSessions } = await import("@/lib/session");
                  await deleteAllSessions(uid);
                  const { useSessionStore: ss } = await import("@/stores/sessionStore");
                  ss.getState().clear();
                  await fetch(uid);
                  await notify({
                    title: "Riwayat terhapus",
                    message: "Semua sesi sudah dihapus permanen. Preset & progres tetap aman.",
                    variant: "yellow",
                  });
                } catch (e) {
                  await notify({
                    title: "Gagal hapus",
                    message: (e as Error).message,
                    variant: "red",
                  });
                }
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Hapus Semua
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
