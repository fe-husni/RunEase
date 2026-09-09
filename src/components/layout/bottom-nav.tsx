import { NavLink } from "react-router-dom";
import { Clock, History, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/timer", icon: Clock, label: "Timer" },
  { to: "/history", icon: History, label: "Riwayat" },
  { to: "/stats", icon: BarChart3, label: "Statistik" },
  { to: "/settings", icon: Settings, label: "Pengaturan" },
];

export function BottomNav() {
  return (
    <nav aria-label="Navigasi bawah" className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t-4 border-bauhaus-black bg-white py-2 sm:hidden">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue",
              isActive
                ? "rounded-full border-2 border-bauhaus-black bg-bauhaus-black text-white"
                : "text-bauhaus-black"
            )
          }
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
