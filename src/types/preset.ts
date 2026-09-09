export interface PresetDoc {
  id: string;
  name: string;
  runSec: number;
  walkSec: number;
  warmupSec: number;
  cooldownSec: number;
  mode: "infinite" | "duration" | "sets";
  targetDurationSec?: number;
  targetSets?: number;
  soundId: string;
  icon: "circle" | "square" | "triangle";
  color: "red" | "blue" | "yellow";
  isBuiltIn: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}
