import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import staticData from "@/data/portfolio.json";
import type { Portfolio, Experience, Project, Certificate, Education, Tech, Story } from "@/types/portfolio";
import type { TechSuggestion } from "@/lib/resumesApi";
import { clearPortfolioOverride, loadPortfolio, savePortfolioOverride } from "@/lib/portfolioStore";
import { resumesApi, type ResumeRow } from "@/lib/resumesApi";
import { isCoverLetterVisible, isStoryVisible, isVisible } from "@/lib/visibility";
import { ChatPane } from "@/components/portfolio/ChatPane";
import { CoverLetterPanel } from "@/components/portfolio/CoverLetterPanel";
import { ThemeProvider } from "@/context/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Save, RotateCcw, Download, Upload, Plus, Trash2,
  ChevronDown, ChevronUp, RefreshCw, X, Eye, EyeOff, Sparkles, ExternalLink,
} from "lucide-react";

const inputCls =
  "w-full bg-transparent border border-border px-3 py-2 text-sm outline-none focus:border-foreground placeholder:text-muted-foreground";
const labelCls = "block text-xs uppercase tracking-widest text-muted-foreground mb-1";
const LAST_LOADED_RESUME_KEY = "portfolio-edit-last-loaded-resume";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

// ── Shared field components ──────────────────────────────────────────────────

