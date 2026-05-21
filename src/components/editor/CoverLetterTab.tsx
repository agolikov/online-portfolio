import { useState, useEffect, useRef } from "react";
import type { Portfolio } from "@/types/portfolio";
import { isCoverLetterVisible } from "@/lib/visibility";
import { resumesApi } from "@/lib/resumesApi";
import { toast } from "@/hooks/use-toast";
import { CoverLetterPanel } from "@/components/portfolio/CoverLetterPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Send, Sparkles } from "lucide-react";
import { inputCls, labelCls } from "./EditorSharedUtils";

export function CoverLetterTab({
  data,
  loadedHash,
  onChange,
}: {
  data: Portfolio;
  loadedHash: string | null;
  onChange: (data: Portfolio) => void;
}) {
  const [jobDescription, setJobDescription] = useState(data.coverLetters?.current?.vacancyText ?? "");
  const [recipientName, setRecipientName] = useState(data.coverLetters?.current?.recipientName ?? "");
  const [manualLetter, setManualLetter] = useState(data.coverLetters?.current?.content ?? "");
  const [followUpInstruction, setFollowUpInstruction] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [followingUp, setFollowingUp] = useState(false);
  const [streamingLetter, setStreamingLetter] = useState<string | null>(null);
  const savedLetterRef = useRef(data.coverLetters?.current?.content ?? "");
  const currentCoverLetter = data.coverLetters?.current;
  const coverVisible = isCoverLetterVisible(currentCoverLetter);

  useEffect(() => {
    setJobDescription(currentCoverLetter?.vacancyText ?? "");
    setRecipientName(currentCoverLetter?.recipientName ?? "");
    const content = currentCoverLetter?.content ?? "";
    setManualLetter(content);
    savedLetterRef.current = content;
  }, [currentCoverLetter]);

  async function generate() {
    if (!loadedHash || !jobDescription.trim()) return;
    setGenerating(true);
    setStreamingLetter("");
    try {
      await resumesApi.generateCoverLetterStream(loadedHash, jobDescription, recipientName, (event) => {
        if (event.type === "delta") {
          setStreamingLetter((prev) => (prev ?? "") + event.text);
        } else if (event.type === "done") {
          setStreamingLetter(null);
          setManualLetter(event.coverLetter);
          savedLetterRef.current = event.coverLetter;
          onChange({
            ...data,
            coverLetters: {
              ...data.coverLetters,
              current: {
                content: event.coverLetter,
                enabled: currentCoverLetter?.enabled ?? true,
                summary: event.summary,
                recipientName: event.recipientName ?? recipientName,
                vacancyText: event.vacancyText ?? jobDescription,
                metrics: event.metrics,
                generatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          });
          window.dispatchEvent(new CustomEvent("resume-data-changed", { detail: { hash: loadedHash } }));
          toast({ title: "Cover letter generated", description: "Saved to the loaded resume." });
        } else if (event.type === "error") {
          setStreamingLetter(null);
          toast({ title: "Failed to generate cover letter", description: event.message, variant: "destructive" });
        }
      });
    } catch {
      setStreamingLetter(null);
      toast({ title: "Failed to generate cover letter", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function editCoverLetter(action: "refine" | "longer" | "shorter") {
    if (!loadedHash || !manualLetter.trim() || generating || editingAction || followingUp) return;
    setEditingAction(action);
    setStreamingLetter("");
    try {
      await resumesApi.editCoverLetterStream(loadedHash, manualLetter, action, (event) => {
        if (event.type === "delta") {
          setStreamingLetter((prev) => (prev ?? "") + event.text);
        } else if (event.type === "done") {
          setStreamingLetter(null);
          setManualLetter(event.text);
        } else if (event.type === "error") {
          setStreamingLetter(null);
          toast({ title: "Failed to edit cover letter", description: event.message, variant: "destructive" });
        }
      });
    } catch {
      setStreamingLetter(null);
      toast({ title: "Failed to edit cover letter", variant: "destructive" });
    } finally {
      setEditingAction(null);
    }
  }

  async function applyFollowUp() {
    const instruction = followUpInstruction.trim();
    if (!loadedHash || !manualLetter.trim() || !instruction || generating || editingAction || followingUp) return;
    setFollowingUp(true);
    setFollowUpResponse("");
    let saved = false;
    let errorMessage = "";
    try {
      await resumesApi.chatStream(
        loadedHash,
        [
          {
            role: "user",
            content: [
              "Update and save the current cover letter for this resume.",
              "Use this cover letter as the source text:",
              manualLetter,
              `Follow-up edit instructions: ${instruction}`,
              "Return only a brief confirmation to the user, but call save_cover_letter with the full revised cover letter text.",
            ].join("\n"),
          },
        ],
        (event) => {
          if (event.type === "delta") {
            setFollowUpResponse((prev) => prev + event.text);
          } else if (event.type === "done") {
            saved = event.dataChanged || event.coverLetterSaved;
          } else if (event.type === "error") {
            errorMessage = event.message;
          }
        },
      );

      if (errorMessage) throw new Error(errorMessage);

      if (saved) {
        const row = await resumesApi.get(loadedHash);
        onChange(row.resumeData);
        window.dispatchEvent(new CustomEvent("resume-data-changed", { detail: { hash: loadedHash } }));
        setFollowUpInstruction("");
        toast({ title: "Follow-up edits applied", description: "Saved to the loaded resume." });
      } else {
        toast({
          title: "No cover letter changes saved",
          description: "Review the assistant response and try a more explicit instruction.",
        });
      }
    } catch (e) {
      toast({ title: "Failed to apply follow-up edits", description: String(e), variant: "destructive" });
    } finally {
      setFollowingUp(false);
    }
  }

  async function saveManual() {
    if (!loadedHash || !manualLetter.trim() || manualLetter === savedLetterRef.current) return;
    try {
      const result = await resumesApi.saveCoverLetter(loadedHash, manualLetter.trim(), jobDescription, recipientName);
      savedLetterRef.current = result.coverLetter;
      onChange({
        ...data,
        coverLetters: {
          ...data.coverLetters,
          current: {
            content: result.coverLetter,
            enabled: currentCoverLetter?.enabled ?? true,
            summary: result.summary,
            recipientName: result.recipientName ?? recipientName,
            vacancyText: result.vacancyText ?? jobDescription,
            metrics: result.metrics,
            generatedAt: data.coverLetters?.current?.generatedAt,
            updatedAt: new Date().toISOString(),
          },
        },
      });
      window.dispatchEvent(new CustomEvent("resume-data-changed", { detail: { hash: loadedHash } }));
    } catch {
      toast({ title: "Failed to save cover letter", variant: "destructive" });
    }
  }

  function toggleCoverVisible(enabled: boolean) {
    if (!currentCoverLetter) return;
    onChange({
      ...data,
      coverLetters: {
        ...data.coverLetters,
        current: {
          ...currentCoverLetter,
          enabled,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  if (!loadedHash) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        Load a resume from the <strong>Resumes</strong> tab first — generated cover letters are saved to a database
        resume.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {currentCoverLetter?.content && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3 bg-muted/30">
          <div>
            <p className="text-sm font-medium">Cover letter visibility</p>
            <p className="text-xs text-muted-foreground">
              Controls whether the saved cover letter appears on the main portfolio page.
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            {coverVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            <Switch
              checked={coverVisible}
              onCheckedChange={toggleCoverVisible}
              aria-label="Toggle cover letter visibility"
            />
          </span>
        </div>
      )}
      <div>
        <label className={labelCls} htmlFor="cover-job-desc">
          Job Description
        </label>
        <textarea
          id="cover-job-desc"
          rows={10}
          className={`${inputCls} resize-y`}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the vacancy text here..."
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="cover-recipient">
          Hiring manager or recruiter name
        </label>
        <input
          id="cover-recipient"
          className={inputCls}
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Optional, e.g. Anna Kowalska"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={!!generating || !!editingAction || followingUp || !jobDescription.trim()}
          className="chip flex items-center gap-1.5 disabled:opacity-40"
          data-active="true"
        >
          <Sparkles size={12} /> {generating ? "Generating..." : "Generate"}
        </button>
        {(
          [
            ["refine", "Refine"],
            ["longer", "Make Longer"],
            ["shorter", "Make Shorter"],
          ] as const
        ).map(([action, label]) => (
          <button
            key={action}
            type="button"
            onClick={() => editCoverLetter(action)}
            disabled={!!generating || !!editingAction || followingUp || !manualLetter.trim()}
            className="chip flex items-center gap-1.5 disabled:opacity-40"
          >
            {editingAction === action ? `${label}…` : label}
          </button>
        ))}
      </div>
      {currentCoverLetter?.content && (
        <div className="space-y-2">
          <label className={labelCls} htmlFor="cover-follow-up">
            Follow-up edits
          </label>
          <textarea
            id="cover-follow-up"
            rows={3}
            className={`${inputCls} resize-y`}
            value={followUpInstruction}
            onChange={(e) => setFollowUpInstruction(e.target.value)}
            placeholder="e.g. Make the opening more direct and mention React leadership."
            disabled={generating || !!editingAction || followingUp}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void applyFollowUp()}
              disabled={generating || !!editingAction || followingUp || !followUpInstruction.trim() || !manualLetter.trim()}
              className="chip flex items-center gap-1.5 disabled:opacity-40"
              data-active="true"
            >
              <Send size={12} /> {followingUp ? "Applying..." : "Apply Follow-up"}
            </button>
            {followUpResponse && (
              <span className="text-xs text-muted-foreground whitespace-pre-wrap">{followUpResponse}</span>
            )}
          </div>
        </div>
      )}
      <Tabs defaultValue="edit">
        <TabsList className="flex h-auto gap-1 bg-muted/50 p-1 w-fit">
          <TabsTrigger value="edit" className="text-xs uppercase tracking-widest">
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs uppercase tracking-widest">
            Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-2">
          {streamingLetter !== null ? (
            <div className={`${inputCls} resize-none min-h-[14rem] whitespace-pre-wrap text-muted-foreground`}>
              {streamingLetter}
              <span className="animate-pulse">▍</span>
            </div>
          ) : (
            <textarea
              rows={10}
              className={`${inputCls} resize-y`}
              value={manualLetter}
              onChange={(e) => setManualLetter(e.target.value)}
              onBlur={saveManual}
              placeholder="Write or paste a cover letter manually..."
              disabled={generating}
            />
          )}
        </TabsContent>
        <TabsContent value="preview" className="mt-2">
          {data.coverLetters?.current?.content ? (
            <CoverLetterPanel coverLetter={data.coverLetters.current} />
          ) : (
            <p className="text-sm text-muted-foreground">No cover letter saved yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
