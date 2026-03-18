import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-panel px-2.5 py-1 text-xs font-medium text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        className
      )}
    >
      {children}
    </span>
  );
}
