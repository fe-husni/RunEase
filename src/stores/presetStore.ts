import { create } from "zustand";
import type { PresetDoc } from "@/types/preset";
import { fetchPresets, addPreset, updatePreset, deletePreset, type PresetInput } from "@/lib/presets";

interface PresetStoreState {
  customs: PresetDoc[];
  loading: boolean;
  error: string | null;
  lastFetchedUid: string | null | undefined;
}

interface PresetStoreActions {
  fetch: (uid: string | null) => Promise<void>;
  add: (uid: string | null, input: PresetInput) => Promise<PresetDoc>;
  update: (uid: string | null, id: string, patch: Partial<PresetInput>) => Promise<PresetDoc>;
  remove: (uid: string | null, id: string) => Promise<void>;
  clear: () => void;
}

export const usePresetStore = create<PresetStoreState & PresetStoreActions>((set, get) => ({
  customs: [],
  loading: false,
  error: null,
  lastFetchedUid: undefined,

  fetch: async (uid) => {
    set({ loading: true, error: null });
    try {
      const customs = await fetchPresets(uid);
      set({ customs, lastFetchedUid: uid, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  add: async (uid, input) => {
    set({ loading: true, error: null });
    try {
      const preset = await addPreset(uid, input);
      set((s) => ({ customs: [preset, ...s.customs], loading: false }));
      return preset;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  update: async (uid, id, patch) => {
    try {
      const next = await updatePreset(uid, id, patch);
      set((s) => ({ customs: s.customs.map((p) => (p.id === id ? next : p)) }));
      return next;
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  remove: async (uid, id) => {
    // optimistic
    const prev = get().customs;
    set({ customs: prev.filter((p) => p.id !== id), error: null });
    try {
      await deletePreset(uid, id);
    } catch (e) {
      // rollback
      set({ customs: prev, error: (e as Error).message });
      throw e;
    }
  },

  clear: () => set({ customs: [], lastFetchedUid: undefined, error: null }),
}));
