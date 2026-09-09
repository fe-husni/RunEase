import { cn } from "@/lib/utils";

type AppLogoProps = {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  /** Untuk background gelap (footer hitam): invert mark hitam jadi putih. */
  dark?: boolean;
  className?: string;
};

const markSizes = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
} as const;

const textSizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
} as const;

export function AppLogo({ size = "md", withText = true, dark = false, className }: AppLogoProps) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <img
        src="/logo/logo-only.png"
        alt="Logo RunEase"
        width={268}
        height={179}
        draggable={false}
        className={cn(markSizes[size], "w-auto shrink-0", dark && "brightness-0 invert")}
      />
      {withText && (
        <span
          className={cn(
            "font-black uppercase tracking-tighter",
            textSizes[size],
            dark ? "text-white" : "text-bauhaus-black",
          )}
        >
          RunEase
        </span>
      )}
    </span>
  );
}
