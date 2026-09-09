/* eslint-disable react-refresh/only-export-components */
import { cn } from "@/lib/utils";
import type { PresetDoc } from "@/types/preset";

interface Props {
  presets: PresetDoc[];
  activeId: string | null;
  onSelect: (p: PresetDoc) => void;
  customConfig?: { runSec: number; walkSec: number };
}

export function PresetChips({ presets, activeId, onSelect, customConfig }: Props) {
  const customActive = activeId === "custom";
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto border-b-4 border-bauhaus-black px-4 py-3">
      {presets.map((p) => {
        const isActive = p.id === activeId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={cn(
              "shrink-0 rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-widest shadow-bauhaus-sm transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
              isActive
                ? p.color === "red"
                  ? "border-bauhaus-black bg-bauhaus-red text-white"
                  : p.color === "blue"
                    ? "border-bauhaus-black bg-bauhaus-blue text-white"
                    : "border-bauhaus-black bg-bauhaus-yellow text-bauhaus-black"
                : "border-bauhaus-black bg-white text-bauhaus-black hover:bg-bauhaus-gray"
            )}
          >
            {p.name} • {Math.floor(p.runSec / 60)}:{String(p.runSec % 60).padStart(2, "0")} / {Math.floor(p.walkSec / 60)}:{String(p.walkSec % 60).padStart(2, "0")}
          </button>
        );
      })}
      {/* Custom tab - aktif saat manual edit */}
      <button
        onClick={() => {
          // jika sudah custom, tidak perlu apa-apa, jika belum, biarkan timer.tsx handle via setActive
          if (!customActive && customConfig) {
            // trigger custom selection via fake preset
            onSelect({
              id: "custom",
              name: "Custom",
              runSec: customConfig.runSec,
              walkSec: customConfig.walkSec,
              warmupSec: 0,
              cooldownSec: 0,
              mode: "infinite",
              soundId: "beep",
              icon: "square",
              color: "yellow",
              isBuiltIn: false,
            } as PresetDoc);
          }
        }}
        className={cn(
          "shrink-0 rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-widest shadow-bauhaus-sm transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
          customActive
            ? "border-bauhaus-black bg-bauhaus-black text-white"
            : "border-dashed border-bauhaus-black bg-bauhaus-gray text-bauhaus-black hover:bg-white"
        )}
      >
        Custom{customConfig ? ` • ${Math.floor(customConfig.runSec / 60)}:${String(customConfig.runSec % 60).padStart(2, "0")} / ${Math.floor(customConfig.walkSec / 60)}:${String(customConfig.walkSec % 60).padStart(2, "0")}` : ""}
      </button>
    </div>
  );
}

// Helper to get builtin presets
export const builtinPresets: PresetDoc[] = [
  { id: "builtin_1_2", name: "Pemula 1:2", runSec: 60, walkSec: 120, warmupSec: 0, cooldownSec: 0, mode: "infinite", soundId: "beep", icon: "circle", color: "yellow", isBuiltIn: true },
  { id: "builtin_2_1", name: "Seimbang 2:1", runSec: 120, walkSec: 60, warmupSec: 0, cooldownSec: 0, mode: "infinite", soundId: "beep", icon: "square", color: "blue", isBuiltIn: true },
  { id: "builtin_4_1", name: "Galloway 4:1", runSec: 240, walkSec: 60, warmupSec: 0, cooldownSec: 0, mode: "infinite", soundId: "beep", icon: "triangle", color: "red", isBuiltIn: true },
  { id: "builtin_5_1", name: "Pro 5:1", runSec: 300, walkSec: 60, warmupSec: 0, cooldownSec: 0, mode: "infinite", soundId: "beep", icon: "square", color: "red", isBuiltIn: true },
  { id: "builtin_sprint", name: "Sprint 0:30", runSec: 30, walkSec: 30, warmupSec: 0, cooldownSec: 0, mode: "infinite", soundId: "beep", icon: "circle", color: "yellow", isBuiltIn: true },
];
