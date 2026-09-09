import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex w-full border-2 border-bauhaus-black bg-white px-4 py-3 font-medium shadow-bauhaus-sm transition-all placeholder:text-bauhaus-black/50 focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-bauhaus focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "rounded-none",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
