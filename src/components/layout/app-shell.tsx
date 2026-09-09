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
      <div className="mx-auto max-w-md px-4 pt-4 sm:max-w-7xl">
        <InstallBanner />
      </div>
      <main id="konten" className="mx-auto max-w-md px-4 pb-20 pt-4 sm:pb-4 sm:max-w-7xl">{children}</main>
      <BottomNav />
    </div>
  );
}
