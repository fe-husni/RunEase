import * as React from "react";
import { cn } from "@/lib/utils";

type DecoColor = "red" | "blue" | "yellow";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  deco?: DecoColor;
  decoShape?: "circle" | "square" | "triangle";
}

const decoColorMap: Record<DecoColor, string> = {
  red: "bg-bauhaus-red",
  blue: "bg-bauhaus-blue",
  yellow: "bg-bauhaus-yellow",
};

export function Card({ className, children, deco = "red", decoShape = "circle", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative border-2 sm:border-4 border-bauhaus-black bg-white p-4 sm:p-6 lg:p-8 shadow-bauhaus sm:shadow-bauhaus-lg transition-transform duration-200 motion-safe:sm:hover:-translate-y-1",
        "rounded-none",
        className
      )}
      {...props}
    >
      {/* Bauhaus deco — mandatory */}
      <div
        className={cn(
          "absolute -right-2 -top-2 h-3 w-3 border-2 border-bauhaus-black",
          decoColorMap[deco],
          decoShape === "circle" && "rounded-full",
          decoShape === "square" && "rounded-none",
          decoShape === "triangle" && "rounded-none [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"
        )}
        aria-hidden
      />
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-black uppercase tracking-tight text-xl", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("font-medium leading-relaxed", className)} {...props} />;
}
