/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-bold uppercase tracking-wider border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  {
    variants: {
      variant: {
        red: "bg-bauhaus-red text-white border-bauhaus-black shadow-bauhaus hover:bg-bauhaus-red/90",
        blue: "bg-bauhaus-blue text-white border-bauhaus-black shadow-bauhaus hover:bg-bauhaus-blue/90",
        yellow: "bg-bauhaus-yellow text-bauhaus-black border-bauhaus-black shadow-bauhaus hover:bg-bauhaus-yellow/90",
        outline: "bg-white text-bauhaus-black border-bauhaus-black shadow-bauhaus hover:bg-bauhaus-gray",
        ghost: "bg-transparent border-transparent shadow-none hover:bg-bauhaus-muted",
      },
      shape: {
        square: "rounded-none",
        pill: "rounded-full",
      },
      size: {
        sm: "px-4 py-2 text-xs",
        default: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base",
        icon: "h-10 w-10 p-0 sm:h-12 sm:w-12",
      },
    },
    defaultVariants: {
      variant: "red",
      shape: "square",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, shape, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant, shape, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
