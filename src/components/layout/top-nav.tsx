import { Link } from "react-router-dom";
import { AppLogo } from "@/components/brand/app-logo";
import { Avatar } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/userStore";

export function TopNav() {
  const user = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);
  return (
    <nav aria-label="Navigasi utama" className="sticky top-0 z-50 flex h-14 sm:h-16 items-center justify-between border-b-4 border-bauhaus-black bg-bauhaus-gray px-4 sm:px-6 lg:px-8">
      <Link to="/" aria-label="RunEase - beranda" className="flex min-h-[44px] items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue">
        <AppLogo size="sm" className="sm:hidden" />
        <span className="hidden sm:block">
          <AppLogo size="md" />
        </span>
      </Link>
      <div className="hidden items-center gap-6 font-bold uppercase tracking-wider text-sm md:flex">
        <Link to="/timer" className="transition-colors hover:text-bauhaus-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue">
          Timer
        </Link>
        <Link to="/history" className="transition-colors hover:text-bauhaus-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue">
          Riwayat
        </Link>
        <Link to="/stats" className="transition-colors hover:text-bauhaus-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue">
          Statistik
        </Link>
        <Link to="/settings" className="transition-colors hover:text-bauhaus-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue">
          Pengaturan
        </Link>
      </div>
      <div className="hidden items-center gap-3 md:flex">
        {loading ? (
          <div className="h-8 w-20 animate-pulse border-2 border-bauhaus-black bg-bauhaus-muted" />
        ) : user ? (
          <div className="flex items-center gap-2">
            <Avatar photoURL={user.photoURL} displayName={user.displayName} email={user.email} size="sm" />
            <span className="hidden max-w-[120px] truncate text-[11px] font-bold uppercase tracking-widest xs:block">{user.displayName ?? user.email ?? (user.isAnonymous ? "Anonim" : "User")}</span>
          </div>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center justify-center border-2 border-bauhaus-black bg-white px-4 py-2 font-bold uppercase tracking-wider text-bauhaus-black shadow-bauhaus transition-all hover:bg-bauhaus-gray active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Login
          </Link>
        )}
        <Link
          to="/timer"
          className="inline-flex items-center justify-center border-2 border-bauhaus-black bg-bauhaus-red px-6 py-2 font-bold uppercase tracking-wider text-white shadow-bauhaus transition-all hover:bg-bauhaus-red/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Mulai
        </Link>
      </div>
      <div className="flex items-center gap-2 md:hidden">
        {loading ? (
          <div className="h-8 w-20 animate-pulse border-2 border-bauhaus-black bg-bauhaus-muted" />
        ) : user ? (
          <Link to="/settings" aria-label="Pengaturan akun" className="flex min-h-[44px] min-w-[44px] items-center justify-center p-1">
            <Avatar photoURL={user.photoURL} displayName={user.displayName} email={user.email} size="sm" />
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center justify-center border-2 border-bauhaus-black bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-bauhaus-black shadow-bauhaus transition-all hover:bg-bauhaus-gray active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
