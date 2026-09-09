import type { Timestamp } from "firebase/firestore";

export interface UserDoc {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  xp: number;
  level: number;
  streak: {
    current: number;
    longest: number;
    lastDate: string | null;
    freezeTokens: number;
    updatedAt?: Timestamp;
  };
  stats: {
    totalSessions: number;
    totalDurationSec: number;
    totalRunSec: number;
    totalWalkSec: number;
  };
  preferences?: {
    language: "id" | "en";
    theme: "bauhaus-light";
  };
}

export interface SettingsDoc {
  soundId: string;
  volume: number;
  vibrate: boolean;
  voiceCoach: boolean;
  countdownBeep: boolean;
  wakeLock: boolean;
  language: "id" | "en";
  notifications: boolean;
  updatedAt?: Timestamp;
}
