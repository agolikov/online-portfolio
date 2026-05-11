import posthog from "posthog-js";
import type { Tech, Experience } from "@/types/portfolio";
import { X } from "lucide-react";
import { yearsForTech, formatYears } from "@/lib/techYears";

interface Props {
  tech: Tech[];
  experience: Experience[];
  selected: string[];
  onToggle: (name: string) => void;
  onClear: () => void;
}

export function TechFilter({ tech, experience, selected, onToggle, onClear }: Props) {
  const grouped = tech.reduce<Record<string, Tech[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  return (
    <section className="paper rule animate-fade-in px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">Tech</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Click to filter experience &amp; projects. Multiple = OR. Numbers = years used.
          </p>
        </div>
        {selected.length > 0 && (
          <button
            onClick={() => {
              posthog.capture("tech_filter_cleared", { cleared_count: selected.length, cleared_tech: selected });
              onClear();
            }}
            className="chip flex items-center gap-1.5"
          >
            <X size={12} /> Clear ({selected.length})
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="grid gap-2 sm:grid-cols-[7.5rem_1fr] sm:items-start">
            <span className="pt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {cat}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {items.map((t) => {
                const y = yearsForTech(t.name, experience);
                return (
                  <button
                    key={t.name}
                    onClick={() => {
                      posthog.capture("tech_filter_applied", {
                        tech: t.name,
                        category: t.category,
                        action: selected.includes(t.name) ? "removed" : "added",
                      });
                      onToggle(t.name);
                    }}
                    className="chip"
                    data-active={selected.includes(t.name)}
                    title={`${t.name} · ${formatYears(y)} of experience`}
                  >
                    <span>{t.name}</span>
                    {y > 0 && (
                      <span className="ml-1 opacity-60 tabular-nums text-[10px]">
                        {formatYears(y)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
