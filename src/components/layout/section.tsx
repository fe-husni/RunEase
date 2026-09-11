import * as React from "react";
import { cn } from "@/lib/utils";

type SectionColor = "gray" | "blue" | "yellow" | "red" | "black" | "white";

const colorMap: Record<SectionColor, string> = {
  gray: "bg-bauhaus-gray text-bauhaus-black",
  white: "bg-white text-bauhaus-black",
  blue: "bg-bauhaus-blue text-white",
  yellow: "bg-bauhaus-yellow text-bauhaus-black",
  red: "bg-bauhaus-red text-white",
  black: "bg-bauhaus-black text-white",
};

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  color?: SectionColor;
}

export function Section({ color = "gray", className, children, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b-4 border-bauhaus-black px-4 py-10 xs:py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24",
        colorMap[color],
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}
