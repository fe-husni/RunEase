import { cn } from "@/lib/utils";

export function DecoCircle({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn("rounded-full border-2 border-bauhaus-black bg-bauhaus-red", className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export function DecoSquare({
  className,
  size = 32,
  rotate = false,
}: {
  className?: string;
  size?: number;
  rotate?: boolean;
}) {
  return (
    <div
      className={cn("border-2 border-bauhaus-black bg-bauhaus-blue", rotate && "rotate-45", className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export function DecoTriangle({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn("border-l-transparent border-r-transparent border-b-bauhaus-yellow", className)}
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size / 2,
        borderRightWidth: size / 2,
        borderBottomWidth: size,
      }}
      aria-hidden
    />
  );
}

export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 opacity-[0.05]", className)}
      style={{
        backgroundImage: "radial-gradient(#121212 1.5px, transparent 1.5px)",
        backgroundSize: "20px 20px",
      }}
      aria-hidden
    />
  );
}
