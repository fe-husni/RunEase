import { describe, it, expect } from "vitest";
import { checkBadges, countableSessions, type BadgeContext } from "./badges";
import type { SessionDoc } from "@/types/session";
import type { PresetDoc } from "@/types/preset";
import type { Timestamp } from "firebase/firestore";

let n = 0;

function sess(partial: Partial<SessionDoc> = {}): SessionDoc {
  const now = Date.now();
  return {
    id: `s${++n}`,
    presetId: "builtin_2_1",
    presetSnapshot: { name: "Seimbang 2:1", runSec: 120, walkSec: 60, warmupSec: 0, cooldownSec: 0 },
    status: "stopped",
    startedAt: now as unknown as Timestamp,
    endedAt: now as unknown as Timestamp,
    durationSec: 600,
    setsCompleted: 3,
    xpEarned: 10,
    ...partial,
  };
}

function customPreset(id: string): PresetDoc {
  return {
    id,
    name: id,
    runSec: 120,
    walkSec: 60,
    warmupSec: 0,
    cooldownSec: 0,
    mode: "infinite",
    soundId: "beep",
    icon: "square",
    color: "blue",
    isBuiltIn: false,
  };
}

function builtinPreset(id: string): PresetDoc {
  return { ...customPreset(id), isBuiltIn: true };
}

function ctx(partial: Partial<BadgeContext> = {}): BadgeContext {
  return { sessions: [], presets: [], totalRunMin: 0, level: 1, streak: 0, ...partial };
}

/** millis hari ini jam lokal h:m (untuk badge early_bird / night_runner). */
function atHour(h: number, minute = 15): Timestamp {
  const d = new Date();
  d.setHours(h, minute, 0, 0);
  return d.getTime() as unknown as Timestamp;
}

describe("countableSessions", () => {
  it("membuang sesi abandoned", () => {
    const list = [sess({ status: "stopped" }), sess({ status: "abandoned" }), sess({ status: "completed" })];
    expect(countableSessions(list)).toHaveLength(2);
  });
});

describe("preset_collector (kasus user: tambah 3 preset custom)", () => {
  const builtins = ["b1", "b2", "b3", "b4", "b5"].map(builtinPreset);

  it("belum unlock dengan 2 preset custom", () => {
    const presets = [...builtins, customPreset("c1"), customPreset("c2")];
    expect(checkBadges(ctx({ presets }))).not.toContain("preset_collector");
  });

  it("unlock dengan 3 preset custom", () => {
    const presets = [...builtins, customPreset("c1"), customPreset("c2"), customPreset("c3")];
    expect(checkBadges(ctx({ presets }))).toContain("preset_collector");
  });

  it("preset bawaan saja tidak dihitung", () => {
    expect(checkBadges(ctx({ presets: builtins }))).not.toContain("preset_collector");
  });
});

describe("night_runner (regresi off-by-one 23:xx)", () => {
  it("menghitung sesi jam 23:30", () => {
    const sessions = Array.from({ length: 5 }, () => sess({ startedAt: atHour(23, 30) }));
    expect(checkBadges(ctx({ sessions }))).toContain("night_runner");
  });

  it("belum unlock dengan 4 sesi malam", () => {
    const sessions = Array.from({ length: 4 }, () => sess({ startedAt: atHour(21) }));
    expect(checkBadges(ctx({ sessions }))).not.toContain("night_runner");
  });
});

describe("early_bird", () => {
  it("unlock dengan 5 sesi jam 06:xx", () => {
    const sessions = Array.from({ length: 5 }, () => sess({ startedAt: atHour(6) }));
    expect(checkBadges(ctx({ sessions }))).toContain("early_bird");
  });
});

describe("konsistensi filter abandoned", () => {
  it("intervals_100 mengabaikan set dari sesi abandoned", () => {
    const sessions = [sess({ status: "abandoned", setsCompleted: 150, durationSec: 30 })];
    expect(checkBadges(ctx({ sessions }))).not.toContain("intervals_100");
  });

  it("intervals_100 unlock dari sesi valid", () => {
    const sessions = Array.from({ length: 10 }, () => sess({ setsCompleted: 10 }));
    expect(checkBadges(ctx({ sessions }))).toContain("intervals_100");
  });

  it("explorer mengabaikan sesi abandoned", () => {
    const sessions = ["p1", "p2", "p3", "p4"].map((p) => sess({ presetId: p }));
    sessions.push(sess({ presetId: "p5", status: "abandoned", durationSec: 30 }));
    expect(checkBadges(ctx({ sessions }))).not.toContain("explorer");
  });

  it("explorer unlock dengan 5 presetId berbeda yang valid", () => {
    const sessions = ["p1", "p2", "p3", "p4", "p5"].map((p) => sess({ presetId: p }));
    expect(checkBadges(ctx({ sessions }))).toContain("explorer");
  });
});

describe("sanity badge sesi", () => {
  it("first_step unlock di sesi pertama", () => {
    expect(checkBadges(ctx({ sessions: [sess()] }))).toContain("first_step");
  });

  it("marathon_mini unlock di sesi >= 60 menit", () => {
    expect(checkBadges(ctx({ sessions: [sess({ durationSec: 3600 })] }))).toContain("marathon_mini");
  });

  it("completist_20 butuh 20 sesi", () => {
    const sessions = Array.from({ length: 19 }, () => sess());
    expect(checkBadges(ctx({ sessions }))).not.toContain("completist_20");
    sessions.push(sess());
    expect(checkBadges(ctx({ sessions }))).toContain("completist_20");
  });
});
