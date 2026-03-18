"use client";

import { Activity, BookOpenText, CalendarDays, CheckCircle2, Cpu, Sparkles, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export type RailSection = "overview" | "planner" | "execution" | "goals" | "operating" | "journal";

const railItems: { label: string; icon: typeof Activity; id: RailSection }[] = [
  { label: "Overview", icon: Activity, id: "overview" },
  { label: "Planner", icon: CalendarDays, id: "planner" },
  { label: "Execution", icon: CheckCircle2, id: "execution" },
  { label: "Goals", icon: Target, id: "goals" },
  { label: "Operating", icon: Cpu, id: "operating" },
  { label: "Journal", icon: BookOpenText, id: "journal" }
];

type CommandRailProps = {
  activeSection: RailSection;
  onSelect?: (section: RailSection) => void;
  mode?: "dashboard" | "operating";
};

export function CommandRail({ activeSection, onSelect, mode = "dashboard" }: CommandRailProps) {
  const router = useRouter();

  function handleClick(section: RailSection) {
    if (mode === "dashboard") {
      if (section === "operating") {
        router.push("/operating");
        return;
      }
      onSelect?.(section);
      return;
    }

    if (section === "operating") {
      return;
    }
    router.push(`/dashboard#section-${section}`);
  }

  return (
    <aside className="tech-card sticky top-6 hidden h-fit rounded-3xl border border-line p-4 lg:block">
      <div className="mb-5 flex items-center gap-2 px-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent-cyan))]" />
        <p className="text-xs uppercase tracking-[0.22em] text-ink-subtle">Command Rail</p>
      </div>
      <div className="space-y-1">
        {railItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleClick(item.id)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200 ${
              activeSection === item.id
                ? "border-[rgba(115,151,255,0.55)] bg-[linear-gradient(90deg,rgba(56,126,255,0.36),rgba(156,94,255,0.3))] text-ink shadow-[0_8px_24px_rgba(33,72,170,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
                : "border-line bg-panel/55 text-ink-subtle shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-[1px] hover:border-[rgba(124,145,212,0.5)] hover:bg-[#242a46] hover:text-ink"
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-line bg-panel p-3">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-ink-subtle">
          <Sparkles className="h-3.5 w-3.5" />
          Focus mode
        </div>
        <p className="text-sm text-ink-subtle">One system. One plan. One honest execution loop.</p>
      </div>
    </aside>
  );
}
