import { useEffect, useRef, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, Copy, Pencil, Save, X, Sparkles, Upload } from "lucide-react";
import { ThemeProvider } from "@/context/ThemeContext";
import { resumesApi, type ResumeRow } from "@/lib/resumesApi";
import { ChatWidget } from "@/components/portfolio/ChatWidget";
import type { CoverLetterMetric } from "@/types/portfolio";

function metricTone(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function CoverLetterBody() {
  const { hash } = useParams<{ hash: string }>();
  const [row, setRow] = useState<ResumeRow | null>(null);
  const [letter, setLetter] = useState("");
  const [vacancyText, setVacancyText] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [metrics, setMetrics] = useState<CoverLetterMetric[]>([]);
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!hash) return;
    resumesApi.get(hash).then((r) => {
      setRow(r);
      setLetter(r.coverLetter ?? "");
      setVacancyText(r.resumeData.coverLetters?.current?.vacancyText ?? "");
      setRecipientName(r.resumeData.coverLetters?.current?.recipientName ?? "");
      setMetrics(r.resumeData.coverLetters?.current?.metrics ?? []);
    }).catch(() => setNotFound(true));
  }, [hash]);

  useEffect(() => {
    if (editing) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [editing]);

  // Refresh when AI chat saves a cover letter
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ hash: string }>).detail;
      if (detail.hash === hash) {
        resumesApi.getCoverLetter(hash!).then((d) => {
          setLetter(d.coverLetter);
          setVacancyText(d.vacancyText ?? "");
          setRecipientName(d.recipientName ?? "");
          setMetrics(d.metrics ?? []);
        });
      }
    };
    window.addEventListener("resume-data-changed", handler);
    return () => window.removeEventListener("resume-data-changed", handler);
  }, [hash]);

  if (notFound) return <Navigate to="/" replace />;
  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  async function generate() {
    setGenerating(true);
    try {
      const { coverLetter, metrics, recipientName: savedRecipientName } = await resumesApi.generateCoverLetter(hash!, vacancyText, recipientName);
      setLetter(coverLetter);
      setRecipientName(savedRecipientName ?? recipientName);
      setMetrics(metrics);
    } catch {
      // TODO: surface error
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    const saved = await resumesApi.saveCoverLetter(hash!, letter, vacancyText, recipientName);
    setMetrics(saved.metrics ?? metrics);
    setEditing(false);
  }

  function loadVacancyFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setVacancyText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function copy() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen px-3 py-4 md:px-6 md:py-8">
      <main className="mx-auto max-w-3xl flex flex-col gap-5">

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link to={`/${hash}`} className="chip flex items-center gap-1.5">
            <ArrowLeft size={12} /> Back
          </Link>
          <h1 className="text-xl font-semibold flex-1">Cover Letter</h1>
          <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {hash}
          </span>
        </div>

        <section className="paper px-5 py-5 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest">Role Fit</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Paste vacancy text or attach a text file before generating.
              </p>
            </div>
            <label className="chip flex items-center gap-1.5 cursor-pointer">
              <Upload size={12} /> Attach
              <input
                type="file"
                accept=".txt,.md,.csv,.json,text/*"
                className="hidden"
                onChange={(e) => loadVacancyFile(e.target.files?.[0])}
              />
            </label>
          </div>
          <textarea
            className="w-full min-h-32 bg-transparent border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-foreground resize-y"
            value={vacancyText}
            onChange={(e) => setVacancyText(e.target.value)}
            placeholder="Paste vacancy text here..."
          />
          <div className="mt-3">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Hiring manager or recruiter name
            </label>
            <input
              className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-foreground"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Optional, e.g. Anna Kowalska"
            />
          </div>
          {metrics.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 mt-4">
              {metrics.map((metric) => (
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
          <button
            onClick={generate}
            disabled={generating}
            className="chip flex items-center gap-1.5 mt-4"
            data-active="true"
          >
            <Sparkles size={12} />
            {generating ? "Generating..." : letter ? "Regenerate with role fit" : "Generate with role fit"}
          </button>
        </section>

        {/* Card */}
        <div className="paper px-5 py-5 md:px-8 md:py-7">
          {letter ? (
            <>
              {editing ? (
                <textarea
                  ref={textareaRef}
                  className="w-full min-h-[28rem] bg-transparent outline-none resize-none text-sm leading-relaxed"
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{letter}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-5 mt-4 border-t border-border">
                {editing ? (
                  <>
                    <button onClick={save} className="chip flex items-center gap-1.5" data-active="true">
                      <Save size={12} /> Save
                    </button>
                    <button onClick={() => setEditing(false)} className="chip flex items-center gap-1.5">
                      <X size={12} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditing(true)} className="chip flex items-center gap-1.5">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={copy} className="chip flex items-center gap-1.5">
                      <Copy size={12} /> {copied ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={generate} disabled={generating} className="chip flex items-center gap-1.5">
                      <Sparkles size={12} /> {generating ? "Generating..." : "Regenerate"}
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Sparkles size={32} className="accent-text opacity-60" />
              <p className="text-muted-foreground text-sm">No cover letter yet.</p>
              <button
                onClick={generate}
                disabled={generating}
                className="chip flex items-center gap-1.5"
                data-active="true"
              >
                <Sparkles size={12} />
                {generating ? "Generating..." : "Generate with AI"}
              </button>
              <p className="text-xs text-muted-foreground max-w-xs">
                A template is used automatically when no AI key is configured.
              </p>
            </div>
          )}
        </div>

        {/* Hint */}
        <p className="text-xs text-muted-foreground text-center">
          You can also ask the AI assistant below to write or update this cover letter.
        </p>
      </main>

      <ChatWidget hash={hash!} />
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <ThemeProvider>
      <CoverLetterBody />
    </ThemeProvider>
  );
}
