import posthog from "posthog-js";
import type { Project } from "@/types/portfolio";
import { ExternalLink } from "lucide-react";

interface Props {
  projects: Project[];
  selected: string[];
  onToggle?: (name: string) => void;
}

export function ProjectGrid({ projects, selected, onToggle }: Props) {
  const filtered =
    selected.length === 0
      ? projects
      : projects.filter((p) => p.tech.some((t) => selected.includes(t)));

  return (
    <section className="paper rule animate-fade-in px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5 flex items-end justify-between md:mb-7">
        <h2 className="section-title">Projects</h2>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {filtered.length}/{projects.length} matching
        </span>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No projects match the selected tech.</p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-4"
          >
            <a
              href={`https://${p.link}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-baseline justify-between hover:underline"
              onClick={() => posthog.capture("project_link_clicked", { project: p.name, project_url: p.link })}
            >
              <h3 className="accent-text text-lg font-semibold">{p.name}</h3>
              <div className="flex items-center gap-2 shrink-0">
                {p.year && !p.hideYear && (
                  <span className="text-xs tabular-nums text-muted-foreground">{p.year}</span>
                )}
                <ExternalLink size={14} className="opacity-50 group-hover:opacity-100" />
              </div>
            </a>
            <p className="text-sm font-medium">{p.tagline}</p>
            <p className="text-sm text-muted-foreground">{p.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <button
                  type="button"
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
          </div>
        ))}
      </div>
    </section>
  );
}
