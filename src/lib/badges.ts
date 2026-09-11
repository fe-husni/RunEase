import type { SessionDoc } from "@/types/session";
import type { PresetDoc } from "@/types/preset";
import { toMillis } from "@/lib/session";

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide name
  color: "red" | "blue" | "yellow";
  check: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  sessions: SessionDoc[];
  presets: PresetDoc[];
  totalRunMin: number;
  level: number;
  streak: number;
}

/** Sesi yang dihitung untuk badge: abaikan abandoned (<60 detik). */
export function countableSessions(sessions: SessionDoc[]): SessionDoc[] {
  return sessions.filter((s) => s.status !== "abandoned");
}

export const badgeDefs: BadgeDef[] = [
  {
    id: "first_step",
    name: "Langkah Pertama",
    description: "Selesaikan sesi pertama",
    icon: "Footprints",
    color: "yellow",
    check: ({ sessions }) => countableSessions(sessions).length >= 1,
  },
  {
    id: "streak_7",
    name: "Konsisten 7",
    description: "Streak 7 hari",
    icon: "Flame",
    color: "red",
    check: ({ streak }) => streak >= 7,
  },
  {
    id: "streak_30",
    name: "Konsisten 30",
    description: "Streak 30 hari",
    icon: "Flame",
    color: "red",
    check: ({ streak }) => streak >= 30,
  },
  {
    id: "intervals_100",
    name: "Pejuang 100",
    description: "100 interval Run selesai",
    icon: "Repeat",
    color: "blue",
    check: ({ sessions }) => countableSessions(sessions).reduce((sum, s) => sum + s.setsCompleted, 0) >= 100,
  },
  {
    id: "marathon_mini",
    name: "Marathon Mini",
    description: "Sesi 60 menit",
    icon: "Award",
    color: "yellow",
    check: ({ sessions }) => countableSessions(sessions).some((s) => s.durationSec >= 3600),
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "5 sesi jam 05:00-07:00",
    icon: "Sunrise",
    color: "yellow",
    check: ({ sessions }) => {
      const c = countableSessions(sessions).filter((s) => {
        const h = new Date(toMillis(s.startedAt)).getHours();
        return h >= 5 && h < 7;
      }).length;
      return c >= 5;
    },
  },
  {
    id: "night_runner",
    name: "Night Runner",
    description: "5 sesi jam 20:00-23:00",
    icon: "Moon",
    color: "blue",
    check: ({ sessions }) => {
      const c = countableSessions(sessions).filter((s) => {
        const h = new Date(toMillis(s.startedAt)).getHours();
        return h >= 20 && h < 24;
      }).length;
      return c >= 5;
    },
  },
  {
    id: "preset_collector",
    name: "Kolektor Preset",
    description: "Buat 3 preset custom",
    icon: "Layers",
    color: "blue",
    check: ({ presets }) => presets.filter((p) => !p.isBuiltIn).length >= 3,
  },
  {
    id: "explorer",
    name: "Penjelajah",
    description: "Coba 5 preset berbeda",
    icon: "Compass",
    color: "red",
    check: ({ sessions }) => new Set(countableSessions(sessions).map((s) => s.presetId).filter(Boolean)).size >= 5,
  },
  {
    id: "completist_20",
    name: "Kompletis",
    description: "20 sesi total",
    icon: "Trophy",
    color: "yellow",
    check: ({ sessions }) => countableSessions(sessions).length >= 20,
  },
  {
    id: "veteran_500",
    name: "Veteran",
    description: "500 menit total lari",
    icon: "Clock",
    color: "red",
    check: ({ totalRunMin }) => totalRunMin >= 500,
  },
  {
    id: "legend_10",
    name: "Legenda",
    description: "Level 10",
    icon: "Crown",
    color: "yellow",
    check: ({ level }) => level >= 10,
  },
];

export function checkBadges(ctx: BadgeContext): string[] {
  return badgeDefs.filter((b) => b.check(ctx)).map((b) => b.id);
}

export function getBadgeDef(id: string): BadgeDef | undefined {
  return badgeDefs.find((b) => b.id === id);
}
