import type { Timestamp } from "firebase/firestore";

export type SessionStatus = "completed" | "stopped" | "abandoned";

export interface SessionDoc {
  id: string;
  presetId: string | null;
  presetSnapshot: {
    name: string;
    runSec: number;
    walkSec: number;
    warmupSec: number;
    cooldownSec: number;
  };
  status: SessionStatus;
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationSec: number;
  setsCompleted: number;
  xpEarned: number;
  createdAt?: Timestamp;
}
