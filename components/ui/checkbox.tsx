"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  subtle?: string;
};

export function Checkbox({ checked, onCheckedChange, label, subtle }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group flex w-full items-start gap-3 rounded-2xl border border-line bg-panel p-3 text-left transition-all duration-200 hover:bg-[#242a46]",
        checked && "border-success/40 bg-[hsl(var(--success)/0.06)]"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border border-line",
          checked ? "bg-success text-white" : "bg-[#1a2036] text-transparent"
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("text-sm text-ink", checked && "text-ink-subtle line-through")}>{label}</span>
        {subtle ? <span className="text-xs text-ink-subtle">{subtle}</span> : null}
      </span>
    </button>
  );
}
