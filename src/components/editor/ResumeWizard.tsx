import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Certificate, CoverLetterMetric, Education, Experience, Portfolio, Project } from "@/types/portfolio";
import { resumesApi, type ResumeRow } from "@/lib/resumesApi";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { CoverLetterPanel } from "@/components/portfolio/CoverLetterPanel";
import { Field, HighlightEditor, TagEditor } from "@/components/editor/EditorShared";
import { TechTab } from "@/components/editor/TechTab";
import { StoriesTab } from "@/components/editor/StoriesTab";
import { inputCls, labelCls, move, uid } from "@/components/editor/EditorSharedUtils";
import { isVisible } from "@/lib/visibility";
import { suggestAlias, isValidAlias, slugifyAlias, slugifyAliasInput } from "./aliasUtils";
import { ArrowLeft, ArrowRight, Check, FileJson, Plus, Send, Sparkles, Trash2 } from "lucide-react";

type SourceMode = "existing" | "json";
type StepId = "source" | "job" | "tailor" | "review";

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: "source", label: "Start" },
  { id: "job", label: "Job" },
  { id: "tailor", label: "Tailor" },
  { id: "review", label: "Review" },
];

const FOLLOW_UP_PRESETS = [
  {
    label: "Make Short",
    prompt: "Make this cover letter shorter and more direct. Preserve the strongest evidence, keep it professional, and do not add new claims.",
  },
  {
    label: "Focus on Achievements",
    prompt: "Rewrite this cover letter to focus on existing resume achievements and measurable outcomes. Do not invent achievements or add unsupported claims.",
  },
] as const;

const emptyPortfolio: Portfolio = {
  profile: {
    name: "",
    title: "",
    location: "",
    email: "",
    website: "",
    github: "",
    linkedin: "",
    summary: "",
  },
  tech: [],
  experience: [],
  projects: [],
  certificates: [],
  education: [],
  stories: [],
};

interface Props {
  open: boolean;
  rows: ResumeRow[];
  onOpenChange: (open: boolean) => void;
  onCreated: (row: ResumeRow) => void;
}

interface JobContext {
  company: string;
  role: string;
  vacancyText: string;
  recipientName: string;
}

function clonePortfolio(data: Portfolio): Portfolio {
  return JSON.parse(JSON.stringify(data)) as Portfolio;
}

