import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              "overflow-hidden border-4 border-bauhaus-black shadow-bauhaus transition-all",
              "rounded-none",
              isOpen ? "bg-white" : "bg-white"
            )}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className={cn(
                "flex min-h-[52px] w-full items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4 text-left text-sm sm:text-base font-black uppercase tracking-tight transition-colors",
                isOpen ? "bg-bauhaus-red text-white" : "bg-white text-bauhaus-black hover:bg-bauhaus-gray"
              )}
            >
              <span className="min-w-0 flex-1 break-words">{item.title}</span>
              <ChevronDown
                className={cn("h-5 w-5 shrink-0 transition-transform duration-300", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && (
              <div className="border-t-4 border-bauhaus-black bg-[#FFF9C4] px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium leading-relaxed text-bauhaus-black">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
