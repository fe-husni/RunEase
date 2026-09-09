import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  valueSec: number;
  onChange: (sec: number) => void;
  disabled?: boolean;
  color?: "red" | "blue" | "yellow";
}

function secToMmSs(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return { m: String(m).padStart(2, "0"), s: String(s).padStart(2, "0") };
}

export function TimeInput({ label, valueSec, onChange, disabled, color = "red" }: Props) {
  const { m, s } = secToMmSs(valueSec);
  const [mm, setMm] = useState(m);
  const [ss, setSs] = useState(s);

  useEffect(() => {
    const { m: nm, s: ns } = secToMmSs(valueSec);
    setMm(nm);
    setSs(ns);
  }, [valueSec]);

  const commit = (newMm: string, newSs: string) => {
    const mNum = parseInt(newMm, 10) || 0;
    const sNum = parseInt(newSs, 10) || 0;
    const total = Math.max(10, Math.min(600, mNum * 60 + sNum));
    onChange(total);
  };

  const borderColor = color === "red" ? "border-bauhaus-red" : color === "blue" ? "border-bauhaus-blue" : "border-bauhaus-yellow";

  return (
    <div className={cn("min-w-0 border-4 border-bauhaus-black bg-white p-3 shadow-bauhaus sm:p-4", disabled && "opacity-50")}>
      <div className="mb-2 text-center text-xs font-black uppercase tracking-widest">{label}</div>
      <div className="flex items-center justify-center gap-1">
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          value={mm}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 2);
            setMm(v);
          }}
          onBlur={() => commit(mm || "0", ss || "0")}
          className={cn("h-14 min-w-0 flex-1 px-1 text-center font-black text-2xl tabular-nums sm:h-16 sm:px-2 sm:text-3xl", borderColor)}
          aria-label={`${label} menit`}
        />
        <span aria-hidden className="shrink-0 font-black text-2xl">:</span>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          value={ss}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 2);
            // clamp 0-59
            const n = parseInt(v, 10);
            if (!isNaN(n) && n > 59) setSs("59");
            else setSs(v);
          }}
          onBlur={() => commit(mm || "0", ss || "0")}
          className={cn("h-14 min-w-0 flex-1 px-1 text-center font-black text-2xl tabular-nums sm:h-16 sm:px-2 sm:text-3xl", borderColor)}
          aria-label={`${label} detik`}
        />
      </div>
      <div className="mt-2 text-center text-xs font-bold uppercase tracking-widest opacity-60">{valueSec}s</div>
    </div>
  );
}
