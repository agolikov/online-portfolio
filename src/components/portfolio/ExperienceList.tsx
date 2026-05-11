import type { Experience } from "@/types/portfolio";

interface Props {
  experience: Experience[];
  selected: string[];
  onToggle?: (name: string) => void;
}

export function ExperienceList({ experience, selected, onToggle }: Props) {
  const filtered =
    selected.length === 0
      ? experience
      : experience.filter((e) => e.tech.some((t) => selected.includes(t)));

  return (
    <section className="paper rule animate-fade-in px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5 flex items-end justify-between md:mb-7">
        <h2 className="section-title">Experience</h2>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {filtered.length}/{experience.length} matching
        </span>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No experience matches the selected tech.</p>
      )}

      <div className="space-y-7">
        {filtered.map((e) => (
          <article key={e.id} className="rule pt-7 first:border-t-0 first:pt-0">
            <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <h3 className="text-lg font-semibold leading-snug">
                  {e.role} <span className="accent-text">@ {e.company}</span>
                </h3>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {e.location}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">{e.period}</span>
            </div>

            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed">
              {e.highlights.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="accent-text shrink-0">▸</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {e.tech.map((t) => (
                <button
                  key={t}
                  onClick={() => onToggle?.(t)}
                  className="chip"
                  data-active={selected.includes(t)}
                  data-dim={selected.length > 0 && !selected.includes(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
