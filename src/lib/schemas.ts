import { z } from "zod";

export const PresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  runSec: z.number().int().min(10).max(600),
  walkSec: z.number().int().min(10).max(600),
  warmupSec: z.number().int().min(0).max(600).default(0),
  cooldownSec: z.number().int().min(0).max(600).default(0),
  mode: z.enum(["infinite", "duration", "sets"]).default("infinite"),
  targetDurationSec: z.number().optional(),
  targetSets: z.number().optional(),
  soundId: z.string().default("beep"),
  icon: z.enum(["circle", "square", "triangle"]).default("circle"),
  color: z.enum(["red", "blue", "yellow"]).default("blue"),
  isBuiltIn: z.boolean().default(false),
});

export const SessionSchema = z.object({
  id: z.string(),
  presetId: z.string().nullable(),
  presetSnapshot: z.object({
    name: z.string(),
    runSec: z.number().int(),
    walkSec: z.number().int(),
    warmupSec: z.number().int(),
    cooldownSec: z.number().int(),
  }),
  status: z.enum(["completed", "stopped", "abandoned"]),
  startedAt: z.union([z.string(), z.object({ seconds: z.number(), nanoseconds: z.number() }), z.date()]).transform((v) => v as unknown),
  endedAt: z.union([z.string(), z.object({ seconds: z.number(), nanoseconds: z.number() }), z.date()]).transform((v) => v as unknown),
  durationSec: z.number().int().min(0),
  setsCompleted: z.number().int().min(0),
  xpEarned: z.number().int().min(0),
});

export const BadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.enum(["red", "blue", "yellow"]).optional(),
  earnedAt: z.union([z.string(), z.object({ seconds: z.number() }), z.date()]).transform((v) => v as unknown),
  seen: z.boolean().optional(),
});

export const SettingsSchema = z.object({
  soundId: z.string().default("beep"),
  volume: z.number().min(0).max(100).default(80),
  vibrate: z.boolean().default(true),
  voiceCoach: z.boolean().default(false),
  countdownBeep: z.boolean().default(true),
  wakeLock: z.boolean().default(true),
  language: z.enum(["id", "en"]).default("id"),
  notifications: z.boolean().default(false),
});

export const ExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  exportedBy: z.string(),
  appVersion: z.string(),
  data: z.object({
    user: z.object({}).passthrough().optional(),
    presets: z.array(PresetSchema),
    sessions: z.array(SessionSchema),
    badges: z.array(BadgeSchema),
    settings: SettingsSchema.optional(),
  }),
});

export type ExportFile = z.infer<typeof ExportSchema>;
