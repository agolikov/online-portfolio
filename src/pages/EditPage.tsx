import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import staticData from "@/data/portfolio.json";
import type { Portfolio, Experience, Project, Certificate, Education, Tech, Story } from "@/types/portfolio";
import type { TechSuggestion } from "@/lib/resumesApi";
import { clearPortfolioOverride, loadPortfolio, savePortfolioOverride } from "@/lib/portfolioStore";
import { resumesApi, type ResumeRow } from "@/lib/resumesApi";
import { ChatPane } from "@/components/portfolio/ChatPane";
import { CoverLetterPanel } from "@/components/portfolio/CoverLetterPanel";
import { ThemeProvider } from "@/context/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Save, RotateCcw, Download, Upload, Plus, Trash2,
  ChevronDown, ChevronUp, Copy, RefreshCw, X, Eye, EyeOff, Sparkles,
} from "lucide-react";

const inputCls =
  "w-full bg-transparent border border-border px-3 py-2 text-sm outline-none focus:border-foreground placeholder:text-muted-foreground";
const labelCls = "block text-xs uppercase tracking-widest text-muted-foreground mb-1";
const LAST_LOADED_RESUME_KEY = "portfolio-edit-last-loaded-resume";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

// ── Shared field components ──────────────────────────────────────────────────