function RefineButton({ hash, value, onDone }: { hash?: string | null; value: string; onDone: (text: string) => void }) {
  const [busy, setBusy] = useState(false);
  if (!hash) return null;

  async function run() {
    if (busy || !value.trim()) return;
    setBusy(true);
    try {
      await resumesApi.refineTextStream(hash, value, (event) => {
        if (event.type === "done") onDone(event.text);
        else if (event.type === "error") toast({ title: "Refine failed", description: event.message, variant: "destructive" });
      });
    } catch {
      toast({ title: "Refine failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || !value.trim()}
      className="chip text-xs flex items-center gap-1 disabled:opacity-40"
    >
      <Sparkles size={10} /> {busy ? "Refining…" : "Refine"}
    </button>
  );
}

function Field({
  label, value, onChange, multiline = false, rows = 3, span2 = false, hash,
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; rows?: number; span2?: boolean; hash?: string | null;
}) {
  return (
    <div className={span2 ? "md:col-span-2" : ""}>
      {multiline ? (
        <div className="flex items-center justify-between mb-1">
          <span className="block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
          <RefineButton hash={hash} value={value} onDone={onChange} />
        </div>
      ) : (
        <label className={labelCls}>{label}</label>
      )}
      {multiline ? (
        <textarea rows={rows} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function TagEditor({
  tags, inputValue, onInputChange, onAdd, onRemove,
}: {
  tags: string[]; inputValue: string;
  onInputChange: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void;
}) {
  return (
    <div className="md:col-span-2">
      <label className={labelCls}>Tech</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((t, i) => (
            <span key={t + i} className="chip flex items-center gap-1" data-active="true">
              {t}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="opacity-60 hover:opacity-100 leading-none"
                aria-label={`Remove ${t}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={inputCls + " flex-1"}
          placeholder="Type a tag and press Enter…"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
        />
        <button type="button" onClick={onAdd} className="chip flex items-center gap-1 shrink-0">
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}

function HighlightRow({
  value, hash, onChange, onRemove,
}: {
  value: string; hash?: string | null;
  onChange: (v: string) => void; onRemove: () => void;
}) {
  return (
    <div className="flex gap-2">
      <textarea
        rows={2}
        className={`${inputCls} flex-1 resize-none`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-col gap-0.5 shrink-0 self-start pt-0.5">
        <RefineButton hash={hash} value={value} onDone={onChange} />
        <button type="button" onClick={onRemove} className="p-1.5 text-muted-foreground hover:text-destructive">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function HighlightEditor({
  highlights, onChange, onAdd, onRemove, hash,
}: {
  highlights: string[];
  onChange: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  hash?: string | null;
}) {
  return (
    <div className="md:col-span-2">
      <label className={labelCls}>Highlights</label>
      <div className="space-y-2">
        {highlights.map((h, i) => (
          <HighlightRow
            key={i}
            value={h}
            hash={hash}
            onChange={(v) => onChange(i, v)}
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>
      <button type="button" onClick={onAdd} className="mt-2 chip flex items-center gap-1">
        <Plus size={12} /> Add Highlight
      </button>
    </div>
  );
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

function CardHeader({
  title, subtitle, expanded, enabled = true, onToggle, onDelete, onEnabledChange, onMoveUp, onMoveDown,
}: {
  title: string; subtitle?: string; expanded: boolean;
  enabled?: boolean;
  onToggle: () => void; onDelete: () => void;
  onEnabledChange?: (enabled: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex-1 text-left flex items-center gap-2 min-w-0"
      >
        {expanded ? <ChevronUp size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />}
        <span className="font-medium text-sm truncate">{title}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
        )}
      </button>
      {onEnabledChange && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0" title="Show on main page">
          {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            aria-label={`Toggle visibility for ${title}`}
          />
        </label>
      )}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!onMoveUp}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
          aria-label="Move up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!onMoveDown}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
          aria-label="Move down"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Suggestion picker (autocomplete dropdown) ────────────────────────────────

function SuggestionPicker({
  placeholder,
  suggestions,
  onAdd,
}: {
  placeholder: string;
  suggestions: string[];
  onAdd: (v: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const matches = suggestions.filter((s) => s.toLowerCase().includes(q.toLowerCase()));

  function commit(val: string) {
    const v = val.trim();
    if (!v) return;
    onAdd(v);
    setQ("");
    setOpen(false);
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex gap-1.5">
      <input
        className={inputCls + " flex-1 text-sm"}
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(q); } }}
      />
      <button type="button" onClick={() => commit(q)} className="chip flex items-center gap-1 shrink-0">
        <Plus size={12} /> Add
      </button>
      {open && (matches.length > 0 || q.trim()) && (
        <div className="absolute z-20 top-full mt-1 left-0 right-[calc(theme(spacing.16)+theme(spacing.1.5))] bg-background border border-border rounded-md shadow-lg max-h-44 overflow-y-auto">
          {matches.slice(0, 20).map((s) => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              onMouseDown={(e) => { e.preventDefault(); commit(s); }}
            >
              {s}
            </button>
          ))}
          {q.trim() && !suggestions.find((s) => s.toLowerCase() === q.trim().toLowerCase()) && (
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm italic text-muted-foreground hover:bg-muted transition-colors"
              onMouseDown={(e) => { e.preventDefault(); commit(q); }}
            >
              Create "{q.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tech tab ─────────────────────────────────────────────────────────────────

function TechTab({
  tech,
  onChange,
}: {
  tech: Tech[];
  onChange: (t: Tech[]) => void;
}) {
  const [suggestions, setSuggestions] = useState<TechSuggestion[]>([]);

  useEffect(() => {
    resumesApi.getTechSuggestions().then(setSuggestions).catch(() => {});
  }, []);

  const categories = [...new Set(tech.map((t) => t.category))].sort();
  const usedCats = new Set(categories);
  const availableCats = [...new Set(suggestions.map((s) => s.category))]
    .filter((c) => !usedCats.has(c))
    .sort();

  function availableSkills(cat: string) {
    const used = new Set(tech.filter((t) => t.category === cat).map((t) => t.name));
    return suggestions.filter((s) => s.category === cat && !used.has(s.name)).map((s) => s.name);
  }

  function addCategory(cat: string) {
    const c = cat.trim();
    if (!c || usedCats.has(c)) return;
    // Add a placeholder skill so the category appears; user can rename it
    onChange([...tech, { name: "", category: c }]);
  }

  function removeCategory(cat: string) {
    if (!confirm(`Remove category "${cat}" and all its skills?`)) return;
    onChange(tech.filter((t) => t.category !== cat));
  }

  function addSkill(name: string, cat: string) {
    const n = name.trim();
    if (!n || tech.some((t) => t.name === n)) return;
    onChange([...tech, { name: n, category: cat }]);
  }

  function removeSkill(name: string) {
    onChange(tech.filter((t) => t.name !== name));
  }

  function updateSkillName(oldName: string, newName: string) {
    const n = newName.trim();
    if (!n) return;
    onChange(tech.map((t) => t.name === oldName ? { ...t, name: n } : t));
  }

  return (
    <div className="mt-6 space-y-6">
      {/* ── Categories ── */}
      <div>
        <p className={labelCls}>Categories</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((cat) => (
            <span key={cat} className="chip flex items-center gap-1" data-active="true">
              {cat}
              <button type="button" onClick={() => removeCategory(cat)} className="opacity-60 hover:opacity-100">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <SuggestionPicker
          placeholder="Add category…"
          suggestions={availableCats}
          onAdd={addCategory}
        />
      </div>

      <div className="border-t border-border" />

      {/* ── Skills grouped by category ── */}
      <div>
        <p className={labelCls}>Skills</p>
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Add a category above first.</p>
        )}
        <div className="space-y-5">
          {categories.map((cat) => {
            const skills = tech.filter((t) => t.category === cat);
            return (
              <div key={cat}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((t) => (
                    <span key={t.name} className="chip flex items-center gap-1 group" data-active="true">
                      {t.name === "" ? (
                        <input
                          autoFocus
                          className="bg-transparent outline-none w-24 text-xs"
                          placeholder="skill name…"
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (!v) { removeSkill(""); return; }
                            updateSkillName("", v);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                        />
                      ) : (
                        t.name
                      )}
                      <button type="button" onClick={() => removeSkill(t.name)} className="opacity-60 hover:opacity-100">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <SuggestionPicker
                  placeholder={`Add skill to ${cat}…`}
                  suggestions={availableSkills(cat)}
                  onAdd={(name) => addSkill(name, cat)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Stories tab ───────────────────────────────────────────────────────────────

const COMMON_QUESTIONS = [
  "Tell me about a time you led a difficult project.",
  "Describe a situation where you disagreed with a colleague. How did you handle it?",
  "Give an example of a time you had to meet a tight deadline.",
  "Tell me about your biggest professional failure and what you learned from it.",
  "Describe a time you had to learn something new quickly.",
  "How do you handle competing priorities?",
  "Tell me about a time you improved a process or workflow.",
  "Give an example of mentoring or coaching a colleague.",
  "Describe a time you had to give difficult feedback.",
  "Tell me about a situation where you showed initiative.",
  "How do you approach technical debt?",
  "Describe your experience working in an Agile/Scrum environment.",
  "Tell me about a time you had to make a difficult trade-off.",
  "Describe a time you had to communicate a complex technical concept to a non-technical audience.",
  "Give an example of a time you went beyond your job description to help the team.",
];

function StoriesTab({
  stories,
  onChange,
  hash,
}: {
  stories: Story[];
  onChange: (s: Story[]) => void;
  hash?: string | null;
}) {
  const [customQ, setCustomQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded((p) => {
      const s = new Set(p);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });
  }

  function addQuestion(question: string) {
    const id = uid("story");
    onChange([...stories, { id, enabled: true, question, answer: "" }]);
    setExpanded((p) => new Set([...p, id]));
  }

  function removeStory(id: string) {
    onChange(stories.filter((s) => s.id !== id));
  }

  function updateAnswer(id: string, answer: string) {
    onChange(stories.map((s) => s.id === id ? { ...s, answer } : s));
  }

  function toggleVisible(id: string, visible: boolean) {
    onChange(stories.map((s) => s.id === id ? { ...s, enabled: visible } : s));
  }

  const usedQuestions = new Set(stories.map((s) => s.question));

  return (
    <div className="mt-6 space-y-5">
      {/* Quick-add from common questions */}
      <div>
        <p className={labelCls}>Common Behavioral Questions</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_QUESTIONS.filter((q) => !usedQuestions.has(q)).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => addQuestion(q)}
              className="chip text-xs text-left"
            >
              <Plus size={10} className="shrink-0" /> {q}
            </button>
          ))}
        </div>
      </div>

      {/* Custom question */}
      <div className="flex gap-2">
        <input
          className={inputCls + " flex-1"}
          placeholder="Custom question…"
          value={customQ}
          onChange={(e) => setCustomQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && customQ.trim()) {
              addQuestion(customQ.trim());
              setCustomQ("");
            }
          }}
        />
        <button
          type="button"
          className="chip flex items-center gap-1.5 shrink-0"
          onClick={() => { if (customQ.trim()) { addQuestion(customQ.trim()); setCustomQ(""); } }}
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Story cards */}
      {stories.length === 0 && (
        <p className="text-sm text-muted-foreground">No stories yet — add a question above.</p>
      )}
      <div className="space-y-2">
        {stories.map((story, i) => {
          const isOpen = expanded.has(story.id);
          return (
            <div key={story.id} className="border border-border rounded-md overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
                <button
                  type="button"
                  className="flex-1 text-left flex items-center gap-2 min-w-0"
                  onClick={() => toggleExpanded(story.id)}
                >
                  {isOpen ? <ChevronUp size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />}
                  <span className="text-sm font-medium truncate">{story.question}</span>
                </button>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0" title="Show on main page">
                  {isStoryVisible(story) ? <Eye size={14} /> : <EyeOff size={14} />}
                  <Switch
                    checked={isStoryVisible(story)}
                    onCheckedChange={(checked) => toggleVisible(story.id, checked)}
                    aria-label="Toggle visibility for story"
                  />
                </label>
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onChange(move(stories, i, i - 1))}
                    disabled={i === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                    aria-label="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(move(stories, i, i + 1))}
                    disabled={i === stories.length - 1}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                    aria-label="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStory(story.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Remove story"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="px-4 py-3 space-y-1.5">
                  <div className="flex justify-end">
                    <RefineButton hash={hash} value={story.answer} onDone={(text) => updateAnswer(story.id, text)} />
                  </div>
                  <textarea
                    rows={5}
                    className={`${inputCls} resize-none`}
                    placeholder="Your answer using the STAR method (Situation → Task → Action → Result)…"
                    value={story.answer}
                    onChange={(e) => updateAnswer(story.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Cover letter tab ─────────────────────────────────────────────────────────

function CoverLetterTab({
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
  const [generating, setGenerating] = useState(false);
  const [editingAction, setEditingAction] = useState<string | null>(null);
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
    if (!loadedHash || !manualLetter.trim() || generating || editingAction) return;
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
        Load a resume from the <strong>Resumes</strong> tab first — generated cover letters are saved to a database resume.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {currentCoverLetter?.content && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3 bg-muted/30">
          <div>
            <p className="text-sm font-medium">Cover letter visibility</p>
            <p className="text-xs text-muted-foreground">Controls whether the saved cover letter appears on the main portfolio page.</p>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            {coverVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            <Switch
              checked={coverVisible}
              onCheckedChange={toggleCoverVisible}
              aria-label="Toggle cover letter visibility"
            />
          </label>
        </div>
      )}
      <div>
        <label className={labelCls}>Job Description</label>
        <textarea
          rows={10}
          className={inputCls + " resize-y"}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the vacancy text here..."
        />
      </div>
      <div>
        <label className={labelCls}>Hiring manager or recruiter name</label>
        <input
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
          disabled={!!generating || !!editingAction || !jobDescription.trim()}
          className="chip flex items-center gap-1.5 disabled:opacity-40"
          data-active="true"
        >
          <Sparkles size={12} /> {generating ? "Generating..." : "Generate"}
        </button>
        {([
          ["refine", "Refine"],
          ["longer", "Make Longer"],
          ["shorter", "Make Shorter"],
        ] as const).map(([action, label]) => (
          <button
            key={action}
            type="button"
            onClick={() => editCoverLetter(action)}
            disabled={!!generating || !!editingAction || !manualLetter.trim()}
            className="chip flex items-center gap-1.5 disabled:opacity-40"
          >
            {editingAction === action ? `${label}…` : label}
          </button>
        ))}
      </div>
      <Tabs defaultValue="edit">
        <TabsList className="flex h-auto gap-1 bg-muted/50 p-1 w-fit">
          <TabsTrigger value="edit" className="text-xs uppercase tracking-widest">Edit</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs uppercase tracking-widest">Preview</TabsTrigger>
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
          {data.coverLetters?.current?.content
            ? <CoverLetterPanel coverLetter={data.coverLetters.current} />
            : <p className="text-sm text-muted-foreground">No cover letter saved yet.</p>
          }
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Inline note editor ───────────────────────────────────────────────────────

function NoteInput({ hash, initial }: { hash: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const savedRef = useRef(initial);

  useEffect(() => {
    setValue(initial);
    savedRef.current = initial;
  }, [initial]);

  async function handleBlur() {
    if (value === savedRef.current) return;
    try {
      await resumesApi.updateNote(hash, value);
      savedRef.current = value;
    } catch {
      toast({ title: "Failed to save note", variant: "destructive" });
      setValue(savedRef.current);
    }
  }

  return (
    <textarea
      rows={2}
      className="w-full text-xs text-muted-foreground bg-transparent border border-transparent hover:border-border focus:border-foreground outline-none placeholder:text-muted-foreground/40 transition-colors resize-none rounded px-1.5 py-1 leading-relaxed"
      placeholder="Add a note…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
}

// ── Inline alias editor ──────────────────────────────────────────────────────

function AliasInput({ hash, initial, onSaved }: { hash: string; initial: string | null; onSaved: (alias: string | null) => void }) {
  const [value, setValue] = useState(initial ?? "");
  const savedRef = useRef(initial ?? "");

  useEffect(() => {
    setValue(initial ?? "");
    savedRef.current = initial ?? "";
  }, [initial]);

  async function handleBlur() {
    const next = value.trim();
    if (next === savedRef.current) return;
    try {
      const row = await resumesApi.updateAlias(hash, next || null);
      savedRef.current = next;
      onSaved(row.alias);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("409") || msg.toLowerCase().includes("already in use")) {
        toast({ title: "Alias already in use", description: "Choose a different alias.", variant: "destructive" });
      } else if (msg.includes("400")) {
        toast({ title: "Invalid alias", description: "Lowercase letters, numbers, and hyphens only.", variant: "destructive" });
      } else {
        toast({ title: "Failed to save alias", variant: "destructive" });
      }
      setValue(savedRef.current);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground/60 shrink-0">/</span>
      <input
        className="flex-1 text-xs text-muted-foreground bg-transparent border border-transparent hover:border-border focus:border-foreground outline-none placeholder:text-muted-foreground/40 transition-colors rounded px-1.5 py-0.5 font-mono"
        placeholder="alias (optional)"
        value={value}
        onChange={(e) => setValue(e.target.value.toLowerCase())}
        onBlur={handleBlur}
      />
    </div>
  );
}

// ── Resumes manager tab ──────────────────────────────────────────────────────

function ResumesTab({
  currentData,
  loadedHash,
  onLoad,
}: {
  currentData: Portfolio;
  loadedHash: string | null;
  onLoad: (p: Portfolio, hash: string) => void;
}) {
  const [rows, setRows] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setRows(await resumesApi.list());
    } catch {
      toast({ title: "Failed to load resumes", description: "Is the API server running?", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function createFromCurrent() {
    try {
      await resumesApi.create(currentData);
      await refresh();
      toast({ title: "Resume created" });
    } catch (e) {
      toast({ title: "Failed to create", description: String(e), variant: "destructive" });
    }
  }

  async function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "")) as Portfolio;
        await resumesApi.create(parsed);
        await refresh();
        toast({ title: "Imported", description: file.name });
      } catch {
        toast({ title: "Import failed", description: "Invalid JSON", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  }

  async function toggleRow(hash: string) {
    try {
      await resumesApi.toggle(hash);
      await refresh();
    } catch (e) {
      toast({ title: "Toggle failed", description: String(e), variant: "destructive" });
    }
  }

  async function setDefaultRow(hash: string) {
    try {
      await resumesApi.setDefault(hash);
      await refresh();
      toast({ title: "Default resume set", description: `/${hash} data will be used on the home page.` });
    } catch (e) {
      toast({ title: "Set default failed", description: String(e), variant: "destructive" });
    }
  }



  function loadRow(row: ResumeRow) {
    onLoad(row.resumeData, row.hash);
    toast({ title: "Loaded", description: `Resume ${row.hash} loaded into editor.` });
  }

  async function deleteRow(hash: string) {
    if (!confirm(`Delete resume ${hash}? This cannot be undone.`)) return;
    try {
      await resumesApi.remove(hash);
      await refresh();
      toast({ title: "Deleted" });
    } catch (e) {
      toast({ title: "Delete failed", description: String(e), variant: "destructive" });
    }
  }

  function handleAliasSaved(hash: string, alias: string | null) {
    setRows((prev) => prev.map((r) => (r.hash === hash ? { ...r, alias } : r)));
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={createFromCurrent} className="chip flex items-center gap-1.5" data-active="true">
          <Plus size={12} /> Create from current
        </button>
        <label className="chip flex items-center gap-1.5 cursor-pointer">
          <Upload size={12} /> Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={importJson} />
        </label>
        <button onClick={refresh} className="chip flex items-center gap-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No resumes yet. Create one from the current editor data.</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          {rows.map((row, i) => {
            const isLoaded = row.hash === loadedHash;
            return (
              <div
                key={row.hash}
                className={`px-4 py-3 flex flex-wrap items-start gap-3 transition-colors ${i > 0 ? "border-t border-border" : ""} ${isLoaded ? "bg-primary/5" : ""}`}
                style={isLoaded ? { borderLeft: "3px solid hsl(var(--primary))" } : { borderLeft: "3px solid transparent" }}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{row.hash}</span>
                    {row.alias && (
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary">/{row.alias}</span>
                    )}
                    {isLoaded && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium">
                        active
                      </span>
                    )}
                    {row.isDefault && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-600 text-white font-medium">
                        default
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{(row.resumeData as Portfolio).profile?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</p>
                  <NoteInput hash={row.hash} initial={row.note ?? ""} />
                  <AliasInput hash={row.hash} initial={row.alias} onSaved={(alias) => handleAliasSaved(row.hash, alias)} />
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5" title="Toggle public access">
                    <span className="text-xs text-muted-foreground">{row.enabled ? "On" : "Off"}</span>
                    <Switch
                      checked={row.enabled}
                      onCheckedChange={() => toggleRow(row.hash)}
                      aria-label="Toggle enabled"
                    />
                  </div>
                  <button onClick={() => loadRow(row)} className="chip flex items-center gap-1" title="Load into editor">
                    <Download size={11} /> Active
                  </button>
                  <a
                    href={`/${row.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chip flex items-center gap-1"
                    title="Open resume page in new tab"
                  >
                    <ExternalLink size={11} /> Open
                  </a>
                  {!row.isDefault && (
                    <button
                      onClick={() => setDefaultRow(row.hash)}
                      disabled={!row.enabled}
                      className="chip flex items-center gap-1 disabled:opacity-40"
                      title={row.enabled ? "Use this resume on the home page" : "Enable resume before setting it as default"}
                    >
                      <Save size={11} /> Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteRow(row.hash)}
                    className="chip flex items-center gap-1 text-destructive border-destructive/30"
                    title="Delete"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Summary field with AI actions ────────────────────────────────────────────

const SUMMARY_ACTIONS = [
  { action: "expand",   label: "Add more details" },
  { action: "condense", label: "Add less details" },
  { action: "rebuild",  label: "Rebuild" },
] as const;

function SummaryField({
  value,
  loadedHash,
  onChange,
}: {
  value: string;
  loadedHash: string | null;
  onChange: (v: string) => void;
}) {
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [prev, setPrev] = useState<string | null>(null);

  async function run(action: "expand" | "condense" | "rebuild") {
    if (!loadedHash || busy) return;
    setPrev(value);
    setBusy(true);
    setStreaming("");
    try {
      await resumesApi.editSummaryStream(loadedHash, action, (event) => {
        if (event.type === "delta") setStreaming((p) => (p ?? "") + event.text);
        else if (event.type === "done") { onChange(event.text); setStreaming(null); }
        else if (event.type === "error") {
          setStreaming(null);
          toast({ title: "Failed to edit summary", description: event.message, variant: "destructive" });
        }
      });
    } catch {
      setStreaming(null);
      toast({ title: "Failed to edit summary", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  function revert() {
    if (prev === null) return;
    onChange(prev);
    setPrev(null);
  }

  return (
    <div className="md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <label className={labelCls}>Summary</label>
        {loadedHash && (
          <div className="flex flex-wrap gap-1">
            {SUMMARY_ACTIONS.map(({ action, label }) => (
              <button
                key={action}
                type="button"
                onClick={() => run(action)}
                disabled={busy}
                className="chip text-xs flex items-center gap-1 disabled:opacity-40"
              >
                <Sparkles size={10} /> {busy ? `${label}…` : label}
              </button>
            ))}
            {prev !== null && (
              <button
                type="button"
                onClick={revert}
                disabled={busy}
                className="chip text-xs flex items-center gap-1"
              >
                <RotateCcw size={10} /> Revert
              </button>
            )}
          </div>
        )}
      </div>
      {streaming !== null ? (
        <div className={`${inputCls} min-h-[6rem] whitespace-pre-wrap text-muted-foreground`}>
          {streaming}<span className="animate-pulse">▍</span>
        </div>
      ) : (
        <textarea rows={5} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

// ── Main editor body ─────────────────────────────────────────────────────────

function EditBody() {
  const [data, setData] = useState<Portfolio>(() => loadPortfolio());
  const [expanded, setExpanded] = useState<Record<string, Set<string>>>({
    exp: new Set(), proj: new Set(), cert: new Set(), edu: new Set(),
  });
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  // DB-loaded resume tracking
  const [loadedHash, setLoadedHash] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const lastSavedRef = useRef<string>("");

  function handleLoad(p: Portfolio, hash: string) {
    lastSavedRef.current = JSON.stringify(p); // mark current state as "already saved"
    setData(p);
    savePortfolioOverride(p);
    setLoadedHash(hash);
    localStorage.setItem(LAST_LOADED_RESUME_KEY, hash);
    setAutoSaveState("idle");
  }

  useEffect(() => {
    const lastHash = localStorage.getItem(LAST_LOADED_RESUME_KEY);
    if (!lastHash) return;
    let mounted = true;
    resumesApi.list()
      .then((rows) => {
        if (!mounted) return;
        const row = rows.find((r) => r.hash === lastHash);
        if (row) handleLoad(row.resumeData, row.hash);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  // Reload data when AI chat mutates the resume in the background
  useEffect(() => {
    if (!loadedHash) return;
    const handler = async (e: Event) => {
      const { hash } = (e as CustomEvent<{ hash: string }>).detail;
      if (hash !== loadedHash) return;
      try {
        const row = await resumesApi.get(loadedHash);
        handleLoad(row.resumeData, row.hash);
      } catch { /* silent */ }
    };
    window.addEventListener("resume-data-changed", handler);
    return () => window.removeEventListener("resume-data-changed", handler);
  }, [loadedHash]);

  // Auto-save to DB when data changes and a resume is loaded
  useEffect(() => {
    if (!loadedHash) return;
    const json = JSON.stringify(data);
    if (json === lastSavedRef.current) return; // nothing changed
    setAutoSaveState("pending");
    const timer = setTimeout(async () => {
      setAutoSaveState("saving");
      try {
        await resumesApi.update(loadedHash, data);
        lastSavedRef.current = json;
        setAutoSaveState("saved");
      } catch {
        setAutoSaveState("error");
        toast({ title: "Auto-save failed", variant: "destructive" });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, loadedHash]);

  // helpers
  function toggleExpanded(section: string, id: string) {
    setExpanded((prev) => {
      const s = new Set(prev[section]);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return { ...prev, [section]: s };
    });
  }
  function isOpen(section: string, id: string) {
    return expanded[section]?.has(id) ?? false;
  }
  function tagVal(key: string) { return tagInputs[key] ?? ""; }
  function setTagVal(key: string, v: string) {
    setTagInputs((s) => ({ ...s, [key]: v }));
  }
  function commitTag(key: string, current: string[], setter: (t: string[]) => void) {
    const v = tagVal(key).trim();
    if (!v || current.includes(v)) return;
    setter([...current, v]);
    setTagVal(key, "");
  }

  // profile
  const sp = (patch: Partial<Portfolio["profile"]>) =>
    setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));

  // tech list
  const setTech = (tech: Tech[]) => setData((d) => ({ ...d, tech }));

  // stories
  const setStories = (stories: Story[]) => setData((d) => ({ ...d, stories }));

  // experience
  const ue = (id: string, patch: Partial<Experience>) =>
    setData((d) => ({ ...d, experience: d.experience.map((e) => e.id === id ? { ...e, ...patch } : e) }));
  const addExp = () => {
    const id = uid("exp");
    setData((d) => ({
      ...d,
      experience: [{ id, enabled: true, company: "", role: "", period: "", start: "", end: "", location: "", highlights: [], tech: [] }, ...d.experience],
    }));
    setExpanded((p) => ({ ...p, exp: new Set([...p.exp, id]) }));
  };
  const removeExp = (id: string) =>
    setData((d) => ({ ...d, experience: d.experience.filter((e) => e.id !== id) }));

  // projects
  const up = (id: string, patch: Partial<Project>) =>
    setData((d) => ({ ...d, projects: d.projects.map((p) => p.id === id ? { ...p, ...patch } : p) }));
  const addProj = () => {
    const id = uid("prj");
    setData((d) => ({ ...d, projects: [{ id, enabled: true, name: "", tagline: "", description: "", link: "", tech: [] }, ...d.projects] }));
    setExpanded((p) => ({ ...p, proj: new Set([...p.proj, id]) }));
  };
  const removeProj = (id: string) =>
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));

  // certificates
  const uc = (id: string, patch: Partial<Certificate>) =>
    setData((d) => ({ ...d, certificates: d.certificates.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  const addCert = () => {
    const id = uid("cert");
    setData((d) => ({ ...d, certificates: [{ id, enabled: true, name: "", issuer: "", year: "", tech: [] }, ...d.certificates] }));
    setExpanded((p) => ({ ...p, cert: new Set([...p.cert, id]) }));
  };
  const removeCert = (id: string) =>
    setData((d) => ({ ...d, certificates: d.certificates.filter((c) => c.id !== id) }));

  // education
  const edu = data.education ?? [];
  const uEdu = (id: string, patch: Partial<Education>) =>
    setData((d) => ({ ...d, education: (d.education ?? []).map((e) => e.id === id ? { ...e, ...patch } : e) }));
  const addEdu = () => {
    const id = uid("edu");
    setData((d) => ({ ...d, education: [{ id, enabled: true, institution: "", degree: "", field: "", period: "", start: "", end: "" }, ...(d.education ?? [])] }));
    setExpanded((p) => ({ ...p, edu: new Set([...p.edu, id]) }));
  };
  const removeEdu = (id: string) =>
    setData((d) => ({ ...d, education: (d.education ?? []).filter((e) => e.id !== id) }));

  // toolbar actions
  function save() {
    savePortfolioOverride(data);
    toast({ title: "Saved", description: "Live preview updated." });
  }
  function reset() {
    if (!confirm("Reset to bundled portfolio.json? This clears your local override.")) return;
    clearPortfolioOverride();
    setData(staticData as unknown as Portfolio);
    setLoadedHash(null);
    localStorage.removeItem(LAST_LOADED_RESUME_KEY);
    lastSavedRef.current = "";
    setAutoSaveState("idle");
    toast({ title: "Reset", description: "Reverted to bundled data." });
  }
  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "portfolio.json"; a.click();
    URL.revokeObjectURL(url);
  }
  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setData(JSON.parse(String(reader.result ?? "")));
        toast({ title: "Imported", description: file.name });
      } catch {
        toast({ title: "Import failed", description: "Invalid JSON", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen px-3 py-6 md:px-6 md:py-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/" className="chip flex items-center gap-1.5"><ArrowLeft size={12} /> Back</Link>
            <h1 className="text-xl font-semibold">Edit Resume</h1>
            <span className="chip" data-active="true">DEV ONLY</span>
            {loadedHash && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{loadedHash}</span>
                {autoSaveState === "pending" && <span>unsaved</span>}
                {autoSaveState === "saving" && <span>saving…</span>}
                {autoSaveState === "saved" && <span className="text-green-600 dark:text-green-400">saved</span>}
                {autoSaveState === "error" && <span className="text-destructive">save failed</span>}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="chip flex items-center gap-1.5 cursor-pointer">
              <Upload size={12} /> Import
              <input type="file" accept="application/json" className="hidden" onChange={upload} />
            </label>
            <button onClick={download} className="chip flex items-center gap-1.5">
              <Download size={12} /> Export JSON
            </button>
<button onClick={reset} className="chip flex items-center gap-1.5">
              <RotateCcw size={12} /> Reset
            </button>
            <button onClick={save} className="chip flex items-center gap-1.5" data-active="true">
              <Save size={12} /> Save
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Edits are saved to <strong>localStorage</strong> for live preview (hit <strong>Save</strong>).
          Go to the <strong>Resumes</strong> tab to publish to the database and get a shareable link.
          {loadedHash
            ? <> Editing DB resume <code className="font-mono text-xs">{loadedHash}</code> — changes auto-save after 1.5 s.</>
            : <> No DB resume loaded — use <strong>Load</strong> in the Resumes tab to start editing one.</>
          }
        </p>

        <Tabs defaultValue="resumes">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {([
              ["resumes", "resumes"],
              ["cover", "cover"],
              ["chat", "chat"],
              ["profile", "profile"],
              ["tech", "tech"],
              ["experience", "experience"],
              ["certificates", "certificates"],
              ["projects", "side projects"],
              ["education", "education"],
              ["stories", "stories"],
            ] as const).map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="text-xs uppercase tracking-widest">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── RESUMES ── */}
          <TabsContent value="resumes">
            <ResumesTab currentData={data} loadedHash={loadedHash} onLoad={handleLoad} />
          </TabsContent>

          {/* ── COVER LETTER ── */}
          <TabsContent value="cover">
            <CoverLetterTab data={data} loadedHash={loadedHash} onChange={setData} />
          </TabsContent>

          {/* ── CHAT ── */}
          <TabsContent value="chat">
            {loadedHash ? (
              <ChatPane hash={loadedHash} messagesHeight="28rem" />
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                Load a resume from the <strong>Resumes</strong> tab first — the AI needs a specific resume as context.
              </p>
            )}
          </TabsContent>

          {/* ── PROFILE ── */}
          <TabsContent value="profile" className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border px-4 py-3 bg-muted/30">
              <div>
                <p className="text-sm font-medium">Hide years</p>
                <p className="text-xs text-muted-foreground">Suppress years on projects, certificates, and education in public view and PDF.</p>
              </div>
              <Switch
                checked={data.settings?.hideYears ?? false}
                onCheckedChange={(v) => setData((d) => ({ ...d, settings: { ...d.settings, hideYears: v } }))}
                aria-label="Hide years"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" value={data.profile.name} onChange={(v) => sp({ name: v })} />
            <Field label="Title" value={data.profile.title} onChange={(v) => sp({ title: v })} />
            <Field label="Location" value={data.profile.location} onChange={(v) => sp({ location: v })} />
            <Field label="Email" value={data.profile.email} onChange={(v) => sp({ email: v })} />
            <Field label="Website" value={data.profile.website} onChange={(v) => sp({ website: v })} />
            <Field label="GitHub" value={data.profile.github} onChange={(v) => sp({ github: v })} />
            <Field label="LinkedIn" value={data.profile.linkedin} onChange={(v) => sp({ linkedin: v })} />
            <SummaryField value={data.profile.summary} loadedHash={loadedHash} onChange={(v) => sp({ summary: v })} />
            </div>
          </TabsContent>

          {/* ── TECH ── */}
          <TabsContent value="tech">
            <TechTab tech={data.tech} onChange={setTech} />
          </TabsContent>

          {/* ── EXPERIENCE ── */}
          <TabsContent value="experience" className="mt-6">
            <div className="mb-3 flex justify-end">
              <button onClick={addExp} className="chip flex items-center gap-1.5">
                <Plus size={12} /> Add Experience
              </button>
            </div>
            <div className="space-y-2">
              {data.experience.map((e, i) => {
                const open = isOpen("exp", e.id);
                const tk = `exp-${e.id}`;
                return (
	                  <div key={e.id} className="border border-border rounded-md overflow-hidden">
	                    <CardHeader
	                      title={e.role || "New Experience"}
	                      subtitle={e.company ? `@ ${e.company}` : undefined}
	                      expanded={open}
	                      enabled={isVisible(e)}
	                      onToggle={() => toggleExpanded("exp", e.id)}
	                      onDelete={() => removeExp(e.id)}
	                      onEnabledChange={(enabled) => ue(e.id, { enabled })}
	                      onMoveUp={i > 0 ? () => setData((d) => ({ ...d, experience: move(d.experience, i, i - 1) })) : undefined}
	                      onMoveDown={i < data.experience.length - 1 ? () => setData((d) => ({ ...d, experience: move(d.experience, i, i + 1) })) : undefined}
	                    />
                    {open && (
                      <div className="px-4 py-4 grid gap-4 md:grid-cols-2">
                        <Field label="Company" value={e.company} onChange={(v) => ue(e.id, { company: v })} />
                        <Field label="Company URL" value={e.companyUrl ?? ""} onChange={(v) => ue(e.id, { companyUrl: v || undefined })} />
                        <Field label="Role" value={e.role} onChange={(v) => ue(e.id, { role: v })} />
                        <Field label="Period" value={e.period} onChange={(v) => ue(e.id, { period: v })} />
                        <Field label="Location" value={e.location} onChange={(v) => ue(e.id, { location: v })} />
                        <Field label="Start (YYYY-MM)" value={e.start} onChange={(v) => ue(e.id, { start: v })} />
                        <Field label="End (YYYY-MM or present)" value={e.end} onChange={(v) => ue(e.id, { end: v })} />
                        <HighlightEditor
                          highlights={e.highlights}
                          onChange={(i, v) => ue(e.id, { highlights: e.highlights.map((h, idx) => idx === i ? v : h) })}
                          onAdd={() => ue(e.id, { highlights: [...e.highlights, ""] })}
                          onRemove={(i) => ue(e.id, { highlights: e.highlights.filter((_, idx) => idx !== i) })}
                          hash={loadedHash}
                        />
                        <TagEditor
                          tags={e.tech}
                          inputValue={tagVal(tk)}
                          onInputChange={(v) => setTagVal(tk, v)}
                          onAdd={() => commitTag(tk, e.tech, (t) => ue(e.id, { tech: t }))}
                          onRemove={(i) => ue(e.id, { tech: e.tech.filter((_, idx) => idx !== i) })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── SIDE PROJECTS ── */}
          <TabsContent value="projects" className="mt-6">
            <div className="mb-3 flex justify-end">
              <button onClick={addProj} className="chip flex items-center gap-1.5">
                <Plus size={12} /> Add Side Project
              </button>
            </div>
            <div className="space-y-2">
              {data.projects.map((p, i) => {
                const open = isOpen("proj", p.id);
                const tk = `proj-${p.id}`;
                return (
	                  <div key={p.id} className="border border-border rounded-md overflow-hidden">
	                    <CardHeader
	                      title={p.name || "New Side Project"}
	                      subtitle={p.tagline || undefined}
	                      expanded={open}
	                      enabled={isVisible(p)}
	                      onToggle={() => toggleExpanded("proj", p.id)}
	                      onDelete={() => removeProj(p.id)}
	                      onEnabledChange={(enabled) => up(p.id, { enabled })}
	                      onMoveUp={i > 0 ? () => setData((d) => ({ ...d, projects: move(d.projects, i, i - 1) })) : undefined}
	                      onMoveDown={i < data.projects.length - 1 ? () => setData((d) => ({ ...d, projects: move(d.projects, i, i + 1) })) : undefined}
	                    />
                    {open && (
                      <div className="px-4 py-4 grid gap-4 md:grid-cols-2">
                        <Field label="Name" value={p.name} onChange={(v) => up(p.id, { name: v })} />
                        <Field label="Year" value={p.year ?? ""} onChange={(v) => up(p.id, { year: v || undefined })} />
                        <Field label="Link" value={p.link} onChange={(v) => up(p.id, { link: v })} />
                        <Field label="Tagline" value={p.tagline} onChange={(v) => up(p.id, { tagline: v })} span2 />
                        <Field label="Description" value={p.description} onChange={(v) => up(p.id, { description: v })} multiline rows={3} span2 hash={loadedHash} />
                        <TagEditor
                          tags={p.tech}
                          inputValue={tagVal(tk)}
                          onInputChange={(v) => setTagVal(tk, v)}
                          onAdd={() => commitTag(tk, p.tech, (t) => up(p.id, { tech: t }))}
                          onRemove={(i) => up(p.id, { tech: p.tech.filter((_, idx) => idx !== i) })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── CERTIFICATES ── */}
          <TabsContent value="certificates" className="mt-6">
            <div className="mb-3 flex justify-end">
              <button onClick={addCert} className="chip flex items-center gap-1.5">
                <Plus size={12} /> Add Certificate
              </button>
            </div>
            <div className="space-y-2">
              {data.certificates.map((c, i) => {
                const open = isOpen("cert", c.id);
                const tk = `cert-${c.id}`;
                return (
	                  <div key={c.id} className="border border-border rounded-md overflow-hidden">
	                    <CardHeader
	                      title={c.name || "New Certificate"}
	                      subtitle={c.issuer || undefined}
	                      expanded={open}
	                      enabled={isVisible(c)}
	                      onToggle={() => toggleExpanded("cert", c.id)}
	                      onDelete={() => removeCert(c.id)}
	                      onEnabledChange={(enabled) => uc(c.id, { enabled })}
	                      onMoveUp={i > 0 ? () => setData((d) => ({ ...d, certificates: move(d.certificates, i, i - 1) })) : undefined}
	                      onMoveDown={i < data.certificates.length - 1 ? () => setData((d) => ({ ...d, certificates: move(d.certificates, i, i + 1) })) : undefined}
	                    />
                    {open && (
                      <div className="px-4 py-4 grid gap-4 md:grid-cols-2">
                        <Field label="Name" value={c.name} onChange={(v) => uc(c.id, { name: v })} span2 />
                        <Field label="Issuer" value={c.issuer} onChange={(v) => uc(c.id, { issuer: v })} />
                        <Field label="Year" value={c.year} onChange={(v) => uc(c.id, { year: v })} />
                        <Field label="Credential ID" value={c.credentialId ?? ""} onChange={(v) => uc(c.id, { credentialId: v || undefined })} />
                        <Field label="Link" value={c.link ?? ""} onChange={(v) => uc(c.id, { link: v || undefined })} />
                        <TagEditor
                          tags={c.tech ?? []}
                          inputValue={tagVal(tk)}
                          onInputChange={(v) => setTagVal(tk, v)}
                          onAdd={() => commitTag(tk, c.tech ?? [], (t) => uc(c.id, { tech: t }))}
                          onRemove={(i) => uc(c.id, { tech: (c.tech ?? []).filter((_, idx) => idx !== i) })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── EDUCATION ── */}
          <TabsContent value="education" className="mt-6">
            <div className="mb-3 flex justify-end">
              <button onClick={addEdu} className="chip flex items-center gap-1.5">
                <Plus size={12} /> Add Education
              </button>
            </div>
            <div className="space-y-2">
              {edu.map((e, i) => {
                const open = isOpen("edu", e.id);
                return (
	                  <div key={e.id} className="border border-border rounded-md overflow-hidden">
	                    <CardHeader
	                      title={e.degree || "New Education"}
	                      subtitle={(e.shortName ?? e.institution) || undefined}
	                      expanded={open}
	                      enabled={isVisible(e)}
	                      onToggle={() => toggleExpanded("edu", e.id)}
	                      onDelete={() => removeEdu(e.id)}
	                      onEnabledChange={(enabled) => uEdu(e.id, { enabled })}
	                      onMoveUp={i > 0 ? () => setData((d) => ({ ...d, education: move(d.education ?? [], i, i - 1) })) : undefined}
	                      onMoveDown={i < edu.length - 1 ? () => setData((d) => ({ ...d, education: move(d.education ?? [], i, i + 1) })) : undefined}
	                    />
                    {open && (
                      <div className="px-4 py-4 grid gap-4 md:grid-cols-2">
                        <Field label="Institution" value={e.institution} onChange={(v) => uEdu(e.id, { institution: v })} span2 />
                        <Field label="Short Name" value={e.shortName ?? ""} onChange={(v) => uEdu(e.id, { shortName: v || undefined })} />
                        <Field label="Degree" value={e.degree} onChange={(v) => uEdu(e.id, { degree: v })} />
                        <Field label="Field of Study" value={e.field} onChange={(v) => uEdu(e.id, { field: v })} span2 />
                        <Field label="Start (YYYY-MM)" value={e.start} onChange={(v) => uEdu(e.id, { start: v })} />
                        <Field label="End (YYYY-MM)" value={e.end} onChange={(v) => uEdu(e.id, { end: v })} />
                        <div className="md:col-span-2 flex items-center justify-between rounded-md border border-border px-3 py-2 bg-muted/20">
                          <span className="text-xs text-muted-foreground">Show dates on public view</span>
                          <Switch
                            checked={e.showDates !== false}
                            onCheckedChange={(v) => uEdu(e.id, { showDates: v })}
                            aria-label="Show dates"
                          />
                        </div>
                        <Field label="Thesis (optional)" value={e.thesis ?? ""} onChange={(v) => uEdu(e.id, { thesis: v || undefined })} multiline rows={2} span2 hash={loadedHash} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
          {/* ── STORIES ── */}
          <TabsContent value="stories">
            <StoriesTab stories={data.stories ?? []} onChange={setStories} hash={loadedHash} />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}

const EditPage = () => {
  if (!import.meta.env.DEV) return <Navigate to="/" replace />;
  return (
    <ThemeProvider>
      <EditBody />
    </ThemeProvider>
  );
};

export default EditPage;
