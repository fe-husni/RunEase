import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/userStore";
import { useSessionStore } from "@/stores/sessionStore";
import { fetchUserDoc } from "@/lib/userStats";
import { badgeDefs } from "@/lib/badges";
import { getChallengeProgress } from "@/lib/challenges";
import { LevelBar } from "@/components/gamification/level-bar";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { BadgeCard } from "@/components/gamification/badge-card";
import { ChallengeCard } from "@/components/gamification/challenge-card";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toMillis } from "@/lib/session";
import { RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function StatsPage() {
  const user = useUserStore((s) => s.user);
  const { sessions, fetch } = useSessionStore();
  const [userDoc, setUserDoc] = useState<{ xp: number; level: number; streak: { current: number; longest: number } } | null>(null);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [earnedAtMap, setEarnedAtMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);

  const uid = user?.uid ?? null;
  const [period, setPeriod] = useState<"week" | "month">("week");

  const load = async () => {
    setLoading(true);
    if (uid) {
      await fetch(uid);
      const doc = await fetchUserDoc(uid);
      if (doc) setUserDoc({ xp: doc.xp, level: doc.level, streak: doc.streak });
      // badges
      const snap = await getDocs(collection(db, `users/${uid}/badges`));
      const set = new Set<string>();
      const map = new Map<string, string>();
      snap.docs.forEach((d) => {
        const data = d.data() as { id: string; earnedAt?: { toDate?: () => Date; seconds?: number } };
        set.add(data.id);
        const at = data.earnedAt;
        let iso = "";
        if (at && typeof (at as { toDate?: () => Date }).toDate === "function") iso = (at as { toDate: () => Date }).toDate!().toISOString();
        else if (at && typeof (at as { seconds: number }).seconds === "number") iso = new Date((at as { seconds: number }).seconds * 1000).toISOString();
        map.set(data.id, iso);
      });
      setEarned(set);
      setEarnedAtMap(map);
    } else {
      // guest: compute from local sessions
      await fetch(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // guest computed stats
  const guestStats = (() => {
    if (uid && userDoc) return null;
    const totalSec = sessions.reduce((s, x) => s + x.durationSec, 0);
    const totalXP = sessions.reduce((s, x) => s + x.xpEarned, 0);
    // level from XP
    const { levelFromXP } = (() => {
      // inline to avoid circular
      const xpForLevel = (l: number) => (l <= 1 ? 0 : (50 * (l - 1) * l) / 2);
      let lvl = 1;
      while (totalXP >= xpForLevel(lvl + 1)) lvl++;
      return { levelFromXP: (xp: number) => { let ll = 1; while (xp >= xpForLevel(ll + 1)) ll++; return ll; } };
    })();
    const lvl = levelFromXP(totalXP);
    // streak guest: calc from sessions
    // simple: unique days with >=10m
    const days = new Set(
      sessions
        .filter((s) => s.durationSec >= 600)
        .map((s) => {
          const d = new Date(toMillis(s.startedAt));
          const utc = d.getTime() + d.getTimezoneOffset() * 60000;
          const j = new Date(utc + 7 * 3600000);
          return `${j.getUTCFullYear()}-${String(j.getUTCMonth() + 1).padStart(2, "0")}-${String(j.getUTCDate()).padStart(2, "0")}`;
        })
    );
    // naive current streak: if today has session then count, else 0
    const today = (() => {
      const d = new Date();
      const utc = d.getTime() + d.getTimezoneOffset() * 60000;
      const j = new Date(utc + 7 * 3600000);
      return `${j.getUTCFullYear()}-${String(j.getUTCMonth() + 1).padStart(2, "0")}-${String(j.getUTCDate()).padStart(2, "0")}`;
    })();
    const hasToday = days.has(today);
    const current = hasToday ? 1 : 0; // simplified for guest
    return { xp: totalXP, level: lvl, streak: { current, longest: days.size > 0 ? 1 : 0 }, totalSec, totalSessions: sessions.length };
  })();

  const xp = userDoc?.xp ?? guestStats?.xp ?? 0;
  const level = userDoc?.level ?? guestStats?.level ?? 1;
  const streak = userDoc?.streak ?? guestStats?.streak ?? { current: 0, longest: 0 };
  const totalSessions = sessions.filter((s) => s.status !== "abandoned").length;
  const challenges = getChallengeProgress(sessions, streak.current);

  // chart data real - week (7 hari) & month (30 hari)
  const chartData = (() => {
    if (period === "week") {
      const days: { label: string; sec: number; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("id-ID", { weekday: "short" });
        const key = d.toISOString().slice(0, 10);
        days.push({ label, sec: 0, count: 0, _key: key } as never);
      }
      const map = new Map(days.map((d) => [(d as unknown as { _key: string })._key, d]));
      sessions.forEach((s) => {
        const d = new Date(toMillis(s.startedAt));
        const key = d.toISOString().slice(0, 10);
        const entry = map.get(key);
        if (entry) {
          entry.sec += s.durationSec;
          entry.count += 1;
        }
      });
      return days.map((d) => ({ name: d.label, menit: Math.round(d.sec / 60), sesi: d.count, sec: d.sec }));
    } else {
      // month: 6 slot @ 5 hari
      const slots: { label: string; sec: number; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const end = new Date();
        end.setDate(end.getDate() - i * 5);
        const start = new Date(end);
        start.setDate(end.getDate() - 4);
        const label = `${start.getDate()}/${start.getMonth() + 1}`;
        slots.push({ label, sec: 0, count: 0, _start: new Date(start), _end: new Date(end) } as never);
      }
      sessions.forEach((s) => {
        const ms = toMillis(s.startedAt);
        const d = new Date(ms);
        for (const slot of slots) {
          const sSlot = slot as unknown as { _start: Date; _end: Date };
          if (d >= sSlot._start && d <= sSlot._end) {
            slot.sec += s.durationSec;
            slot.count += 1;
            break;
          }
        }
      });
      return slots.map((s) => ({ name: s.label, menit: Math.round(s.sec / 60), sesi: s.count, sec: s.sec }));
    }
  })();

  const maxMenit = Math.max(1, ...chartData.map((d) => d.menit));

  return (
    <div className="container-app space-y-3 sm:space-y-4 py-3 sm:py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="page-title">Statistik</h1>
        <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <StreakFlame current={streak.current} longest={streak.longest} />

      <LevelBar xp={xp} level={level} />

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card deco="blue" className="p-3 sm:p-4 text-center">
          <div className="stat-label">Sesi</div>
          <div className="stat-value">{totalSessions}</div>
          <div className="mt-0.5 text-[10px] sm:text-xs font-medium opacity-60 break-words">{guestStats ? "tersimpan di lokal" : "tersimpan di cloud"}</div>
        </Card>
        <Card deco="yellow" className="p-3 sm:p-4 text-center">
          <div className="stat-label">Total Durasi</div>
          <div className="stat-value">{Math.floor((guestStats?.totalSec ?? sessions.reduce((s, x) => s + x.durationSec, 0)) / 60)}m</div>
          <div className="mt-0.5 text-[10px] sm:text-xs font-medium opacity-60 break-words">{uid ? "tersinkronisasi" : "guest mode"}</div>
        </Card>
      </div>

      <Card deco="blue">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <h3 className="font-black uppercase tracking-tight text-sm sm:text-base break-words">Grafik {period === "week" ? "Mingguan" : "Bulanan"}</h3>
            <Badge variant="muted" className="shrink-0">{period === "week" ? "7 hari" : "30 hari"}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant={period === "week" ? "blue" : "outline"} size="sm" onClick={() => setPeriod("week")} className="min-h-[36px] flex-1 sm:flex-none px-3">
              Minggu
            </Button>
            <Button variant={period === "month" ? "blue" : "outline"} size="sm" onClick={() => setPeriod("month")} className="min-h-[36px] flex-1 sm:flex-none px-3">
              Bulan
            </Button>
          </div>
        </div>
        <div className="mt-4 h-48 sm:h-56 w-full border-2 border-bauhaus-black bg-white p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#121212" strokeDasharray="2 4" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: "#121212", strokeWidth: 2 }} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: "#121212", strokeWidth: 2 }} domain={[0, maxMenit + 2]} tickFormatter={(v) => `${v}m`} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "2px solid #121212", borderRadius: 0, boxShadow: "4px 4px 0px 0px #121212", fontWeight: 700, fontSize: 12 }}
                cursor={{ fill: "#F0C020", opacity: 0.2 }}
                formatter={(value: number, name: string) => [`${value} ${name === "menit" ? "menit" : "sesi"}`, name]}
              />
              <Bar dataKey="menit" stroke="#121212" strokeWidth={2} radius={[0, 0, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.menit === 0 ? "#E0E0E0" : entry.menit > 30 ? "#D02020" : entry.menit > 15 ? "#F0C020" : "#1040C0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest opacity-60">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <span className="h-3 w-3 shrink-0 border-2 border-bauhaus-black bg-bauhaus-yellow" /> {period === "week" ? "Per hari" : "Per 5 hari"}
          </span>
          <span className="break-words">• Merah &gt;30m • Kuning 15-30m • Biru &lt;15m</span>
        </div>
        {chartData.every((d) => d.menit === 0) && <p className="mt-2 text-center text-xs font-medium opacity-60">Belum ada sesi di periode ini.</p>}
      </Card>

      <Card deco="yellow">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black uppercase tracking-tight text-sm sm:text-base break-words min-w-0 flex-1">Challenge Mingguan</h3>
          <Badge variant="blue" className="shrink-0">
            {challenges.filter((c) => c.done).length}/{challenges.length} selesai
          </Badge>
        </div>
        <div className="mt-3 grid gap-2 sm:gap-3 sm:grid-cols-2">
          {challenges.map((c) => (
            <ChallengeCard key={c.def.id} progress={c} />
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] sm:text-xs font-medium opacity-60">
          Dihitung dari sesi 7 hari terakhir (streak ikut progres harian).
        </p>
      </Card>

      <Card deco="red">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black uppercase tracking-tight text-sm sm:text-base break-words min-w-0 flex-1">Badge ({earned.size}/{badgeDefs.length})</h3>
          <Badge variant="yellow" className="shrink-0">{earned.size} diperoleh</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
          {badgeDefs.map((def) => (
            <BadgeCard key={def.id} def={def} earned={earned.has(def.id)} earnedAt={earnedAtMap.get(def.id)} />
          ))}
        </div>
        {earned.size === 0 && <p className="mt-3 text-center text-xs font-medium opacity-60">Selesaikan sesi pertama untuk badge pertama!</p>}
        {!uid && <p className="mt-3 rounded-none border-2 border-bauhaus-black bg-bauhaus-yellow p-2 text-center text-[11px] sm:text-xs font-bold uppercase tracking-widest break-words">Login untuk simpan badge permanen</p>}
      </Card>
    </div>
  );
}
