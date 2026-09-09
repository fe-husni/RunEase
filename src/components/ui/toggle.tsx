import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label, className, disabled, ...props }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-bauhaus-black bg-white shadow-bauhaus-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bauhaus-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked && "bg-bauhaus-black",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full border-2 border-bauhaus-black bg-white shadow-sm transition-transform",
          checked ? "translate-x-6 bg-bauhaus-yellow" : "translate-x-0 bg-white"
        )}
      />
    </button>
  );
}
