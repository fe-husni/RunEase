import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, Share } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function InstallBanner() {
  const { isIOS, shouldShowBanner, prompt, dismiss } = usePWAInstall();

  if (!shouldShowBanner) return null;

  return (
    <Card deco="yellow" className="relative w-full p-3 sm:p-4">
      <button
        onClick={dismiss}
        aria-label="Tutup banner install"
        className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center border-2 border-bauhaus-black bg-white text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col xs:flex-row gap-3 pr-10 xs:pr-8">
        <div className="hidden h-12 w-12 shrink-0 items-center justify-center border-2 border-bauhaus-black bg-bauhaus-blue text-white shadow-bauhaus-sm sm:flex">
          <Download className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-black uppercase tracking-tight text-sm sm:text-base">Install RunEase</div>
          {isIOS ? (
            <p className="mt-1 text-sm font-medium leading-relaxed">
              Buka di Safari → tap <Share className="inline h-3 w-3" /> Share → <span className="font-black">Add to Home Screen</span> untuk timer tetap jalan saat layar kunci.
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium leading-relaxed">Install sebagai app agar alarm & getar tetap jalan saat layar terkunci. 1 klik, tanpa Play Store.</p>
          )}
          <div className="mt-3 grid grid-cols-1 xs:flex gap-2">
            {!isIOS && (
              <Button variant="blue" size="sm" shape="square" className="w-full xs:w-auto" onClick={prompt}>
                <Download className="mr-1 h-4 w-4" /> Install Sekarang
              </Button>
            )}
            <Button variant="ghost" size="sm" className="w-full xs:w-auto" onClick={dismiss}>
              Nanti
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
