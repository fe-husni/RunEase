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
    <div className="mx-auto max-w-md space-y-4 py-6 sm:max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-black uppercase tracking-tighter text-3xl">Riwayat</h1>
        <Button variant="outline" size="sm" onClick={() => fetch(uid)} disabled={loading}>
          <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card deco="yellow">
        <div className="flex flex-wrap gap-2">
          <Button variant={filter === "all" ? "blue" : "outline"} size="sm" onClick={() => setFilter("all")}>
            Semua
          </Button>
          <Button variant={filter === "week" ? "blue" : "outline"} size="sm" onClick={() => setFilter("week")}>
            7 Hari
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="border-2 border-bauhaus-black bg-white p-3 shadow-bauhaus-sm">
            <div className="text-xs font-bold uppercase tracking-widest opacity-60">Sesi</div>
            <div className="font-black text-xl">{filtered.length}</div>
          </div>
          <div className="border-2 border-bauhaus-black bg-white p-3 shadow-bauhaus-sm">
            <div className="text-xs font-bold uppercase tracking-widest opacity-60">Durasi</div>
            <div className="font-black text-xl">
              {Math.floor(totals.totalSec / 60)}m {totals.totalSec % 60}s
            </div>
          </div>
          <div className="border-2 border-bauhaus-black bg-bauhaus-yellow p-3 shadow-bauhaus-sm">
            <div className="text-xs font-bold uppercase tracking-widest opacity-60">XP</div>
            <div className="font-black text-xl">+{totals.totalXP}</div>
          </div>
        </div>
        <div className="mt-2 text-center text-xs font-bold uppercase tracking-widest opacity-60">{totals.totalSets} set • {user ? "Sinkron cloud" : "Lokal (guest)"}</div>
      </Card>

      <Card deco="blue">
        <h3 className="font-black uppercase tracking-tight text-sm">Heatmap 35 Hari</h3>
        <div className="mt-3">
          <Heatmap sessions={sessions} />
        </div>
      </Card>

      {loading && sessions.length === 0 ? (
        <Card deco="red">
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-bauhaus-black border-t-transparent" />
            <p className="mt-2 font-bold uppercase tracking-widest text-sm">Memuat riwayat...</p>
          </div>
        </Card>
      ) : grouped.length === 0 ? (
        <Card deco="red">
          <div className="py-8 text-center">
            <p className="font-black uppercase tracking-tight">Belum ada sesi</p>
            <p className="mt-1 text-sm font-medium opacity-60">Selesaikan sesi minimal 60 detik di halaman Timer.</p>
            <Badge variant="yellow" className="mt-3">
              {user ? "Login aktif" : "Guest mode"}
            </Badge>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateKey, list]) => {
            const dayTotal = list.reduce((s, x) => s + x.durationSec, 0);
            const dayXP = list.reduce((s, x) => s + x.xpEarned, 0);
            return (
              <div key={dateKey}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-black uppercase tracking-tight text-sm">
                    {new Date(dateKey).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </h3>
                  <Badge variant="outline" className="text-xs">
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
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest">Hapus semua data lokal?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const ok = await confirm({
                  title: "Hapus semua sesi lokal?",
                  message: "Data di Firestore tetap aman.",
                  confirmLabel: "Lanjut",
                  variant: "yellow",
                });
                if (ok) {
                  // clear localForage only — for now just clear store
                  // actual clear needs localForage clear, but we keep it simple
                  await notify({
                    title: "Gunakan Settings",
                    message: "Pakai Settings > Hapus Semua Data untuk reset penuh.",
                    variant: "blue",
                  });
                }
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Info
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
