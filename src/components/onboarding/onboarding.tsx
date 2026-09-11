import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DotGrid, DecoCircle, DecoSquare } from "@/components/geometric/deco";
import { AppLogo } from "@/components/brand/app-logo";
import { Clock, Volume2, Bell, ShieldCheck, ChevronRight, X } from "lucide-react";

const slides = [
  {
    color: "blue" as const,
    badge: "Bauhaus • Run Walk",
    title: "LARI\nLEBIH\nJAUH",
    subtitle: "Metode Jeff Galloway — interval Lari & Jalan tanpa lihat jam.",
    bullets: ["Atur 2:00 / 1:00 sesukamu", "Alarm + getar otomatis", "Tetap jalan saat layar kunci"],
  },
  {
    color: "yellow" as const,
    badge: "Suara & Getar",
    title: "DENGAR\n& RASAKAN",
    subtitle: "Alarm keras + getar beda untuk Lari vs Jalan. Voice coach opsi.",
    bullets: ["Test suara di Pengaturan", "Volume & nada pilih", "iOS: pakai earphone"],
  },
  {
    color: "red" as const,
    badge: "PWA • Offline",
    title: "INSTAL\n& LARI",
    subtitle: "Install sebagai app, timer tetap jalan offline & sinkron cloud.",
    bullets: ["Add to Home Screen", "Login Google untuk streak", "Export/Import JSON"],
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [permStatus, setPermStatus] = useState<string>("");

  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  const handleNext = async () => {
    if (!isLast) {
      setIdx((v) => v + 1);
      return;
    }
    // last slide: request permissions
    let msg = "";
    try {
      if ("Notification" in window && Notification.permission === "default") {
        const res = await Notification.requestPermission();
        msg += `Notifikasi: ${res}. `;
      }
    } catch {
      msg += "Notifikasi gagal. ";
    }
    try {
      // trigger AudioContext resume (need user gesture)
      const { ensureAudio } = await import("@/lib/audio");
      await ensureAudio();
      msg += "Audio siap.";
    } catch {
      msg += "Audio siap.";
    }
    setPermStatus(msg);
    setTimeout(() => {
      localStorage.setItem("runease:hasSeenOnboarding", "1");
      onDone();
    }, 600);
  };

  const handleSkip = () => {
    localStorage.setItem("runease:hasSeenOnboarding", "1");
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-bauhaus-gray">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b-4 border-bauhaus-black bg-white px-4">
        <AppLogo size="sm" />
        <Button variant="ghost" size="sm" onClick={handleSkip} className="rounded-none min-h-[44px]">
          <X className="mr-1 h-4 w-4" /> Lewati
        </Button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 border-b-4 border-bauhaus-black bg-bauhaus-gray py-3">
        {slides.map((_, i) => (
          <div key={i} className={`h-2 w-8 border-2 border-bauhaus-black transition-colors ${i === idx ? "bg-bauhaus-red" : i < idx ? "bg-bauhaus-black" : "bg-white"}`} />
        ))}
      </div>

      {/* Slide */}
      <div className={`relative flex flex-1 flex-col overflow-hidden border-b-4 border-bauhaus-black ${slide.color === "blue" ? "bg-bauhaus-blue text-white" : slide.color === "yellow" ? "bg-bauhaus-yellow text-bauhaus-black" : "bg-bauhaus-red text-white"}`}>
        <DotGrid />
        {/* deco */}
        <DecoCircle className="absolute right-6 top-6 opacity-20" size={48} />
        <DecoSquare className="absolute bottom-10 left-6 opacity-20" size={40} rotate />
        <div className="absolute bottom-6 right-6 h-16 w-16 rounded-full border-4 border-white/20 bg-white/10" />

        <div className="relative flex flex-1 min-h-0 flex-col justify-center overflow-y-auto p-4 sm:p-8">
          <Badge variant={slide.color === "yellow" ? "outline" : "yellow"} className="w-fit">
            {slide.badge}
          </Badge>
          <h1 className="mt-4 whitespace-pre-line font-black uppercase leading-[0.85] tracking-tighter text-4xl xs:text-5xl sm:text-6xl">{slide.title}</h1>
          <p className="mt-3 max-w-md text-sm sm:text-base font-medium leading-relaxed opacity-90">{slide.subtitle}</p>

          <Card deco={slide.color === "blue" ? "yellow" : slide.color === "yellow" ? "red" : "blue"} className="mt-6 max-w-md p-3 sm:p-4">
            <ul className="space-y-2">
              {slide.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm font-bold">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-bauhaus-black bg-bauhaus-yellow">
                    <ShieldCheck className="h-3 w-3 text-bauhaus-black" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </Card>

          {idx === 1 && (
            <div className="mt-4 flex gap-2">
              <span className="flex items-center gap-1 rounded-full border-2 border-white/30 bg-white/10 px-3 py-1 text-xs font-bold">
                <Volume2 className="h-3 w-3" /> Beep
              </span>
              <span className="flex items-center gap-1 rounded-full border-2 border-white/30 bg-white/10 px-3 py-1 text-xs font-bold">
                <Bell className="h-3 w-3" /> Bell
              </span>
              <span className="flex items-center gap-1 rounded-full border-2 border-white/30 bg-white/10 px-3 py-1 text-xs font-bold">
                <Clock className="h-3 w-3" /> Voice
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {permStatus && <p className="mb-2 text-center text-xs font-bold opacity-60 break-words">{permStatus}</p>}
        <div className="flex flex-col xs:flex-row gap-2">
          {idx > 0 && (
            <Button variant="outline" shape="square" className="min-h-[52px] w-full flex-1" onClick={() => setIdx((v) => v - 1)}>
              Kembali
            </Button>
          )}
          <Button variant={isLast ? "red" : "blue"} shape="square" className="min-h-[52px] w-full flex-1" onClick={handleNext}>
            {isLast ? "Mulai Lari" : "Lanjut"} <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs font-medium opacity-50">Geser atau klik Lanjut • Form Follows Function</p>
      </div>
    </div>
  );
}