function mergeCoverLetter(
  data: Portfolio,
  coverLetter: string,
  job: JobContext,
  result: { summary: string; recipientName?: string; metrics: CoverLetterMetric[] },
): Portfolio {
  return {
    ...data,
    coverLetters: {
      ...data.coverLetters,
      current: {
        content: coverLetter,
        enabled: data.coverLetters?.current?.enabled ?? true,
        summary: result.summary,
        recipientName: result.recipientName ?? job.recipientName,
        vacancyText: job.vacancyText,
        metrics: result.metrics,
        generatedAt: data.coverLetters?.current?.generatedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

function listSummary(data: Portfolio) {
  return [
    ["Tech", data.tech.length],
    ["Experience", data.experience.length],
    ["Certificates", data.certificates.length],
    ["Projects", data.projects.length],
    ["Education", data.education?.length ?? 0],
    ["Stories", data.stories?.length ?? 0],
  ];
}

function WizardStepper({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 border-b border-border pb-3 md:grid-cols-4">
      {STEPS.map((step, index) => (
        <span
          key={step.id}
          className="chip justify-center"
          data-active={index === stepIndex ? "true" : undefined}
          data-dim={index > stepIndex ? "true" : undefined}
        >
          {index + 1}. {step.label}
        </span>
      ))}
    </div>
  );
}

function WizardStatus({ alias, job, data, draftHash }: { alias: string; job: JobContext; data: Portfolio; draftHash: string | null }) {
  return (
    <div className="grid gap-2 border border-border p-3 text-xs text-muted-foreground md:grid-cols-4">
      <span><strong className="text-foreground">Alias:</strong> {alias ? `/${alias}` : "not set"}</span>
      <span><strong className="text-foreground">Job:</strong> {[job.role, job.company].filter(Boolean).join(" at ") || "not set"}</span>
      <span><strong className="text-foreground">Cover:</strong> {data.coverLetters?.current?.content ? "ready" : "not generated"}</span>
      <span><strong className="text-foreground">Draft:</strong> {draftHash ? "active" : "not created"}</span>
    </div>
  );
}

export function ResumeWizard({ open, rows, onOpenChange, onCreated }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<Portfolio>(() => clonePortfolio(emptyPortfolio));
  const [sourceMode, setSourceMode] = useState<SourceMode>("existing");
  const [sourceHash, setSourceHash] = useState("");
  const [alias, setAlias] = useState("");
  const [draftHash, setDraftHash] = useState<string | null>(null);
  const [draftCreated, setDraftCreated] = useState(false);
  const [job, setJob] = useState<JobContext>({ company: "", role: "", vacancyText: "", recipientName: "" });
  const [generatingCover, setGeneratingCover] = useState(false);
  const [streamingCover, setStreamingCover] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);

  const step = STEPS[stepIndex];
  const selectedRow = rows.find((row) => row.hash === sourceHash);
  const canContinueSource = sourceMode === "existing" ? Boolean(selectedRow) : Boolean(data.profile.name);
  const canContinueJob = Boolean(job.vacancyText.trim());
  const aliasError = alias && !isValidAlias(alias) ? "Use lowercase letters, numbers, and hyphens." : "";
  const publicUrl = alias ? `/${alias}` : "";

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setData(clonePortfolio(emptyPortfolio));
    setSourceMode("existing");
    setSourceHash("");
    setAlias("");
    setDraftHash(null);
    setDraftCreated(false);
    setCompleted(false);
    setJob({ company: "", role: "", vacancyText: "", recipientName: "" });
    setStreamingCover(null);
    setFollowUp("");
    setFollowUpResponse("");
  }, [open]);

  useEffect(() => {
    if (alias || !data.profile.name) return;
    const next = suggestAlias([data.profile.name, job.company, job.role]);
    if (next) setAlias(next);
  }, [alias, data.profile.name, job.company, job.role]);

  function applySourceRow(hash: string) {
    setSourceMode("existing");
    setSourceHash(hash);
    if (!hash) {
      setData(clonePortfolio(emptyPortfolio));
      return;
    }
    const row = rows.find((r) => r.hash === hash);
    if (!row) return;
    const nextData = clonePortfolio(row.resumeData);
    setData(nextData);
    setAlias(suggestAlias([row.alias, nextData.profile?.name, job.company, job.role]));
  }

  async function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "")) as Portfolio;
        setSourceMode("json");
        setSourceHash("json");
        setData(parsed);
        setAlias(suggestAlias([parsed.profile?.name, job.company, job.role]));
        toast({ title: "JSON loaded", description: file.name });
      } catch {
        toast({ title: "Import failed", description: "Invalid JSON", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  }

  async function ensureAiDraft() {
    if (draftHash) {
      await resumesApi.update(draftHash, data);
      return draftHash;
    }

    const row = await resumesApi.create(data);
    setDraftHash(row.hash);
    setDraftCreated(true);
    await resumesApi.updateNote(row.hash, "Draft created from onboarding wizard");
    return row.hash;
  }

  async function ensureDraft() {
    if (!alias || !isValidAlias(alias)) {
      toast({ title: "Alias required", description: "Set a valid alias before continuing.", variant: "destructive" });
      return null;
    }

    if (draftHash) {
      await resumesApi.update(draftHash, data);
      await resumesApi.updateAlias(draftHash, alias);
      return draftHash;
    }

    const row = await resumesApi.create(data);
    setDraftHash(row.hash);
    setDraftCreated(true);
    await resumesApi.updateAlias(row.hash, alias);
    await resumesApi.updateNote(row.hash, "Draft created from onboarding wizard");
    return row.hash;
  }

  async function syncDraft(nextData = data) {
    if (!draftHash) return;
    await resumesApi.update(draftHash, nextData);
  }

  async function generateAliasWithAi() {
    if (!job.vacancyText.trim() && !job.company.trim() && !job.role.trim()) return;
    setBusy(true);
    let result = "";
    let errorMessage = "";
    try {
      const hash = await ensureAiDraft();
      await resumesApi.chatStream(
        hash,
        [
          {
            role: "user",
            content: [
              "Generate one concise public resume URL alias.",
              "Use the job description, company, role, and candidate profile.",
              "Output only the alias. Use lowercase letters, numbers, and hyphens. Maximum 60 characters. No slash, no quotes, no explanation.",
              `Candidate: ${data.profile.name} — ${data.profile.title}`,
              `Company: ${job.company}`,
              `Role: ${job.role}`,
              `Job description: ${job.vacancyText}`,
            ].join("\n"),
          },
        ],
        (event) => {
          if (event.type === "delta") result += event.text;
          if (event.type === "error") errorMessage = event.message;
        },
      );
      if (errorMessage) throw new Error(errorMessage);
      const nextAlias = slugifyAlias(result);
      if (!nextAlias || !isValidAlias(nextAlias)) {
        toast({ title: "Alias generation failed", description: "The AI returned an invalid alias.", variant: "destructive" });
        return;
      }
      setAlias(nextAlias);
    } catch (e) {
      toast({ title: "Alias generation failed", description: String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function refineJobContext() {
    if (!job.vacancyText.trim()) return;
    setBusy(true);
    let result = "";
    let errorMessage = "";
    try {
      const hash = await ensureAiDraft();
      await resumesApi.refineTextStream(hash, job.vacancyText, (event) => {
        if (event.type === "delta") result += event.text;
        if (event.type === "done") result = event.text;
        if (event.type === "error") errorMessage = event.message;
      });
      if (errorMessage) throw new Error(errorMessage);
      if (result.trim()) setJob((current) => ({ ...current, vacancyText: result.trim() }));
    } catch (e) {
      toast({ title: "Job context refine failed", description: String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function generateCoverLetter() {
    if (!job.vacancyText.trim()) return;
    setGeneratingCover(true);
    setStreamingCover("");
    try {
      const hash = await ensureDraft();
      if (!hash) return;
      await resumesApi.generateCoverLetterStream(hash, job.vacancyText, job.recipientName, (event) => {
        if (event.type === "delta") {
          setStreamingCover((prev) => (prev ?? "") + event.text);
        } else if (event.type === "done") {
          const nextData = mergeCoverLetter(data, event.coverLetter, job, event);
          setData(nextData);
          setStreamingCover(null);
        } else if (event.type === "error") {
          setStreamingCover(null);
          toast({ title: "Cover generation failed", description: event.message, variant: "destructive" });
        }
      });
    } catch (e) {
      setStreamingCover(null);
      toast({ title: "Cover generation failed", description: String(e), variant: "destructive" });
    } finally {
      setGeneratingCover(false);
    }
  }

  async function saveCoverLetter(content: string) {
    const hash = await ensureDraft();
    if (!hash) return;
    const result = await resumesApi.saveCoverLetter(hash, content, job.vacancyText, job.recipientName);
    setData((current) => mergeCoverLetter(current, result.coverLetter, job, result));
  }

  async function applyCoverFollowUp(instructionOverride?: string) {
    const instruction = (instructionOverride ?? followUp).trim();
    const current = data.coverLetters?.current?.content ?? "";
    if (!instruction || !current) return;
    setBusy(true);
    setFollowUpResponse("");
    let saved = false;
    let errorMessage = "";
    try {
      const hash = await ensureDraft();
      if (!hash) return;
      await resumesApi.chatStream(
        hash,
        [
          {
            role: "user",
            content: [
              "Update and save the current cover letter for this resume.",
              "Use this cover letter as the source text:",
              current,
              `Follow-up edit instructions: ${instruction}`,
              "Return only a brief confirmation to the user, but call save_cover_letter with the full revised cover letter text.",
            ].join("\n"),
          },
        ],
        (event) => {
          if (event.type === "delta") setFollowUpResponse((prev) => prev + event.text);
          if (event.type === "done") saved = event.dataChanged || event.coverLetterSaved;
          if (event.type === "error") errorMessage = event.message;
        },
      );
      if (errorMessage) throw new Error(errorMessage);
      if (saved) {
        const row = await resumesApi.get(hash);
        setData(row.resumeData);
        if (!instructionOverride) setFollowUp("");
      }
    } catch (e) {
      toast({ title: "Follow-up failed", description: String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (step.id === "source" && !canContinueSource) return;
    if (step.id === "job" && !canContinueJob) return;
    if (step.id === "job") {
      await syncDraft();
    } else {
      await syncDraft();
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  async function createResume() {
    if (!alias || !isValidAlias(alias)) {
      toast({ title: "Alias required", description: "Set a valid alias before creating.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const hash = await ensureDraft();
      if (!hash) return;
      await resumesApi.update(hash, data);
      await resumesApi.updateAlias(hash, alias);
      await resumesApi.updateNote(hash, "");
      const row = await resumesApi.get(hash);
      setCompleted(true);
      onCreated(row);
      onOpenChange(false);
      toast({ title: "Resume created", description: `${publicUrl} is ready.` });
    } catch (e) {
      toast({ title: "Create failed", description: String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  function updateProfile(patch: Partial<Portfolio["profile"]>) {
    setData((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  }

  async function cancel() {
    if (draftHash && draftCreated && !completed) {
      if (!confirm("Discard this wizard draft?")) return;
      try {
        await resumesApi.remove(draftHash);
      } catch {
        toast({ title: "Draft cleanup failed", variant: "destructive" });
      }
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : void cancel())}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Resume</DialogTitle>
          <DialogDescription className="sr-only">
            Guided resume creation workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <WizardStepper stepIndex={stepIndex} />
          <WizardStatus alias={alias} job={job} data={data} draftHash={draftHash} />
          {step.id === "source" && (
            <SourceStep
              rows={rows}
              sourceMode={sourceMode}
              selectedHash={sourceHash}
              data={data}
              onSourceModeChange={(mode) => {
                setSourceMode(mode);
                setSourceHash(mode === "json" ? "json" : "");
                if (mode === "existing") setData(clonePortfolio(emptyPortfolio));
              }}
              onSelect={applySourceRow}
              onImport={importJson}
            />
          )}
          {step.id === "job" && (
            <JobStep
              alias={alias}
              aliasError={aliasError}
              job={job}
              data={data}
              streamingCover={streamingCover}
              generatingCover={generatingCover}
              followUp={followUp}
              followUpResponse={followUpResponse}
              busy={busy}
              onAliasChange={(v) => setAlias(slugifyAliasInput(v))}
              onAliasBlur={() => setAlias((current) => slugifyAlias(current))}
              onGenerateAlias={() => void generateAliasWithAi()}
              onJobChange={(patch) => setJob((current) => ({ ...current, ...patch }))}
              onRefineJobContext={() => void refineJobContext()}
              onGenerate={() => void generateCoverLetter()}
              onSaveCover={(content) => void saveCoverLetter(content)}
              onCoverChange={(content) =>
                setData((current) => ({
                  ...current,
                  coverLetters: {
                    ...current.coverLetters,
                    current: {
                      content,
                      enabled: current.coverLetters?.current?.enabled ?? true,
                      summary: current.coverLetters?.current?.summary,
                      recipientName: current.coverLetters?.current?.recipientName ?? job.recipientName,
                      vacancyText: current.coverLetters?.current?.vacancyText ?? job.vacancyText,
                      metrics: current.coverLetters?.current?.metrics,
                      generatedAt: current.coverLetters?.current?.generatedAt,
                      updatedAt: new Date().toISOString(),
                    },
                  },
                }))
              }
              onFollowUpChange={setFollowUp}
              onApplyFollowUp={(prompt) => void applyCoverFollowUp(prompt)}
            />
          )}
          {step.id === "tailor" && (
            <TailorStep
              data={data}
              draftHash={draftHash}
              alias={alias}
              onProfileChange={updateProfile}
              onTechChange={(tech) => setData((current) => ({ ...current, tech }))}
              onExperienceChange={(experience) => setData((current) => ({ ...current, experience }))}
              onCertificatesChange={(certificates) => setData((current) => ({ ...current, certificates }))}
              onProjectsChange={(projects) => setData((current) => ({ ...current, projects }))}
              onEducationChange={(education) => setData((current) => ({ ...current, education }))}
              onStoriesChange={(stories) => setData((current) => ({ ...current, stories }))}
            />
          )}
          {step.id === "review" && <ReviewStep data={data} job={job} alias={alias} />}
          <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3">
            <button type="button" className="chip" onClick={() => void cancel()}>
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="chip flex items-center gap-1.5"
                disabled={stepIndex === 0 || busy}
                onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
              >
                <ArrowLeft size={12} /> Back
              </button>
              {step.id === "review" ? (
                <button
                  type="button"
                  className="chip flex items-center gap-1.5"
                  data-active="true"
                  disabled={busy || !alias || !!aliasError}
                  onClick={() => void createResume()}
                >
                  <Check size={12} /> {busy ? "Creating..." : "Create"}
                </button>
              ) : (
                <button
                  type="button"
                  className="chip flex items-center gap-1.5"
                  data-active="true"
                  disabled={busy || (step.id === "source" && !canContinueSource) || (step.id === "job" && !canContinueJob)}
                  onClick={() => void next()}
                >
                  Next <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SourceStep({
  rows,
  sourceMode,
  selectedHash,
  data,
  onSourceModeChange,
  onSelect,
  onImport,
}: {
  rows: ResumeRow[];
  sourceMode: SourceMode;
  selectedHash: string;
  data: Portfolio;
  onSourceModeChange: (mode: SourceMode) => void;
  onSelect: (hash: string) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className={labelCls}>Resume source</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="resume-source"
              checked={sourceMode === "existing"}
              onChange={() => onSourceModeChange("existing")}
            />
            Existing resume
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="resume-source"
              checked={sourceMode === "json"}
              onChange={() => onSourceModeChange("json")}
            />
            Import JSON
          </label>
        </div>
      </fieldset>

      {sourceMode === "existing" ? (
        <label className="block">
          <span className={labelCls}>Existing resume</span>
          <select
            className={inputCls}
            value={selectedHash}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="">Select a resume...</option>
            {rows.map((row) => {
              const title = row.alias ? `/${row.alias}` : row.resumeData.profile?.name || "Untitled resume";
              const subtitle = row.resumeData.profile?.title ? ` - ${row.resumeData.profile.title}` : "";
              return (
                <option key={row.hash} value={row.hash}>
                  {title}{subtitle}
                </option>
              );
            })}
          </select>
        </label>
      ) : (
        <div>
          <p className={labelCls}>Import JSON</p>
          <label className="chip flex w-fit cursor-pointer items-center gap-1.5">
            <FileJson size={12} /> Select JSON
            <input type="file" accept="application/json" className="hidden" onChange={onImport} />
          </label>
          {selectedHash === "json" && (
            <p className="mt-2 text-sm text-muted-foreground">{data.profile?.name || "Imported resume"} loaded.</p>
          )}
        </div>
      )}
    </div>
  );
}

function JobStep({
  alias,
  aliasError,
  job,
  data,
  streamingCover,
  generatingCover,
  followUp,
  followUpResponse,
  busy,
  onAliasChange,
  onAliasBlur,
  onGenerateAlias,
  onJobChange,
  onRefineJobContext,
  onGenerate,
  onSaveCover,
  onCoverChange,
  onFollowUpChange,
  onApplyFollowUp,
}: {
  alias: string;
  aliasError: string;
  job: JobContext;
  data: Portfolio;
  streamingCover: string | null;
  generatingCover: boolean;
  followUp: string;
  followUpResponse: string;
  busy: boolean;
  onAliasChange: (v: string) => void;
  onAliasBlur: () => void;
  onGenerateAlias: () => void;
  onJobChange: (patch: Partial<JobContext>) => void;
  onRefineJobContext: () => void;
  onGenerate: () => void;
  onSaveCover: (content: string) => void;
  onCoverChange: (content: string) => void;
  onFollowUpChange: (v: string) => void;
  onApplyFollowUp: (prompt?: string) => void;
}) {
  const cover = data.coverLetters?.current;
  return (
    <div className="space-y-4">
      <label>
        <span className="flex items-start justify-between gap-2">
          <span className={`${labelCls} pt-2`}>Job description</span>
          <button
            type="button"
            className="mb-1 flex flex-col items-start gap-0.5 border border-border px-3 py-2 text-left text-xs transition-colors hover:bg-muted disabled:opacity-40"
            disabled={busy || !job.vacancyText.trim()}
            onClick={onRefineJobContext}
          >
            <span className="flex items-center gap-1.5 font-medium uppercase tracking-wider">
              <Sparkles size={12} /> Refine with Role Context
            </span>
            <span className="block text-muted-foreground">Uses requirements from the job</span>
            <span className="block text-muted-foreground">description to present better.</span>
          </button>
        </span>
        <textarea
          rows={10}
          className={`${inputCls} resize-y`}
          value={job.vacancyText}
          onChange={(e) => onJobChange({ vacancyText: e.target.value })}
          placeholder="Paste the job description here."
        />
      </label>
      <details className="border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">Job details and public alias</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            <span className={labelCls}>Company</span>
            <input className={inputCls} value={job.company} onChange={(e) => onJobChange({ company: e.target.value })} />
          </label>
          <label>
            <span className={labelCls}>Role</span>
            <input className={inputCls} value={job.role} onChange={(e) => onJobChange({ role: e.target.value })} />
          </label>
          <label>
            <span className={labelCls}>Hiring manager or recruiter</span>
            <input className={inputCls} value={job.recipientName} onChange={(e) => onJobChange({ recipientName: e.target.value })} />
          </label>
          <label>
            <span className={labelCls}>Alias</span>
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={alias}
                onChange={(e) => onAliasChange(e.target.value)}
                onBlur={onAliasBlur}
                placeholder="company-role"
              />
              <button
                type="button"
                className="chip flex shrink-0 items-center gap-1.5 disabled:opacity-40"
                disabled={busy || (!job.vacancyText.trim() && !job.company.trim() && !job.role.trim())}
                onClick={onGenerateAlias}
              >
                <Sparkles size={12} /> Generate Alias
              </button>
            </div>
            {aliasError && <span className="mt-1 block text-xs text-destructive">{aliasError}</span>}
          </label>
        </div>
      </details>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="chip flex items-center gap-1.5 disabled:opacity-40"
          data-active="true"
          disabled={generatingCover || !job.vacancyText.trim() || !alias || !!aliasError}
          onClick={onGenerate}
        >
          <Sparkles size={12} /> {generatingCover ? "Generating..." : "Generate Cover Letter"}
        </button>
        {!alias && <span className="self-center text-xs text-muted-foreground">Generate or enter an alias before generating a cover letter.</span>}
      </div>
      <Tabs defaultValue="edit">
        <TabsList className="flex h-auto w-fit gap-1 bg-muted/50 p-1">
          <TabsTrigger value="edit" className="text-xs uppercase tracking-widest">Edit</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs uppercase tracking-widest">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="edit">
          {streamingCover !== null ? (
            <div className={`${inputCls} min-h-[12rem] whitespace-pre-wrap text-muted-foreground`}>
              {streamingCover}
              <span className="animate-pulse">|</span>
            </div>
          ) : (
            <textarea
              rows={9}
              className={`${inputCls} resize-y`}
              value={cover?.content ?? ""}
              onChange={(e) => onCoverChange(e.target.value)}
              onBlur={(e) => {
                if (e.target.value.trim()) onSaveCover(e.target.value.trim());
              }}
              placeholder="Write or generate a cover letter..."
            />
          )}
        </TabsContent>
        <TabsContent value="preview">
          {cover?.content ? <CoverLetterPanel coverLetter={cover} /> : <p className="text-sm text-muted-foreground">No cover letter yet.</p>}
        </TabsContent>
      </Tabs>
      {cover?.content && (
        <div className="space-y-2">
          <p className={labelCls}>Improve cover letter</p>
          <div className="flex flex-wrap items-center gap-2">
            {FOLLOW_UP_PRESETS.map((preset) => (
              <Tooltip key={preset.label}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="chip flex items-center gap-1.5 disabled:opacity-40"
                    disabled={busy}
                    onClick={() => onApplyFollowUp(preset.prompt)}
                  >
                    <Sparkles size={12} /> {preset.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm whitespace-normal text-xs">
                  {preset.prompt}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <label>
            <span className={labelCls}>Custom instruction</span>
            <textarea
              rows={3}
              className={`${inputCls} resize-y`}
              value={followUp}
              onChange={(e) => onFollowUpChange(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="chip flex items-center gap-1.5 disabled:opacity-40"
              data-active="true"
              disabled={busy || !followUp.trim()}
              onClick={() => onApplyFollowUp()}
            >
              <Send size={12} /> Apply Follow-up
            </button>
            {followUpResponse && <span className="text-xs text-muted-foreground">{followUpResponse}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function TailorStep({
  data,
  draftHash,
  alias,
  onProfileChange,
  onTechChange,
  onExperienceChange,
  onCertificatesChange,
  onProjectsChange,
  onEducationChange,
  onStoriesChange,
}: {
  data: Portfolio;
  draftHash: string | null;
  alias: string;
  onProfileChange: (patch: Partial<Portfolio["profile"]>) => void;
  onTechChange: (items: Portfolio["tech"]) => void;
  onExperienceChange: (items: Experience[]) => void;
  onCertificatesChange: (items: Certificate[]) => void;
  onProjectsChange: (items: Project[]) => void;
  onEducationChange: (items: Education[]) => void;
  onStoriesChange: (items: NonNullable<Portfolio["stories"]>) => void;
}) {
  return (
    <div className="space-y-3">
      <TailorSection title="Profile" summary={data.profile.name || data.profile.title || "No profile name yet"} defaultOpen>
        <ProfileStep data={data} onChange={onProfileChange} draftHash={draftHash} alias={alias} />
      </TailorSection>
      <TailorSection title="Tech" summary={`${data.tech.length} skills`}>
        <TechTab tech={data.tech} onChange={onTechChange} />
      </TailorSection>
      <TailorSection title="Experience" summary={`${data.experience.length} roles`}>
        <ExperienceStep data={data} draftHash={draftHash} onChange={onExperienceChange} />
      </TailorSection>
      <TailorSection title="Certificates" summary={`${data.certificates.length} certificates`}>
        <CertificatesStep data={data} onChange={onCertificatesChange} />
      </TailorSection>
      <TailorSection title="Projects" summary={`${data.projects.length} projects`}>
        <ProjectsStep data={data} draftHash={draftHash} onChange={onProjectsChange} />
      </TailorSection>
      <TailorSection title="Education" summary={`${data.education?.length ?? 0} entries`}>
        <EducationStep data={data} draftHash={draftHash} onChange={onEducationChange} />
      </TailorSection>
      <TailorSection title="Stories" summary={`${data.stories?.length ?? 0} stories`}>
        <StoriesTab stories={data.stories ?? []} onChange={onStoriesChange} hash={draftHash} />
      </TailorSection>
    </div>
  );
}

function TailorSection({ title, summary, defaultOpen, children }: { title: string; summary: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="border border-border" open={defaultOpen}>
      <summary className="cursor-pointer p-3">
        <span className="text-sm font-medium">{title}</span>
        <span className="ml-3 text-xs text-muted-foreground">{summary}</span>
      </summary>
      <div className="border-t border-border p-3">
        {children}
      </div>
    </details>
  );
}

function ProfileStep({ data, onChange, draftHash, alias }: { data: Portfolio; onChange: (patch: Partial<Portfolio["profile"]>) => void; draftHash: string | null; alias: string }) {
  const website = data.profile.website ?? "";
  const aliasSegment = alias ? `/${alias}` : "";
  const canAppend = Boolean(alias) && !website.endsWith(aliasSegment);
  const appendAlias = () => {
    if (!canAppend) return;
    const base = website.replace(/\/+$/, "");
    onChange({ website: `${base}${aliasSegment}` });
  };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Name" value={data.profile.name} onChange={(v) => onChange({ name: v })} />
      <Field label="Title" value={data.profile.title} onChange={(v) => onChange({ title: v })} />
      <Field label="Location" value={data.profile.location} onChange={(v) => onChange({ location: v })} />
      <Field label="Email" value={data.profile.email} onChange={(v) => onChange({ email: v })} />
      <label className="block">
        <span className={labelCls}>Website</span>
        <div className="flex gap-2">
          <input className={inputCls} value={website} onChange={(e) => onChange({ website: e.target.value })} />
          <button
            type="button"
            className="chip flex shrink-0 items-center gap-1.5 disabled:opacity-40"
            disabled={!canAppend}
            onClick={appendAlias}
            title={alias ? `Append /${alias}` : "Set an alias first"}
          >
            <Plus size={12} /> {alias ? `Append /${alias}` : "Append alias"}
          </button>
        </div>
      </label>
      <Field label="GitHub" value={data.profile.github} onChange={(v) => onChange({ github: v })} />
      <Field label="LinkedIn" value={data.profile.linkedin} onChange={(v) => onChange({ linkedin: v })} />
      <Field label="Summary" value={data.profile.summary} onChange={(v) => onChange({ summary: v })} multiline rows={5} span2 hash={draftHash} />
    </div>
  );
}

function ExperienceStep({ data, draftHash, onChange }: { data: Portfolio; draftHash: string | null; onChange: (items: Experience[]) => void }) {
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const items = data.experience;
  const update = (id: string, patch: Partial<Experience>) => onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  return (
    <ListShell
      label="Experience"
      onAdd={() => onChange([{ id: uid("exp"), enabled: true, company: "", role: "", period: "", start: "", end: "", location: "", highlights: [], tech: [] }, ...items])}
    >
      {items.map((item, i) => {
        const tagKey = `exp-${item.id}`;
        return (
          <div key={item.id} className="border border-border p-3">
            <RowHeader
              title={item.role || "New Experience"}
              enabled={isVisible(item)}
              onEnabledChange={(enabled) => update(item.id, { enabled })}
              onRemove={() => onChange(items.filter((x) => x.id !== item.id))}
              onMoveUp={i > 0 ? () => onChange(move(items, i, i - 1)) : undefined}
              onMoveDown={i < items.length - 1 ? () => onChange(move(items, i, i + 1)) : undefined}
            />
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Field label="Company" value={item.company} onChange={(v) => update(item.id, { company: v })} />
              <Field label="Role" value={item.role} onChange={(v) => update(item.id, { role: v })} />
              <Field label="Location" value={item.location} onChange={(v) => update(item.id, { location: v })} />
              <Field label="Period" value={item.period} onChange={(v) => update(item.id, { period: v })} />
              <Field label="Start" value={item.start} onChange={(v) => update(item.id, { start: v })} />
              <Field label="End" value={item.end} onChange={(v) => update(item.id, { end: v })} />
              <HighlightEditor
                highlights={item.highlights}
                onChange={(idx, v) => update(item.id, { highlights: item.highlights.map((h, j) => (j === idx ? v : h)) })}
                onAdd={() => update(item.id, { highlights: [...item.highlights, ""] })}
                onRemove={(idx) => update(item.id, { highlights: item.highlights.filter((_, j) => j !== idx) })}
                hash={draftHash}
              />
              <TagEditor
                tags={item.tech}
                inputValue={tagInputs[tagKey] ?? ""}
                onInputChange={(v) => setTagInputs((current) => ({ ...current, [tagKey]: v }))}
                onAdd={() => {
                  const v = (tagInputs[tagKey] ?? "").trim();
                  if (!v) return;
                  update(item.id, { tech: [...item.tech, v] });
                  setTagInputs((current) => ({ ...current, [tagKey]: "" }));
                }}
                onRemove={(idx) => update(item.id, { tech: item.tech.filter((_, j) => j !== idx) })}
              />
            </div>
          </div>
        );
      })}
    </ListShell>
  );
}

function ProjectsStep({ data, draftHash, onChange }: { data: Portfolio; draftHash: string | null; onChange: (items: Project[]) => void }) {
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const items = data.projects;
  const update = (id: string, patch: Partial<Project>) => onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  return (
    <ListShell label="Projects" onAdd={() => onChange([{ id: uid("prj"), enabled: true, name: "", tagline: "", description: "", link: "", tech: [] }, ...items])}>
      {items.map((item, i) => {
        const tagKey = `prj-${item.id}`;
        return (
          <div key={item.id} className="border border-border p-3">
            <RowHeader title={item.name || "New Project"} enabled={isVisible(item)} onEnabledChange={(enabled) => update(item.id, { enabled })} onRemove={() => onChange(items.filter((x) => x.id !== item.id))} onMoveUp={i > 0 ? () => onChange(move(items, i, i - 1)) : undefined} onMoveDown={i < items.length - 1 ? () => onChange(move(items, i, i + 1)) : undefined} />
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Field label="Name" value={item.name} onChange={(v) => update(item.id, { name: v })} />
              <Field label="Year" value={item.year ?? ""} onChange={(v) => update(item.id, { year: v || undefined })} />
              <Field label="Link" value={item.link} onChange={(v) => update(item.id, { link: v })} />
              <Field label="Tagline" value={item.tagline} onChange={(v) => update(item.id, { tagline: v })} />
              <Field label="Description" value={item.description} onChange={(v) => update(item.id, { description: v })} multiline rows={3} span2 hash={draftHash} />
              <TagEditor tags={item.tech} inputValue={tagInputs[tagKey] ?? ""} onInputChange={(v) => setTagInputs((current) => ({ ...current, [tagKey]: v }))} onAdd={() => { const v = (tagInputs[tagKey] ?? "").trim(); if (!v) return; update(item.id, { tech: [...item.tech, v] }); setTagInputs((current) => ({ ...current, [tagKey]: "" })); }} onRemove={(idx) => update(item.id, { tech: item.tech.filter((_, j) => j !== idx) })} />
            </div>
          </div>
        );
      })}
    </ListShell>
  );
}

function CertificatesStep({ data, onChange }: { data: Portfolio; onChange: (items: Certificate[]) => void }) {
  const items = data.certificates;
  const update = (id: string, patch: Partial<Certificate>) => onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  return (
    <ListShell label="Certificates" onAdd={() => onChange([{ id: uid("cert"), enabled: true, name: "", issuer: "", year: "", tech: [] }, ...items])}>
      {items.map((item, i) => (
        <div key={item.id} className="border border-border p-3">
          <RowHeader title={item.name || "New Certificate"} enabled={isVisible(item)} onEnabledChange={(enabled) => update(item.id, { enabled })} onRemove={() => onChange(items.filter((x) => x.id !== item.id))} onMoveUp={i > 0 ? () => onChange(move(items, i, i - 1)) : undefined} onMoveDown={i < items.length - 1 ? () => onChange(move(items, i, i + 1)) : undefined} />
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field label="Name" value={item.name} onChange={(v) => update(item.id, { name: v })} />
            <Field label="Issuer" value={item.issuer} onChange={(v) => update(item.id, { issuer: v })} />
            <Field label="Year" value={item.year} onChange={(v) => update(item.id, { year: v })} />
            <Field label="Credential ID" value={item.credentialId ?? ""} onChange={(v) => update(item.id, { credentialId: v || undefined })} />
            <Field label="Link" value={item.link ?? ""} onChange={(v) => update(item.id, { link: v || undefined })} span2 />
          </div>
        </div>
      ))}
    </ListShell>
  );
}

function EducationStep({ data, draftHash, onChange }: { data: Portfolio; draftHash: string | null; onChange: (items: Education[]) => void }) {
  const items = data.education ?? [];
  const update = (id: string, patch: Partial<Education>) => onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  return (
    <ListShell label="Education" onAdd={() => onChange([{ id: uid("edu"), enabled: true, institution: "", degree: "", field: "", period: "", start: "", end: "" }, ...items])}>
      {items.map((item, i) => (
        <div key={item.id} className="border border-border p-3">
          <RowHeader title={item.degree || "New Education"} enabled={isVisible(item)} onEnabledChange={(enabled) => update(item.id, { enabled })} onRemove={() => onChange(items.filter((x) => x.id !== item.id))} onMoveUp={i > 0 ? () => onChange(move(items, i, i - 1)) : undefined} onMoveDown={i < items.length - 1 ? () => onChange(move(items, i, i + 1)) : undefined} />
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field label="Institution" value={item.institution} onChange={(v) => update(item.id, { institution: v })} />
            <Field label="Short Name" value={item.shortName ?? ""} onChange={(v) => update(item.id, { shortName: v || undefined })} />
            <Field label="Degree" value={item.degree} onChange={(v) => update(item.id, { degree: v })} />
            <Field label="Field" value={item.field} onChange={(v) => update(item.id, { field: v })} />
            <Field label="Start" value={item.start} onChange={(v) => update(item.id, { start: v })} />
            <Field label="End" value={item.end} onChange={(v) => update(item.id, { end: v })} />
            <Field label="Thesis" value={item.thesis ?? ""} onChange={(v) => update(item.id, { thesis: v || undefined })} multiline rows={2} span2 hash={draftHash} />
          </div>
        </div>
      ))}
    </ListShell>
  );
}

function ListShell({ label, onAdd, children }: { label: string; onAdd: () => void; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" className="chip flex items-center gap-1.5" onClick={onAdd}>
          <Plus size={12} /> Add {label}
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function RowHeader({
  title,
  enabled,
  onEnabledChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  title: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={onEnabledChange} aria-label={`Toggle visibility for ${title}`} />
        <button type="button" className="chip disabled:opacity-40" disabled={!onMoveUp} onClick={onMoveUp}>Up</button>
        <button type="button" className="chip disabled:opacity-40" disabled={!onMoveDown} onClick={onMoveDown}>Down</button>
        <button type="button" className="chip flex items-center gap-1.5" onClick={onRemove}>
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  );
}

function ReviewStep({ data, job, alias }: { data: Portfolio; job: JobContext; alias: string }) {
  const warnings = useMemo(() => {
    const next: string[] = [];
    if (!data.profile.name) next.push("Profile name is empty.");
    if (!data.profile.summary) next.push("Profile summary is empty.");
    if (!job.vacancyText) next.push("Job context is empty.");
    if (!data.coverLetters?.current?.content) next.push("Cover letter is not generated.");
    if (!alias) next.push("Alias is empty.");
    return next;
  }, [alias, data, job.vacancyText]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-border p-3">
          <p className={labelCls}>Public URL</p>
          <p className="font-mono">/{alias || "-"}</p>
        </div>
        <div className="border border-border p-3">
          <p className={labelCls}>Target job</p>
          <p className="text-sm font-medium">{job.role || "-"}</p>
          <p className="text-xs text-muted-foreground">{job.company || "-"}</p>
        </div>
        <div className="border border-border p-3">
          <p className={labelCls}>Profile</p>
          <p className="text-sm font-medium">{data.profile.name || "-"}</p>
          <p className="text-xs text-muted-foreground">{data.profile.title || "-"}</p>
        </div>
        <div className="border border-border p-3">
          <p className={labelCls}>Cover letter</p>
          <p className="text-sm">{data.coverLetters?.current?.content ? "Ready" : "Not generated"}</p>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {listSummary(data).map(([label, count]) => (
          <div key={label} className="border border-border p-3">
            <p className={labelCls}>{label}</p>
            <p className="font-mono text-lg">{count}</p>
          </div>
        ))}
      </div>
      {warnings.length > 0 && (
        <div className="border border-border p-3">
          <p className={labelCls}>Review</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}
      {data.coverLetters?.current?.content && (
        <details className="border border-border">
          <summary className="cursor-pointer p-3 text-sm font-medium">Cover letter preview</summary>
          <div className="border-t border-border p-3">
            <CoverLetterPanel coverLetter={data.coverLetters.current} />
          </div>
        </details>
      )}
    </div>
  );
}
