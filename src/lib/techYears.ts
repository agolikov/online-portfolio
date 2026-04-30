import type { Experience } from "@/types/portfolio";

function parseYM(s: string): Date {
  if (!s || s === "present") return new Date();
  // accepts YYYY or YYYY-MM
  const [y, m = "1"] = s.split("-");
  return new Date(Number(y), Math.max(0, Number(m) - 1), 1);
}

/**
 * Sums total years a particular tech was used across experience entries.
 * Overlapping periods are merged so years aren't double-counted.
 */
export function yearsForTech(tech: string, experience: Experience[]): number {
  const intervals: [number, number][] = experience
    .filter((e) => e.tech.includes(tech))
    .map((e): [number, number] => [parseYM(e.start).getTime(), parseYM(e.end).getTime()])
    .sort((a, b) => a[0] - b[0]);

  if (intervals.length === 0) return 0;

  // merge
  const merged: [number, number][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const cur = intervals[i];
    if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]);
    else merged.push(cur);
  }

  const ms = merged.reduce((sum, [a, b]) => sum + (b - a), 0);
  const years = ms / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(years * 10) / 10;
}

export function formatYears(y: number): string {
  if (y <= 0) return "—";
  if (y < 1) return "<1y";
  return `${y % 1 === 0 ? y.toFixed(0) : y.toFixed(1)}y`;
}
