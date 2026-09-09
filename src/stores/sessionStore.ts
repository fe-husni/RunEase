import { create } from "zustand";
import type { SessionDoc } from "@/types/session";
import { fetchSessions, deleteSession } from "@/lib/session";

interface SessionStoreState {
  sessions: SessionDoc[];
  loading: boolean;
  error: string | null;
  lastFetchedUid: string | null;
}

interface SessionStoreActions {
  fetch: (uid: string | null) => Promise<void>;
  remove: (uid: string | null, id: string) => Promise<void>;
  addLocal: (session: SessionDoc) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionStoreState & SessionStoreActions>((set, get) => ({
  sessions: [],
  loading: false,
  error: null,
  lastFetchedUid: null,

  fetch: async (uid) => {
    set({ loading: true, error: null });
    try {
      const sessions = await fetchSessions(uid);
      set({ sessions, lastFetchedUid: uid, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  remove: async (uid, id) => {
    // optimistic
    const prev = get().sessions;
    set({ sessions: prev.filter((s) => s.id !== id) });
    try {
      await deleteSession(uid, id);
    } catch (e) {
      // rollback
      set({ sessions: prev, error: (e as Error).message });
    }
  },

  addLocal: (session) => set((s) => ({ sessions: [session, ...s.sessions].slice(0, 200) })),

  clear: () => set({ sessions: [], lastFetchedUid: null }),
}));
