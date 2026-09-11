import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface BauhausSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Nama aksesibel (dibaca screen reader + dipakai listbox). */
  label: string;
}

/**
 * Dropdown Bauhaus pengganti `<select>` native.
 * List opsi native digambar OS/browser dan tidak bisa di-style —
 * komponen ini me-render list sendiri agar selaras (border tebal,
 * hard shadow, tanpa radius, highlight kuning khas).
 *
 * Keyboard: Panah Bawah membuka, Panah Atas/Bawah pindah opsi,
 * Enter/Spasi pilih, Esc tutup, Tab keluar menutup.
 */
export function BauhausSelect({ value, options, onChange, label }: BauhausSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listId = useId();
  const selectedIdx = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const selected = options[selectedIdx];

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Klik di luar menutup (tanpa memindah fokus)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open ]);

  // Saat dibuka, fokus ke opsi terpilih
  useEffect(() => {
    if (open) optionRefs.current[selectedIdx]?.focus();
  }, [open, selectedIdx]);

  const onOptionKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      optionRefs.current[(idx + 1) % options.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      optionRefs.current[(idx - 1 + options.length) % options.length]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[idx].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="flex min-h-[48px] w-full items-center justify-between gap-2 border-2 border-bauhaus-black bg-white px-3 sm:px-4 py-2 text-sm sm:text-base font-bold shadow-bauhaus-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue"
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-30 mt-1 border-4 border-bauhaus-black bg-white shadow-bauhaus"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                onClick={() => choose(o.value)}
                onKeyDown={(e) => onOptionKeyDown(e, i)}
                className={cn(
                  "flex min-h-[44px] cursor-pointer items-center justify-between gap-2 border-b-2 border-bauhaus-black/10 px-3 py-2 text-sm font-bold uppercase tracking-wide last:border-b-0 focus-visible:bg-bauhaus-gray focus-visible:outline-none",
                  isSelected ? "bg-bauhaus-yellow" : "bg-white hover:bg-bauhaus-gray"
                )}
              >
                <span className="truncate">{o.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
