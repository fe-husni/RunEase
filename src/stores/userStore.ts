import { create } from "zustand";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut,
  signInAnonymously,
  linkWithPopup,
  linkWithRedirect,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { migrateGuestToUid } from "@/lib/migrate";

interface UserStoreState {
  user: User | null;
  loading: boolean;
  error: string | null;
  /** Hasil getRedirectResult terakhir — untuk diagnosis login HP (?debug=auth). */
  lastRedirect: RedirectDebug | null;
}

/** Hasil pemrosesan redirect login — null/success-null = hasil hilang di jalan. */
export interface RedirectDebug {
  status: "success-user" | "success-null" | "cancelled" | "error";
  code?: string;
  at: string;
}

interface UserStoreActions {
  init: () => () => void;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function isMobileOrStandalone(): boolean {
  if (typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  if (typeof window !== "undefined") {
    try {
      if (window.matchMedia("(display-mode: standalone)").matches) return true;
    } catch {
      // ignore
    }
    if ((navigator as unknown as { standalone?: boolean }).standalone) return true;
  }
  return false;
}

/** User menutup popup sendiri — jangan tampilkan error, jangan redirect paksa. */
function isUserCancelled(code?: string): boolean {
  return (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request" ||
    code === "auth/popup-window-closed" ||
    code === "auth/user-cancelled" ||
    code === "auth/user-mismatch"
  );
}

/** Popup memang tidak bisa dibuka di environment ini — baru boleh fallback redirect. */
function needsRedirectFallback(code?: string): boolean {
  return code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment";
}

/** Jejak attempt redirect — dibaca panel ?debug=auth setelah kembali dari Google. */
function recordAuthAttempt(path: "redirect-signin" | "redirect-link") {
  try {
    localStorage.setItem(
      "runease:authAttempt",
      JSON.stringify({ ts: new Date().toISOString(), path, from: window.location.href })
    );
  } catch {
    // Storage diblokir — panel akan menunjukkan attempt=null, itu sendiri petunjuk.
  }
}

function clearAuthAttempt() {
  try {
    localStorage.removeItem("runease:authAttempt");
  } catch {
    // ignore
  }
}

/**
 * Pesan error untuk USER — wajib bahasa manusia, tanpa istilah teknis
 * (tanpa kata Firebase, domain, API key, atau kode auth/...).
 * Detail teknis hanya ditulis ke console untuk developer.
 */
export function toFriendlyAuthMessage(err: unknown): string {
  const e = err as { code?: string; message?: string };
  const code = e?.code || "unknown";
  const host = typeof window !== "undefined" ? window.location.hostname : "?";
  console.warn(`[auth] login gagal (${code} @ ${host}):`, e?.message || err);
  switch (e?.code) {
    case "auth/popup-blocked":
      return "Jendela login diblokir browser. Izinkan popup untuk situs ini, lalu coba lagi.";
    case "auth/operation-not-allowed":
    case "auth/unauthorized-domain":
    case "auth/admin-restricted-operation":
      return "Login Google sedang tidak tersedia. Coba lagi nanti, atau pakai tanpa login dulu — datamu tetap tersimpan di perangkat ini.";
    case "auth/network-request-failed":
      return "Koneksi internet bermasalah. Periksa koneksimu lalu coba lagi.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "Aplikasi belum terhubung ke server. Coba lagi nanti, atau pakai tanpa login dulu.";
    case "auth/credential-already-in-use":
    case "auth/email-already-in-use":
      return "Akun Google ini sudah terdaftar. Mencoba masuk seperti biasa…";
    case "auth/account-exists-with-different-credential":
      return "Email ini sudah terdaftar dengan cara masuk yang lain. Masuk dengan cara yang sama seperti sebelumnya.";
    case "auth/too-many-requests":
      return "Terlalu sering mencoba. Tunggu sebentar lalu coba lagi.";
    case "auth/web-storage-unsupported":
      return "Browser memblokir penyimpanan. Matikan mode privat lalu coba lagi.";
    default:
      return "Login gagal. Periksa koneksi internet lalu coba lagi.";
  }
}

export const useUserStore = create<UserStoreState & UserStoreActions>((set) => ({
  user: null,
  loading: true,
  error: null,
  lastRedirect: null,

  clearError: () => set({ error: null }),

  init: () => {
    // Pastikan persistence lokal (penting untuk HP & PWA standalone)
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    // Handle redirect result (untuk HP yang pakai signInWithRedirect)
    getRedirectResult(auth)
      .then((result) => {
        const at = new Date().toISOString();
        if (result?.user) {
          set({ user: result.user, loading: false, error: null, lastRedirect: { status: "success-user", at } });
        } else {
          // Hasil null = tidak ada redirect pending di tab ini.
          // Jangan timpa hasil yang sudah tercatat (StrictMode dev memanggil init 2x).
          set((s) =>
            s.lastRedirect ? {} : { lastRedirect: { status: "success-null", at } }
          );
        }
      })
      .catch((err) => {
        const e = err as { code?: string };
        const at = new Date().toISOString();
        // User batal saat redirect = diam saja, jangan tampilkan error
        if (isUserCancelled(e?.code)) {
          set((s) =>
            s.lastRedirect
              ? { loading: false, error: null }
              : { loading: false, error: null, lastRedirect: { status: "cancelled", code: e?.code, at } }
          );
          return;
        }
        console.warn("[auth] getRedirectResult error", err);
        set({ loading: false, error: toFriendlyAuthMessage(err), lastRedirect: { status: "error", code: e?.code, at } });
      });

    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        set({ user, loading: false, error: null });
        if (user) {
          clearAuthAttempt();
          if (localStorage.getItem("runease:pendingGuestMigrate") === "1") {
          try {
            const res = await migrateGuestToUid(user.uid);
            if (res.migrated > 0) console.log(`[migrate] pending guest->${user.uid}: ${res.migrated} sessions`);
          } catch (e) {
            console.warn("[migrate] pending failed", e);
          } finally {
            localStorage.removeItem("runease:pendingGuestMigrate");
          }
          }
        }
      },
      (error) => set({ error: toFriendlyAuthMessage(error), loading: false })
    );
    return unsub;
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    const prevUser = auth.currentUser;
    const wasGuest = !prevUser;

    const doRedirectSignIn = async () => {
      if (wasGuest) localStorage.setItem("runease:pendingGuestMigrate", "1");
      recordAuthAttempt("redirect-signin");
      try {
        await signInWithRedirect(auth, googleProvider);
        // Halaman akan pindah — biarkan loading true sampai unload.
      } catch (err) {
        localStorage.removeItem("runease:pendingGuestMigrate");
        set({ error: toFriendlyAuthMessage(err), loading: false });
      }
    };

    const doRedirectLink = async (anonUser: User) => {
      recordAuthAttempt("redirect-link");
      try {
        await linkWithRedirect(anonUser, new GoogleAuthProvider());
        // Halaman akan pindah — biarkan loading true sampai unload.
      } catch (err) {
        set({ error: toFriendlyAuthMessage(err), loading: false });
      }
    };

    // Jika sebelumnya anon, coba link (agar uid tetap & data tidak hilang)
    if (prevUser?.isAnonymous) {
      if (isMobileOrStandalone()) {
        await doRedirectLink(prevUser);
        return;
      }
      try {
        await linkWithPopup(prevUser, new GoogleAuthProvider());
        // link sukses, onAuthStateChanged akan update user (uid sama)
        // migrasi guest jika ada (anon mungkin punya guest sebelumnya)
        try {
          const res = await migrateGuestToUid(prevUser.uid);
          if (res.migrated > 0) console.log(`[migrate] anon link: ${res.migrated} guest sessions migrated`);
        } catch (e) {
          console.warn("[migrate] anon guest failed", e);
        }
        set({ loading: false, error: null });
        return;
      } catch (err) {
        const e = err as { code?: string };
        // jika akun Google sudah ada (auth/credential-already-in-use), fallback ke signIn biasa
        if (e.code === "auth/credential-already-in-use" || e.code === "auth/email-already-in-use") {
          console.warn("[auth] link failed, fallback signIn", e.code);
          // lanjut ke flow signIn normal di bawah
        } else if (isUserCancelled(e.code)) {
          // User tutup popup sendiri — diam saja, jangan redirect, jangan error.
          set({ loading: false, error: null });
          return;
        } else if (needsRedirectFallback(e.code)) {
          await doRedirectLink(prevUser);
          return;
        } else {
          // Tampilkan popup error di UI — JANGAN throw (hindari unhandled rejection).
          set({ error: toFriendlyAuthMessage(err), loading: false });
          return;
        }
      }
    }

    // Non-anon atau fallback: signIn normal + migrasi guest
    if (isMobileOrStandalone()) {
      await doRedirectSignIn();
      return;
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      // migrasi guest -> uid baru
      if (wasGuest && cred.user?.uid) {
        try {
          const res = await migrateGuestToUid(cred.user.uid);
          if (res.migrated > 0) console.log(`[migrate] guest->${cred.user.uid}: ${res.migrated} sessions`);
        } catch (e) {
          console.warn("[migrate] guest failed", e);
        }
      }
      set({ loading: false, error: null });
    } catch (err) {
      const e = err as { code?: string };
      if (isUserCancelled(e.code)) {
        // User tutup popup sendiri — diam saja.
        set({ loading: false, error: null });
        return;
      }
      if (needsRedirectFallback(e.code)) {
        await doRedirectSignIn();
        return;
      }
      set({ error: toFriendlyAuthMessage(err), loading: false });
    }
  },

  signInAnonymously: async () => {
    set({ loading: true, error: null });
    try {
      await signInAnonymously(auth);
      set({ loading: false, error: null });
    } catch (err) {
      set({ error: toFriendlyAuthMessage(err), loading: false });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      set({ loading: false, error: null });
    } catch (err) {
      set({ loading: false, error: toFriendlyAuthMessage(err) });
    }
  },
}));
