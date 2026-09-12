import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/layout/reveal";
import { AppLogo } from "@/components/brand/app-logo";
import { DotGrid, DecoCircle, DecoSquare } from "@/components/geometric/deco";
import { Clock, Volume2, Smartphone, ArrowRight, Check, Zap, Trophy } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bauhaus-gray">
      {/* Hero - Split Bauhaus */}
      <section className="grid min-h-[85vh] grid-cols-1 border-b-4 border-bauhaus-black lg:grid-cols-2">
        {/* Left - White */}
        <div className="relative flex flex-col justify-center bg-white p-5 xs:p-8 sm:p-12 lg:p-16">
          <DotGrid />
          <div className="relative">
            <Badge variant="yellow" className="mb-4 whitespace-normal text-left">★ 4.9/5 • 2.000+ Pelari Pemula</Badge>
            <h1 className="font-black uppercase leading-[0.85] tracking-tighter text-balance text-4xl xs:text-5xl sm:text-6xl lg:text-7xl">
              STOP LIHAT <span className="text-bauhaus-red">JAM.</span>
              <br />
              MULAI LARI.
            </h1>
            <p className="mt-4 max-w-md text-sm sm:text-base font-medium leading-relaxed text-bauhaus-black/70"><span className="font-black text-bauhaus-black">Fokus saja pada langkah dan napasmu.</span> Biarkan timer pintar ini yang mengatur kapan kamu harus lari dan jalan santai.{" "}
            <span className="bg-bauhaus-yellow px-1 font-black"> Tetap menyala & bersuara meski HP dikantongi.</span>
            </p>
            <div className="mt-6 flex flex-col xs:flex-row xs:flex-wrap gap-2 sm:gap-3">
              <Link to="/timer" className="w-full xs:w-auto">
                <Button variant="red" shape="square" size="sm" className="min-h-[52px] w-full xs:w-auto justify-center lg:px-8 lg:py-4 lg:text-base">
                Mulai Lari Sekarang <ArrowRight className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" />
                </Button>
              </Link>
              <a href="#cara-kerja" className="w-full xs:w-auto">
                <Button variant="outline" shape="square" size="sm" className="min-h-[52px] w-full xs:w-auto justify-center lg:px-8 lg:py-4 lg:text-base">
                Pelajari Fiturnya
                </Button>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 sm:gap-3 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1 rounded-full border-2 border-bauhaus-black bg-bauhaus-gray px-3 py-1.5 min-h-[36px]">
                <Check className="h-4 w-4 shrink-0 text-bauhaus-red" /> Tanpa Ribet
              </span>
              <span className="flex items-center gap-1 rounded-full border-2 border-bauhaus-black bg-white px-3 py-1.5 min-h-[36px]">
                <Check className="h-4 w-4 shrink-0 text-bauhaus-blue" /> Langsung Jalan
              </span>
              <span className="flex items-center gap-1 rounded-full border-2 border-bauhaus-black bg-bauhaus-yellow px-3 py-1.5 min-h-[36px]">
                <Check className="h-4 w-4 shrink-0" /> 100% Gratis
              </span>
            </div>
          </div>
        </div>
        {/* Right - Blue Geometric + Real Image */}
        <div className="relative flex min-h-[500px] items-center justify-center overflow-hidden border-t-4 border-bauhaus-black bg-bauhaus-blue p-6 lg:border-l-4 lg:border-t-0">
          <DotGrid />
          <div className="absolute h-48 w-48 rounded-full border-4 border-white/20 bg-white/10" />
          <div className="absolute h-32 w-32 rotate-45 border-4 border-bauhaus-black bg-bauhaus-yellow shadow-bauhaus" />
          <DecoCircle className="absolute left-8 top-8 opacity-30" size={24} />
          {/* Real running image - Bauhaus */}
          <img
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=60"
            alt="Pelari wanita tersenyum di lintasan pagi"
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-bauhaus-blue/30" />
          <Card deco="red" className="relative w-64 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-bauhaus-black bg-bauhaus-red text-white">
              <Clock className="h-6 w-6" />
            </div>
            <div className="mt-3 font-black tabular-nums text-4xl tracking-tighter">02:00</div>
            <Badge variant="red" className="mt-2">LARI</Badge>
            <div className="mt-3 h-2 w-full border-2 border-bauhaus-black bg-bauhaus-gray">
              <div className="h-full w-[65%] bg-bauhaus-red" />
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest opacity-60">Set 3 • Berikutnya Jalan 1:00</p>
          </Card>
          <div className="absolute bottom-4 left-4 hidden items-center gap-2 border-2 border-bauhaus-black bg-white px-3 py-2 shadow-bauhaus-sm sm:flex">
            <img
              src="https://images.unsplash.com/photo-1486218119243-13883505764c?w=100&auto=format&fit=crop&q=60"
              alt="Sepatu lari di aspal"
              loading="lazy"
              className="h-8 w-8 rounded-full border-2 border-bauhaus-black object-cover"
            />
            <span className="text-xs font-black uppercase">Run Walk • Anti Cedera</span>
          </div>
        </div>
      </section>

      {/* Social Proof - Yellow */}
      <Section color="yellow">
        <Reveal>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-0 border-0 sm:border-4 sm:border-bauhaus-black bg-transparent sm:bg-white sm:shadow-none shadow-none p-0 sm:p-0">
          {[
            { value: "Tanpa Install", label: "Akses langsung dari browser, hemat memori HP." },
            { value: "Anti-Mati", label: "Alarm tetap bunyi meski layar HP dimatikan." },
            { value: "Siap Pakai", label: "Ada 5 Preset (Pola Lari) khusus pemula hingga pro." },
            { value: "12 Medali", label: "Kumpulkan lencana setiap pencapaian larimu." },
          ].map((s) => (
            <div key={s.label} className="border-2 border-bauhaus-black bg-white p-4 text-center shadow-bauhaus-sm sm:border-0 sm:border-r-2 sm:shadow-none sm:last:border-r-0">
              <div className="font-black text-xl sm:text-3xl break-words leading-tight">{s.value}</div>
              <div className="mt-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>
        </Reveal>
        <p className="mt-3 text-center text-[11px] sm:text-xs font-bold uppercase tracking-widest opacity-60 px-2">Dipakai pelari pemula yang dulu kapok, sekarang ketagihan</p>
      </Section>

      {/* Features - White + Real Images */}
      <Section color="white">
        <div className="text-center px-2">
          <Badge variant="blue">Kenapa Harus RunEase?</Badge>
          <h2 className="mx-auto mt-3 max-w-2xl font-black uppercase leading-[0.9] tracking-tighter text-balance text-2xl xs:text-3xl sm:text-4xl">BEDA DARI TIMER HP BIASA</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base font-medium opacity-70">
            Timer HP cuma hitung mundur. <span className="font-black">RunEase paham pelari:</span> kapan harus lari, kapan jalan, kapan istirahat.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Gak Perlu Bolak-Balik Liat HP",
              desc: "Timer otomatis mengulang fase Lari dan Jalan sesuai aturamu. Panduan suara dan getaran akan memberitahu kapan harus ganti fase.",
              color: "red" as const,
              img: "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=600&auto=format&fit=crop&q=60",
              alt: "Pelari mengatur napas di lintasan",
            },
            {
              icon: Volume2,
              title: "Aman Ditaruh di Kantong",
              desc: "Tidak seperti timer biasa yang mati saat layar terkunci. RunEase akan terus mengawalmu dari awal hingga pendinginan selesai.",
              color: "blue" as const,
              img: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&auto=format&fit=crop&q=60",
              alt: "Pelari wanita dengan earphone fokus",
            },
            {
              icon: Smartphone,
              title: "Metode Lari Tanpa Cedera",
              desc: "Dirancang khusus untuk metode Run-Walk. Olahraga jadi lebih ringan, jantung lebih sehat, tanpa ngos-ngosan berlebih.",
              color: "yellow" as const,
              img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=60",
              alt: "Pelari mengecek jam di pergelangan tangan",
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80}>
            <Card deco={f.color} className="overflow-hidden p-0 text-center">
              <div className="h-48 overflow-hidden border-b-4 border-bauhaus-black">
                <img src={f.img} alt={f.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <div className="p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center border-2 border-bauhaus-black bg-white shadow-bauhaus-sm">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 font-black uppercase tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm font-medium opacity-70">{f.desc}</p>
              </div>
            </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Gallery - Bauhaus Image Grid */}
      <Section color="gray">
        <div className="text-center px-2">
          <Badge variant="red">Di Lapangan</Badge>
          <h2 className="mt-3 font-black uppercase tracking-tight text-balance text-xl xs:text-2xl">BUKAN TEORI, SUDAH DICOBA</h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal>
          <div className="group relative overflow-hidden border-4 border-bauhaus-black shadow-bauhaus">
            <img
              src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&auto=format&fit=crop&q=60"
              alt="Pelari pria di jalan kota pagi hari"
              loading="lazy"
              className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 border-t-4 border-bauhaus-black bg-white p-3">
              <p className="font-black uppercase tracking-tight text-sm">Jam 6 Pagi • Tetap Semangat</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Streak 7 hari terjaga</p>
            </div>
          </div>
          </Reveal>
          <Reveal delay={80}>
          <div className="group relative overflow-hidden border-4 border-bauhaus-black shadow-bauhaus sm:translate-y-4">
            <img
              src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&auto=format&fit=crop&q=60"
              alt="Komunitas lari bersama di taman"
              loading="lazy"
              className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 border-t-4 border-bauhaus-black bg-bauhaus-yellow p-3">
              <p className="font-black uppercase tracking-tight text-sm">Lari Bareng Lebih Seru</p>
              <p className="text-xs font-bold uppercase tracking-widest">Gratis</p>
            </div>
          </div>
          </Reveal>
          <Reveal delay={160}>
          <div className="group relative overflow-hidden border-4 border-bauhaus-black shadow-bauhaus">
            <img
              src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=60"
              alt="Pelari wanita di taman hijau"
              loading="lazy"
              className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 border-t-4 border-bauhaus-black bg-bauhaus-blue p-3 text-white">
              <p className="font-black uppercase tracking-tight text-sm">Recovery Walk Itu Penting</p>
              <p className="text-xs font-bold uppercase tracking-widest">Jalan bukan kalah, tapi strategi</p>
            </div>
          </div>
          </Reveal>
        </div>
      </Section>

      {/* How it Works - Red */}
      <Section color="red">
        <div id="cara-kerja" className="text-center text-white px-2">
          <Badge variant="yellow">Cara Kerja</Badge>
          <h2 className="mt-3 font-black uppercase tracking-tighter text-balance text-2xl xs:text-3xl sm:text-4xl">Dirancang Agar Kamu Tidak Mudah Menyerah</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm sm:text-base font-medium opacity-90">Baru mulai rutin olahraga? Jangan paksakan diri. Gunakan fitur Preset Pemula untuk kombinasi jalan dan lari yang paling nyaman untuk tubuhmu. Pelan-pelan, dari pelari biasa sampe jadi pelari kalcer 😂</p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              n: "01",
              t: "Pilih Atau Atur",
              d: "Pemula? Pilih 1:2 (1 menit lari, 2 menit jalan). Sudah kuat? Custom 5:1.",
              img: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=400&auto=format&fit=crop&q=60",
              alt: "Memilih preset di HP",
            },
            {
              n: "02",
              t: "Tekan Mulai & Lupakan HP",
              d: "Masukkan HP ke saku. Getar & suara yang ingatkan kapan lari & jalan.",
              img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60",
              alt: "Pelari mulai lari dengan HP di saku",
            },
            {
              n: "03",
              t: "Klaim Badge & Streak",
              d: "Selesai ≥10 menit = streak +1. Kumpulkan 12 badge, naik level.",
              img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&auto=format&fit=crop&q=60",
              alt: "Perayaan setelah lari selesai",
            },
          ].map((s, i) => (
            <Reveal key={s.n} delay={(i % 3) * 80}>
            <div className="relative overflow-hidden border-4 border-bauhaus-black bg-white text-bauhaus-black shadow-bauhaus-lg">
              <div className="h-40 overflow-hidden border-b-4 border-bauhaus-black">
                <img src={s.img} alt={s.alt} loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-105" />
              </div>
              <div className="p-6">
                <div className="absolute -left-3 -top-3 flex h-10 w-10 rotate-3 items-center justify-center border-2 border-bauhaus-black bg-bauhaus-yellow font-black shadow-bauhaus-sm">
                  {s.n}
                </div>
                <h3 className="mt-2 font-black uppercase tracking-tight">{s.t}</h3>
                <p className="mt-1 text-sm font-medium opacity-70">{s.d}</p>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Gamifikasi - White + Image */}
      <Section color="white">
        <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2">
          <Reveal>
          <div className="min-w-0">
            <Badge variant="red">Kenapa Ketagihan?</Badge>
            <h2 className="mt-3 font-black uppercase leading-[0.9] tracking-tighter text-balance text-2xl xs:text-3xl sm:text-4xl">
            Lari Jadi Tantangan Paling Seru
            </h2>
            <p className="mt-3 text-sm sm:text-base font-medium opacity-70">
            Jangan biarkan rutinitasmu bolong! Jaga kobaran api Streak harianmu, kumpulkan XP, naikkan level, dan pamerkan lencana pencapaianmu. Hari ini rebahan? Maaf, XP menunggu!
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-bauhaus-black bg-bauhaus-yellow px-3 py-1.5 min-h-[36px] flex items-center text-[11px] sm:text-xs font-black uppercase">🔥 Streak 7 → Badge</span>
              <span className="rounded-full border-2 border-bauhaus-black bg-white px-3 py-1.5 min-h-[36px] flex items-center text-[11px] sm:text-xs font-black uppercase">+55 XP / Sesi</span>
            </div>
            <div className="mt-6 overflow-hidden border-2 sm:border-4 border-bauhaus-black shadow-bauhaus">
              <img
                src="https://images.unsplash.com/photo-1502904550040-7534597429ae?w=600&auto=format&fit=crop&q=60"
                alt="Perayaan finis lari dengan medali"
                loading="lazy"
                className="h-40 xs:h-48 w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          </div>
          </Reveal>
          <Reveal delay={120}>
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 sm:gap-3">
            {[
              { name: "Langkah Pertama", sub: "Sesi 1" },
              { name: "Konsisten 7", sub: "7 hari" },
              { name: "Marathon Mini", sub: "60 menit" },
              { name: "Early Bird", sub: "05-07" },
              { name: "Veteran", sub: "500 menit" },
              { name: "Legenda", sub: "Level 10" },
            ].map((b, i) => (
              <div key={b.name} className={`border-2 border-bauhaus-black p-3 text-center shadow-bauhaus-sm ${i % 3 === 0 ? "bg-bauhaus-yellow" : i % 3 === 1 ? "bg-bauhaus-red text-white" : "bg-white"}`}>
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 border-bauhaus-black bg-white">
                  <Trophy className="h-4 w-4 text-bauhaus-black" />
                </div>
                <div className="mt-1 text-xs font-black uppercase leading-tight">{b.name}</div>
                <div className="text-[10px] font-bold opacity-60">{b.sub}</div>
              </div>
            ))}
          </div>
          </Reveal>
        </div>
      </Section>

      {/* Final CTA - Yellow */}
      <Section color="yellow">
        <Reveal>
        <div className="relative overflow-hidden border-2 sm:border-4 border-bauhaus-black bg-white p-5 xs:p-8 text-center shadow-bauhaus sm:p-12">
          <DecoSquare className="absolute -right-6 -top-6 opacity-10" size={80} rotate />
          <DecoCircle className="absolute -bottom-6 -left-6 opacity-10" size={80} />
          <Badge variant="red" className="mx-auto">100% Gratis</Badge>
          <h2 className="mx-auto mt-3 max-w-xl font-black uppercase leading-[0.9] tracking-tighter text-balance text-2xl xs:text-3xl sm:text-5xl">SIAP JADI VERSI TERBAIKMU?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm sm:text-base font-medium opacity-70">
            Ratusan langkah besar dimulai dari satu langkah kecil hari ini. Yuk, mulai rutinitas sehatmu tanpa ribet.
          </p>
          <div className="mt-6 flex flex-col xs:flex-row justify-center gap-2 sm:gap-3">
            <Link to="/timer" className="w-full xs:w-auto">
              <Button variant="red" shape="square" size="sm" className="min-h-[52px] w-full xs:w-auto justify-center lg:px-8 lg:py-4 lg:text-base">
                Buka Timer Sekarang <ArrowRight className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" />
              </Button>
            </Link>
            <Link to="/login" className="w-full xs:w-auto">
              <Button variant="outline" shape="square" size="sm" className="min-h-[52px] w-full xs:w-auto justify-center lg:px-8 lg:py-4 lg:text-base">
                Simpan Progres
              </Button>
            </Link>
          </div>
        </div>
        </Reveal>
      </Section>

      {/* Footer */}
      <footer className="border-b-4 border-bauhaus-black bg-bauhaus-black px-4 py-8 text-center text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AppLogo dark className="justify-center" />
          <p className="mt-2 text-sm opacity-60">© 2026 RunEase — Developed by Husni Mubarok</p>
        </div>
      </footer>
    </div>
  );
}
