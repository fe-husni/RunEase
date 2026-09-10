import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore, isMobileOrStandalone } from "@/stores/userStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLogo } from "@/components/brand/app-logo";
import { AlertTriangle, X } from "lucide-react";

export default function LoginPage() {
  const { user, loading, error, clearError, signInWithGoogle } = useUserStore();
  const lastRedirect = useUserStore((s) => s.lastRedirect);
  const reportIncompleteRedirect = useUserStore((s) => s.reportIncompleteRedirect);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.isAnonymous) navigate("/timer", { replace: true });
  }, [user, navigate]);

  // Redirect HP yang kembali tanpa hasil jangan diam: tampilkan panduan sekali.
  useEffect(() => {
    if (!loading && !user && lastRedirect?.status === "success-null") {
      reportIncompleteRedirect();
    }
  }, [loading, user, lastRedirect, reportIncompleteRedirect]);

  // Bungkus agar tidak ada unhandled rejection jika auth gagal.
  // Error asli sudah disimpan di store.error dan ditampilkan di banner bawah.
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.warn("[login] signInWithGoogle failed", e);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <Card deco="blue">
        <div className="text-center">
          <AppLogo size="lg" className="mb-4 justify-center" />
          <Badge variant="blue" className="mb-4">
            Auth
          </Badge>
          <h1 className="font-black uppercase tracking-tighter text-3xl leading-[0.9]">Masuk RunEase</h1>
          <p className="mt-2 font-medium opacity-70">Simpan progres, streak & badge di cloud. Tetap bisa pakai tanpa login.</p>
        </div>

        <CardContent className="mt-6 space-y-3">
          {/* Popup error: tampilkan setiap auth gagal agar tidak diam saja */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 border-2 border-bauhaus-red bg-red-50 p-3 text-left"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bauhaus-red" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-bauhaus-red">Login gagal</div>
                <div className="mt-0.5 text-sm font-medium text-bauhaus-red/90">{error}</div>
                <Button variant="ghost" size="sm" className="mt-2 px-2" onClick={handleGoogleLogin} disabled={loading}>
                  Coba lagi
                </Button>
              </div>
              <button
                type="button"
                aria-label="Tutup pesan error"
                onClick={clearError}
                className="shrink-0 border-2 border-transparent p-1 hover:border-bauhaus-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Button
            variant="red"
            shape="square"
            size="lg"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Login dengan Google"}
          </Button>

          {isMobileOrStandalone() && (
            <p className="text-center text-xs font-medium opacity-60">
              Akan dibuka tab Google — pilih akun, tap Lanjutkan, lalu kembali otomatis ke tab ini. Jangan tutup tab ini.
            </p>
          )}

          <p className="pt-2 text-center text-xs font-medium opacity-60">Data anonim disimpan lokal. Saat login nanti, data akan digabungkan.</p>
        </CardContent>
      </Card>

      {user && (
        <Card deco="yellow" className="mt-4">
          <div className="text-center text-sm font-bold">
            Login sebagai {user.displayName ?? user.email ?? "Anonim"} {user.isAnonymous && "(Anonim)"}
          </div>
        </Card>
      )}
    </div>
  );
}
