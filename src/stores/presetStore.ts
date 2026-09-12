import { create } from "zustand";
import type { PresetDoc } from "@/types/preset";
import { fetchPresets, addPreset, updatePreset, deletePreset, type PresetInput } from "@/lib/presets";

interface PresetStoreState {
  customs: PresetDoc[];
  loading: boolean;
  error: string | null;
  lastFetchedUid: string | null | undefined;
  activePresetId: string | null;
  /** token naik tiap fetch — untuk abaikan resolve basi (race add vs fetch) */
  fetchSeq: number;
}

interface PresetStoreActions {
  fetch: (uid: string | null) => Promise<void>;
  add: (uid: string | null, input: PresetInput) => Promise<PresetDoc>;
  update: (uid: string | null, id: string, patch: Partial<PresetInput>) => Promise<PresetDoc>;
  remove: (uid: string | null, id: string) => Promise<void>;
  clear: () => void;
  setActive: (id: string | null) => void;
}

const ACTIVE_KEY = "runease:activePresetId";

function loadActive(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export const usePresetStore = create<PresetStoreState & PresetStoreActions>((set, get) => ({
  customs: [],
  loading: false,
  error: null,
  lastFetchedUid: undefined,
  activePresetId: typeof localStorage !== "undefined" ? loadActive() ?? "builtin_2_1" : "builtin_2_1",
  fetchSeq: 0,

  fetch: async (uid) => {
    const seq = get().fetchSeq + 1;
    set({ loading: true, error: null, fetchSeq: seq });
    try {
      const customs = await fetchPresets(uid);
      // abaikan hasil basi: fetch lain yang lebih baru sudah jalan / add optimistik sudah berisi id baru
      if (get().fetchSeq !== seq) return;
      set((s) => {
        // merge: jangan hilangkan preset yang baru di-add optimistik tapi belum terlihat di Firestore
        const seen = new Set(customs.map((p) => p.id));
        const keepLocal = s.customs.filter((p) => !seen.has(p.id));
        return { customs: [...keepLocal, ...customs], lastFetchedUid: uid, loading: false };
      });
    } catch (e) {
      if (get().fetchSeq !== seq) return;
      set({ error: (e as Error).message, loading: false });
    }
  },

  add: async (uid, input) => {
    set({ error: null });
    try {
      const preset = await addPreset(uid, input);
      set((s) => ({ customs: [preset, ...s.customs.filter((p) => p.id !== preset.id)] }));
      get().setActive(preset.id);
      return preset;
    } catch (e) {
      set({ error: (e as Error).message });
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
    // jika yang dihapus adalah preset aktif, kembalikan ke bawaan
    if (get().activePresetId === id) get().setActive("builtin_2_1");
    try {
      await deletePreset(uid, id);
    } catch (e) {
      // rollback
      set({ customs: prev, error: (e as Error).message });
      throw e;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(ACTIVE_KEY);
    } catch {
      // ignore
    }
    return set({ customs: [], lastFetchedUid: undefined, error: null, activePresetId: "builtin_2_1" });
  },

  setActive: (id) => {
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, id);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {
      // ignore
    }
    set({ activePresetId: id ?? "builtin_2_1" });
  },
}));
