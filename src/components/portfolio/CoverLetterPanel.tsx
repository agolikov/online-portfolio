import type { PortfolioCoverLetter } from "@/types/portfolio";

function metricTone(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

export function CoverLetterPanel({ coverLetter }: { coverLetter: PortfolioCoverLetter }) {
  return (
    <div className="space-y-4">
      {coverLetter.metrics && coverLetter.metrics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {coverLetter.metrics.map((metric) => (
            <div key={metric.id} className="rounded-md border border-border px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{metric.label}</span>
                <span className="font-mono text-sm">{metric.score}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${metricTone(metric.score)}`} style={{ width: `${metric.score}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{metric.summary}</p>
            </div>
          ))}
        </div>
      )}

      {coverLetter.summary && (
        <div className="rounded-md border border-border px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest">Short Summary</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{coverLetter.summary}</p>
          {coverLetter.recipientName && (
            <p className="mt-2 text-xs text-muted-foreground">
              Addressed to {coverLetter.recipientName}
            </p>
          )}
        </div>
      )}

      <div className="rounded-md border border-border px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest">Cover Letter</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{coverLetter.content}</p>
      </div>
    </div>
  );
}
