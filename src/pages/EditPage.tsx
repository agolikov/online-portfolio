import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import staticData from "@/data/portfolio.json";
import type { Portfolio, Experience, Project, Certificate, Education, Tech } from "@/types/portfolio";
import { clearPortfolioOverride, loadPortfolio, savePortfolioOverride } from "@/lib/portfolioStore";
import { ThemeProvider } from "@/context/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Save, RotateCcw, Download, Upload, Plus, Trash2,
  ChevronDown, ChevronUp,
} from "lucide-react";

const inputCls =
  "w-full bg-transparent border border-border px-3 py-2 text-sm outline-none focus:border-foreground placeholder:text-muted-foreground";
const labelCls = "block text-xs uppercase tracking-widest text-muted-foreground mb-1";

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

// ── Main editor body ─────────────────────────────────────────────────────────

function EditBody() {
  const [data, setData] = useState<Portfolio>(() => loadPortfolio());
  const [expanded, setExpanded] = useState<Record<string, Set<string>>>({
    exp: new Set(), proj: new Set(), cert: new Set(), edu: new Set(),
  });
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

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
  const updateTechRow = (i: number, patch: Partial<Tech>) =>
    setData((d) => { const t = [...d.tech]; t[i] = { ...t[i], ...patch }; return { ...d, tech: t }; });
  const addTechRow = () =>
    setData((d) => ({ ...d, tech: [...d.tech, { name: "", category: "" }] }));
  const removeTechRow = (i: number) =>
    setData((d) => ({ ...d, tech: d.tech.filter((_, idx) => idx !== i) }));

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
          <div className="flex items-center gap-3">
            <Link to="/" className="chip flex items-center gap-1.5"><ArrowLeft size={12} /> Back</Link>
            <h1 className="text-xl font-semibold">Edit Portfolio</h1>
            <span className="chip" data-active="true">DEV ONLY</span>
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
          Edits are stored in <strong>localStorage</strong> and override{" "}
          <code className="font-mono text-xs">src/data/portfolio.json</code>.
          Use <strong>Export JSON</strong> to download and commit the file.
        </p>

        <Tabs defaultValue="profile">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {(["profile", "tech", "experience", "projects", "certificates", "education"] as const).map((t) => (
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
          <TabsContent value="tech" className="mt-6">
            <div className="mb-3 flex justify-end">
              <button onClick={addTechRow} className="chip flex items-center gap-1.5">
                <Plus size={12} /> Add Tech
              </button>
            </div>
            <div className="border border-border rounded-md overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_36px] px-4 py-2 bg-muted/30 border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                <span>Name</span><span>Category</span><span />
              </div>
              {data.tech.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center px-4 py-2 border-b border-border last:border-b-0">
                  <input
                    className={inputCls}
                    value={t.name}
                    placeholder="e.g. Go"
                    onChange={(e) => updateTechRow(i, { name: e.target.value })}
                  />
                  <input
                    className={inputCls}
                    value={t.category}
                    placeholder="e.g. Language"
                    onChange={(e) => updateTechRow(i, { category: e.target.value })}
                  />
                  <button onClick={() => removeTechRow(i)} className="p-1 text-muted-foreground hover:text-destructive justify-self-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
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
