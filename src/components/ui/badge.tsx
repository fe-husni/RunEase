import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border-2 font-bold uppercase tracking-widest text-xs px-3 py-1 rounded-full transition-colors",
  {
    variants: {
      variant: {
        red: "bg-bauhaus-red text-white border-bauhaus-black",
        blue: "bg-bauhaus-blue text-white border-bauhaus-black",
        yellow: "bg-bauhaus-yellow text-bauhaus-black border-bauhaus-black",
        outline: "bg-white text-bauhaus-black border-bauhaus-black",
        muted: "bg-bauhaus-muted text-bauhaus-black border-bauhaus-black",
      },
    },
    defaultVariants: {
      variant: "red",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
