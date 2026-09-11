import { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { BottomNav } from "./bottom-nav";
import { InstallBanner } from "@/components/pwa/install-banner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bauhaus-gray">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:border-4 focus:border-bauhaus-black focus:bg-bauhaus-yellow focus:px-4 focus:py-2 focus:font-black focus:uppercase"
      >
        Lewati ke konten
      </a>
      <TopNav />
      <div className="container-app pt-3 sm:pt-4">
        <InstallBanner />
      </div>
      <main id="konten" className="container-app pb-28 pt-3 sm:pb-12 sm:pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