function Field({
  label, value, onChange, multiline = false, rows = 3, span2 = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; rows?: number; span2?: boolean;
}) {
  return (
    <div className={span2 ? "md:col-span-2" : ""}>
      <label className={labelCls}>{label}</label>
      {multiline ? (
        <textarea
          rows={rows}
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
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

function HighlightEditor({
  highlights, onChange, onAdd, onRemove,
}: {
  highlights: string[];
  onChange: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="md:col-span-2">
      <label className={labelCls}>Highlights</label>
      <div className="space-y-2">
        {highlights.map((h, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              rows={2}
              className={inputCls + " flex-1 resize-none"}
              value={h}
              onChange={(e) => onChange(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="self-start p-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className="mt-2 chip flex items-center gap-1">
        <Plus size={12} /> Add Highlight
      </button>
    </div>
  );
}

function CardHeader({
  title, subtitle, expanded, onToggle, onDelete,
}: {
  title: string; subtitle?: string; expanded: boolean;
  onToggle: () => void; onDelete: () => void;
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
      <button
        type="button"
        onClick={onDelete}
        className="p-1 text-muted-foreground hover:text-destructive shrink-0"
      >
        <Trash2 size={14} />
      </button>
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
}: {
  stories: Story[];
  onChange: (s: Story[]) => void;
}) {
  const [customQ, setCustomQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function addQuestion(question: string) {
    const id = uid("story");
    onChange([...stories, { id, question, answer: "" }]);
    setExpanded((p) => new Set([...p, id]));
  }

  function removeStory(id: string) {
    onChange(stories.filter((s) => s.id !== id));
  }

  function updateAnswer(id: string, answer: string) {
    onChange(stories.map((s) => s.id === id ? { ...s, answer } : s));
  }

  function togglePublic(id: string, visible: boolean) {
    onChange(stories.map((s) => s.id === id ? { ...s, public: visible } : s));
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
        {stories.map((story) => {
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
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  {story.public === false ? <EyeOff size={14} /> : <Eye size={14} />}
                  <Switch
                    checked={story.public !== false}
                    onCheckedChange={(checked) => togglePublic(story.id, checked)}
                    aria-label="Toggle public access for story"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeStory(story.id)}
                  className="p-1 text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Remove story"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {isOpen && (
                <div className="px-4 py-3">
                  <textarea
                    rows={5}
                    className={inputCls + " resize-none"}
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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setJobDescription(data.coverLetters?.current?.vacancyText ?? "");
  }, [data.coverLetters?.current?.vacancyText]);

  async function generate() {
    if (!loadedHash || !jobDescription.trim()) return;
    setGenerating(true);
    try {
      const result = await resumesApi.generateCoverLetter(loadedHash, jobDescription);
      onChange({
        ...data,
        coverLetters: {
          ...data.coverLetters,
          current: {
            content: result.coverLetter,
            summary: result.summary,
            vacancyText: result.vacancyText ?? jobDescription,
            metrics: result.metrics,
            generatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });
      window.dispatchEvent(new CustomEvent("resume-data-changed", { detail: { hash: loadedHash } }));
      toast({ title: "Cover letter generated", description: "Saved to the loaded resume." });
    } catch {
      toast({ title: "Failed to generate cover letter", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
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
      <button
        type="button"
        onClick={generate}
        disabled={generating || !jobDescription.trim()}
        className="chip flex items-center gap-1.5 disabled:opacity-40"
        data-active="true"
      >
        <Sparkles size={12} /> {generating ? "Generating..." : "Generate"}
      </button>
      {data.coverLetters?.current?.content && (
        <CoverLetterPanel coverLetter={data.coverLetters.current} />
      )}
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

  async function updateRow(hash: string) {
    try {
      await resumesApi.update(hash, currentData);
      await refresh();
      toast({ title: "Updated", description: `Resume ${hash} overwritten with current editor data.` });
    } catch (e) {
      toast({ title: "Update failed", description: String(e), variant: "destructive" });
    }
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

  async function clearDefaultRow() {
    try {
      await resumesApi.clearDefault();
      await refresh();
      toast({ title: "Default resume cleared", description: "Home page will use portfolio.json sample data." });
    } catch (e) {
      toast({ title: "Clear default failed", description: String(e), variant: "destructive" });
    }
  }

  function loadRow(row: ResumeRow) {
    onLoad(row.resumeData, row.hash);
    toast({ title: "Loaded", description: `Resume ${row.hash} loaded into editor.` });
  }

  function exportRow(row: ResumeRow) {
    const blob = new Blob([JSON.stringify(row.resumeData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume_${row.hash}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  function copyLink(hash: string) {
    navigator.clipboard.writeText(`${window.location.origin}/${hash}`);
    toast({ title: "Link copied" });
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
                    {isLoaded && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium">
                        editing
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
                    <Download size={11} /> Load
                  </button>
                  <button onClick={() => copyLink(row.hash)} className="chip flex items-center gap-1" title="Copy share link">
                    <Copy size={11} /> Link
                  </button>
                  {row.isDefault ? (
                    <button onClick={clearDefaultRow} className="chip flex items-center gap-1" title="Clear default home resume">
                      <X size={11} /> Default
                    </button>
                  ) : (
                    <button
                      onClick={() => setDefaultRow(row.hash)}
                      disabled={!row.enabled}
                      className="chip flex items-center gap-1 disabled:opacity-40"
                      title={row.enabled ? "Use this resume on the home page" : "Enable resume before setting it as default"}
                    >
                      <Save size={11} /> Default
                    </button>
                  )}
                  {!isLoaded && (
                    <button onClick={() => updateRow(row.hash)} className="chip flex items-center gap-1" title="Overwrite with current editor data">
                      <Save size={11} /> Update
                    </button>
                  )}
                  <button onClick={() => exportRow(row)} className="chip flex items-center gap-1" title="Export JSON">
                    <Upload size={11} /> Export
                  </button>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      s.has(id) ? s.delete(id) : s.add(id);
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
      experience: [{ id, company: "", role: "", period: "", start: "", end: "", location: "", highlights: [], tech: [] }, ...d.experience],
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
    setData((d) => ({ ...d, projects: [{ id, name: "", tagline: "", description: "", link: "", tech: [] }, ...d.projects] }));
    setExpanded((p) => ({ ...p, proj: new Set([...p.proj, id]) }));
  };
  const removeProj = (id: string) =>
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));

  // certificates
  const uc = (id: string, patch: Partial<Certificate>) =>
    setData((d) => ({ ...d, certificates: d.certificates.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  const addCert = () => {
    const id = uid("cert");
    setData((d) => ({ ...d, certificates: [{ id, name: "", issuer: "", year: "", tech: [] }, ...d.certificates] }));
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
    setData((d) => ({ ...d, education: [{ id, institution: "", degree: "", field: "", period: "", start: "", end: "" }, ...(d.education ?? [])] }));
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
            <h1 className="text-xl font-semibold">Edit Portfolio</h1>
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

        <Tabs defaultValue="profile">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {(["profile", "tech", "experience", "projects", "certificates", "education", "stories", "cover", "chat", "resumes"] as const).map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs uppercase tracking-widest">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── PROFILE ── */}
          <TabsContent value="profile" className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Name" value={data.profile.name} onChange={(v) => sp({ name: v })} />
            <Field label="Title" value={data.profile.title} onChange={(v) => sp({ title: v })} />
            <Field label="Location" value={data.profile.location} onChange={(v) => sp({ location: v })} />
            <Field label="Email" value={data.profile.email} onChange={(v) => sp({ email: v })} />
            <Field label="Website" value={data.profile.website} onChange={(v) => sp({ website: v })} />
            <Field label="GitHub" value={data.profile.github} onChange={(v) => sp({ github: v })} />
            <Field label="LinkedIn" value={data.profile.linkedin} onChange={(v) => sp({ linkedin: v })} />
            <Field label="Summary" value={data.profile.summary} onChange={(v) => sp({ summary: v })} multiline rows={5} span2 />
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
              {data.experience.map((e) => {
                const open = isOpen("exp", e.id);
                const tk = `exp-${e.id}`;
                return (
                  <div key={e.id} className="border border-border rounded-md overflow-hidden">
                    <CardHeader
                      title={e.role || "New Experience"}
                      subtitle={e.company ? `@ ${e.company}` : undefined}
                      expanded={open}
                      onToggle={() => toggleExpanded("exp", e.id)}
                      onDelete={() => removeExp(e.id)}
                    />
                    {open && (
                      <div className="px-4 py-4 grid gap-4 md:grid-cols-2">
                        <Field label="Company" value={e.company} onChange={(v) => ue(e.id, { company: v })} />
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

          {/* ── PROJECTS ── */}
          <TabsContent value="projects" className="mt-6">
            <div className="mb-3 flex justify-end">
              <button onClick={addProj} className="chip flex items-center gap-1.5">
                <Plus size={12} /> Add Project
              </button>
            </div>
            <div className="space-y-2">
              {data.projects.map((p) => {
                const open = isOpen("proj", p.id);
                const tk = `proj-${p.id}`;
                return (
                  <div key={p.id} className="border border-border rounded-md overflow-hidden">
                    <CardHeader
                      title={p.name || "New Project"}
                      subtitle={p.tagline || undefined}
                      expanded={open}
                      onToggle={() => toggleExpanded("proj", p.id)}
                      onDelete={() => removeProj(p.id)}
                    />
                    {open && (
                      <div className="px-4 py-4 grid gap-4 md:grid-cols-2">
                        <Field label="Name" value={p.name} onChange={(v) => up(p.id, { name: v })} />
                        <Field label="Link" value={p.link} onChange={(v) => up(p.id, { link: v })} />
                        <Field label="Tagline" value={p.tagline} onChange={(v) => up(p.id, { tagline: v })} span2 />
                        <Field label="Description" value={p.description} onChange={(v) => up(p.id, { description: v })} multiline rows={3} span2 />
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
              {data.certificates.map((c) => {
                const open = isOpen("cert", c.id);
                const tk = `cert-${c.id}`;
                return (
                  <div key={c.id} className="border border-border rounded-md overflow-hidden">
                    <CardHeader
                      title={c.name || "New Certificate"}
                      subtitle={c.issuer || undefined}
                      expanded={open}
                      onToggle={() => toggleExpanded("cert", c.id)}
                      onDelete={() => removeCert(c.id)}
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
              {edu.map((e) => {
                const open = isOpen("edu", e.id);
                return (
                  <div key={e.id} className="border border-border rounded-md overflow-hidden">
                    <CardHeader
                      title={e.degree || "New Education"}
                      subtitle={(e.shortName ?? e.institution) || undefined}
                      expanded={open}
                      onToggle={() => toggleExpanded("edu", e.id)}
                      onDelete={() => removeEdu(e.id)}
                    />
                    {open && (
                      <div className="px-4 py-4 grid gap-4 md:grid-cols-2">
                        <Field label="Institution" value={e.institution} onChange={(v) => uEdu(e.id, { institution: v })} span2 />
                        <Field label="Short Name" value={e.shortName ?? ""} onChange={(v) => uEdu(e.id, { shortName: v || undefined })} />
                        <Field label="Degree" value={e.degree} onChange={(v) => uEdu(e.id, { degree: v })} />
                        <Field label="Field of Study" value={e.field} onChange={(v) => uEdu(e.id, { field: v })} span2 />
                        <Field label="Period" value={e.period} onChange={(v) => uEdu(e.id, { period: v })} span2 />
                        <Field label="Start (YYYY-MM)" value={e.start} onChange={(v) => uEdu(e.id, { start: v })} />
                        <Field label="End (YYYY-MM)" value={e.end} onChange={(v) => uEdu(e.id, { end: v })} />
                        <Field label="Thesis (optional)" value={e.thesis ?? ""} onChange={(v) => uEdu(e.id, { thesis: v || undefined })} span2 />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
          {/* ── STORIES ── */}
          <TabsContent value="stories">
            <StoriesTab stories={data.stories ?? []} onChange={setStories} />
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

          {/* ── RESUMES ── */}
          <TabsContent value="resumes">
            <ResumesTab currentData={data} loadedHash={loadedHash} onLoad={handleLoad} />
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
