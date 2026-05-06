import type { Education } from "@/types/portfolio";
import { GraduationCap } from "lucide-react";

export function EducationList({ education }: { education: Education[] }) {
  return (
    <section className="paper px-4 py-4 md:px-10 md:py-6 animate-fade-in">
      <h2 className="section-title mb-4 md:mb-6">Education</h2>
      <ul className="space-y-0">
        {education.map((e) => (
          <li key={e.id} className="rule pt-6 first:border-t-0 first:pt-0 flex gap-4">
            <GraduationCap size={18} className="mt-0.5 shrink-0 accent-text" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-bold">{e.degree}</h3>
                <span className="text-sm tabular-nums text-muted-foreground">{e.period}</span>
              </div>
              <p className="text-sm accent-text font-medium">{e.shortName ?? e.institution}</p>
              <p className="text-sm text-muted-foreground">{e.field}</p>
              {e.thesis && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Thesis: <span className="italic">{e.thesis}</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
