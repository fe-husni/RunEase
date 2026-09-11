import { describe, it, expect } from "vitest";
import { getNextPhase, targetSetsOf, sanitizeTargetSets } from "./phase";
import type { TimerConfig, Phase } from "@/types/timer";

const base: TimerConfig = {
  runSec: 120,
  walkSec: 60,
  warmupSec: 0,
  cooldownSec: 60,
  mode: "infinite",
  targetSets: undefined,
};

const sets3: TimerConfig = { ...base, mode: "sets", targetSets: 3 };

describe("targetSetsOf", () => {
  it("null untuk mode bebas walau targetSets terisi", () => {
    expect(targetSetsOf({ ...base, targetSets: 5 })).toBeNull();
  });

  it("null untuk target invalid (0, pecahan, string, >50)", () => {
    expect(targetSetsOf({ ...base, mode: "sets", targetSets: 0 })).toBeNull();
    expect(targetSetsOf({ ...base, mode: "sets", targetSets: 2.5 })).toBeNull();
    expect(targetSetsOf({ ...base, mode: "sets", targetSets: 51 })).toBeNull();
    expect(targetSetsOf({ ...base, mode: "sets", targetSets: undefined })).toBeNull();
  });

  it("nilai valid 1-50", () => {
    expect(targetSetsOf({ ...base, mode: "sets", targetSets: 1 })).toBe(1);
    expect(targetSetsOf({ ...base, mode: "sets", targetSets: 50 })).toBe(50);
  });
});

describe("getNextPhase mode bebas (perilaku lama lestari)", () => {
  it("warmup -> run -> walk -> run (loop, cooldown tak pernah masuk)", () => {
    expect(getNextPhase("warmup", base, 0)).toBe("run");
    expect(getNextPhase("run", base, 0)).toBe("walk");
    expect(getNextPhase("walk", { ...base, cooldownSec: 120 }, 99)).toBe("run");
  });

  it("cooldown -> idle tetap ada", () => {
    expect(getNextPhase("cooldown", base, 0)).toBe("idle");
  });
});

describe("getNextPhase mode target (kasus user: cooldown tak pernah muncul)", () => {
  it("set belum tercapai -> loop run", () => {
    expect(getNextPhase("walk", sets3, 1)).toBe("run");
    expect(getNextPhase("walk", sets3, 2)).toBe("run");
  });

  it("set terakhir tercapai + cooldown>0 -> cooldown", () => {
    expect(getNextPhase("walk", sets3, 3)).toBe("cooldown");
  });

  it("set terakhir tercapai + cooldown=0 -> langsung idle (selesai)", () => {
    expect(getNextPhase("walk", { ...sets3, cooldownSec: 0 }, 3)).toBe("idle");
  });

  it("simulasi penuh 3 set: run/walk x3 -> cooldown -> idle", () => {
    // meniru worker: increment setsCompleted DULU tiap walk selesai,
    // baru panggil getNextPhase dengan nilai terbaru
    const seq2: string[] = [];
    let p: Phase = "run";
    let d = 0;
    for (let i = 0; i < 20 && p !== "idle"; i++) {
      if (p === "run") {
        seq2.push("run->walk");
        p = "walk";
      } else if (p === "walk") {
        d += 1;
        const nx = getNextPhase("walk", sets3, d);
        seq2.push(`walk(${d})->${nx}`);
        p = nx;
      } else if (p === "cooldown") {
        seq2.push("cooldown->idle");
        p = "idle";
      }
    }
    expect(seq2).toEqual([
      "run->walk",
      "walk(1)->run",
      "run->walk",
      "walk(2)->run",
      "run->walk",
      "walk(3)->cooldown",
      "cooldown->idle",
    ]);
  });

  it("skip di set terakhir mengikuti aturan yang sama", () => {
    // skip dari walk set ke-3 = set selesai -> cooldown
    expect(getNextPhase("walk", sets3, 3)).toBe("cooldown");
    // skip dari cooldown -> idle
    expect(getNextPhase("cooldown", sets3, 3)).toBe("idle");
  });
});

describe("sanitizeTargetSets", () => {
  it("clamp 1-50, fallback untuk invalid", () => {
    expect(sanitizeTargetSets(0)).toBe(1);
    expect(sanitizeTargetSets(99)).toBe(50);
    expect(sanitizeTargetSets(2.5)).toBe(3);
    expect(sanitizeTargetSets(undefined)).toBe(3);
    expect(sanitizeTargetSets(5)).toBe(5);
  });
});
