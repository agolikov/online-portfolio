import type { Education } from "@/types/portfolio";
import { GraduationCap } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(d: string): string {
  if (!d) return "";
  if (d.toLowerCase() === "present") return "Present";
  const [year, month] = d.split("-");
  if (!month) return year;
  return `${MONTHS[parseInt(month, 10) - 1] ?? ""} ${year}`.trim();
}

export function EducationList({ education }: { education: Education[] }) {
  return (
    <section className="paper rule animate-fade-in px-4 py-6 md:px-6 md:py-8">
      <h2 className="section-title mb-5 md:mb-7">Education</h2>
      <ul className="space-y-0">
        {education.map((e) => {
          const showDates = e.showDates !== false && (e.start || e.end);
          const dateLine = showDates
            ? `${fmtDate(e.start)}${e.end ? ` – ${fmtDate(e.end)}` : ""}`
            : null;
          return (
            <li key={e.id} className="rule pt-6 first:border-t-0 first:pt-0 flex gap-4">
              <GraduationCap size={18} className="mt-0.5 shrink-0 accent-text" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-bold">{e.degree}</h3>
                  {dateLine && <span className="text-sm tabular-nums text-muted-foreground">{dateLine}</span>}
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
          );
        })}
      </ul>
    </section>
  );
}
