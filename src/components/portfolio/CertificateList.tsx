import type { Certificate } from "@/types/portfolio";
import { Award, ExternalLink } from "lucide-react";

interface Props {
  certificates: Certificate[];
  selected: string[];
}

export function CertificateList({ certificates, selected }: Props) {
  const filtered =
    selected.length === 0
      ? certificates
      : certificates.filter((c) => c.tech?.some((t) => selected.includes(t)));

  return (
    <section className="paper rule animate-fade-in px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5 flex items-end justify-between md:mb-7">
        <h2 className="section-title">Certificates</h2>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {filtered.length}/{certificates.length} matching
        </span>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No certificates match the selected tech.</p>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {filtered.map((c) => (
          <li key={c.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Award size={18} className="mt-0.5 shrink-0 accent-text" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium leading-snug">{c.name}</h3>
                <span className="text-xs tabular-nums text-muted-foreground">{c.year}</span>
              </div>
              <p className="text-sm text-muted-foreground">{c.issuer}</p>
              {c.credentialId && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">ID: {c.credentialId}</p>
              )}
              {(c.tech?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.tech!.map((t) => (
                    <span
                      key={t}
                      className="chip"
                      data-active={selected.includes(t)}
                      data-dim={selected.length > 0 && !selected.includes(t)}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {c.link && (
                <a
                  href={c.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs hover:underline accent-text"
                >
                  Verify <ExternalLink size={11} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
