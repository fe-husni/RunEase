import { useState } from "react";
import { cn } from "@/lib/utils";

function getInitial(nameOrEmail: string | null | undefined): string {
  const s = (nameOrEmail ?? "").trim();
  if (!s) return "?";
  // take first letter of first word
  const first = s.split(" ")[0] ?? s;
  return first[0]?.toUpperCase() ?? "?";
}

function getColorClass(seed: string): string {
  // deterministic color based on string hash -> red/blue/yellow
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const colors = ["bg-bauhaus-red text-white", "bg-bauhaus-blue text-white", "bg-bauhaus-yellow text-bauhaus-black"] as const;
  return colors[hash % colors.length];
}

interface AvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export function Avatar({ photoURL, displayName, email, size = "md", className }: AvatarProps) {
  const [error, setError] = useState(false);
  const seed = displayName ?? email ?? "User";
  const initial = getInitial(displayName ?? email);
  const color = getColorClass(seed);
  const sizeCls = sizeMap[size];
  const showImage = !!photoURL && !error;

  if (showImage) {
    return (
      <img
        src={photoURL!}
        alt={displayName ?? email ?? "avatar"}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className={cn("rounded-full border-2 border-bauhaus-black object-cover", sizeCls, className)}
      />
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center rounded-full border-2 border-bauhaus-black font-black uppercase", color, sizeCls, className)}
      aria-label={seed}
      title={seed}
    >
      {initial}
    </div>
  );
}
