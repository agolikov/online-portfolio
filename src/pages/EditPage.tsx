import { useState, useEffect, useRef, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import staticData from "@/data/portfolio.json";
import type { Portfolio, Experience, Project, Certificate, Education, Tech, Story } from "@/types/portfolio";
import { clearPortfolioOverride, loadPortfolio, savePortfolioOverride } from "@/lib/portfolioStore";
import { resumesApi } from "@/lib/resumesApi";
import { isVisible } from "@/lib/visibility";
import { ChatPane } from "@/components/portfolio/ChatPane";
import { ThemeProvider } from "@/context/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, RotateCcw, Download, Upload, Plus } from "lucide-react";
import { Field, TagEditor, HighlightEditor, CardHeader, move, uid } from "@/components/editor/EditorShared";
import { TechTab } from "@/components/editor/TechTab";
import { StoriesTab } from "@/components/editor/StoriesTab";
import { CoverLetterTab } from "@/components/editor/CoverLetterTab";
import { ResumesTab } from "@/components/editor/ResumesTab";
import { SummaryField } from "@/components/editor/SummaryField";

const LAST_LOADED_RESUME_KEY = "portfolio-edit-last-loaded-resume";

// ── Main editor body ──────────────────────────────────────────────────────────

function EditBody() {
  const [data, setData] = useState<Portfolio>(() => loadPortfolio());
  const [expanded, setExpanded] = useState<Record<string, Set<string>>>({
    exp: new Set(),
    proj: new Set(),
    cert: new Set(),
    edu: new Set(),
  });
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  const [loadedHash, setLoadedHash] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const lastSavedRef = useRef<string>("");

  const handleLoad = useCallback((p: Portfolio, hash: string) => {
    lastSavedRef.current = JSON.stringify(p);
    setData(p);
    savePortfolioOverride(p);
    setLoadedHash(hash);
    localStorage.setItem(LAST_LOADED_RESUME_KEY, hash);
    setAutoSaveState("idle");
  }, []);

  useEffect(() => {
    const lastHash = localStorage.getItem(LAST_LOADED_RESUME_KEY);
    if (!lastHash) return;
    let mounted = true;
    resumesApi
      .list()
      .then((rows) => {
        if (!mounted) return;
        const row = rows.find((r) => r.hash === lastHash);
        if (row) handleLoad(row.resumeData, row.hash);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [handleLoad]);

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
  }, [loadedHash, handleLoad]);

  useEffect(() => {
    if (!loadedHash) return;
    const json = JSON.stringify(data);
    if (json === lastSavedRef.current) return;
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

  // ── Helpers ─────────────────────────────────────────────────────────────────

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
  function tagVal(key: string) {
    return tagInputs[key] ?? "";
  }
  function setTagVal(key: string, v: string) {
    setTagInputs((s) => ({ ...s, [key]: v }));
  }
  function commitTag(key: string, current: string[], setter: (t: string[]) => void) {
    const v = tagVal(key).trim();
    if (!v || current.includes(v)) return;
    setter([...current, v]);
    setTagVal(key, "");
  }

  // ── Data mutators ────────────────────────────────────────────────────────────

  const sp = (patch: Partial<Portfolio["profile"]>) =>
    setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));

  const setTech = (tech: Tech[]) => setData((d) => ({ ...d, tech }));
  const setStories = (stories: Story[]) => setData((d) => ({ ...d, stories }));

  const ue = (id: string, patch: Partial<Experience>) =>
    setData((d) => ({ ...d, experience: d.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const addExp = () => {
    const id = uid("exp");
    setData((d) => ({
      ...d,
      experience: [
        { id, enabled: true, company: "", role: "", period: "", start: "", end: "", location: "", highlights: [], tech: [] },
        ...d.experience,
      ],
    }));
    setExpanded((p) => ({ ...p, exp: new Set([...p.exp, id]) }));
  };
  const removeExp = (id: string) =>
    setData((d) => ({ ...d, experience: d.experience.filter((e) => e.id !== id) }));

  const up = (id: string, patch: Partial<Project>) =>
    setData((d) => ({ ...d, projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const addProj = () => {
    const id = uid("prj");
    setData((d) => ({
      ...d,
      projects: [{ id, enabled: true, name: "", tagline: "", description: "", link: "", tech: [] }, ...d.projects],
    }));
    setExpanded((p) => ({ ...p, proj: new Set([...p.proj, id]) }));
  };
  const removeProj = (id: string) =>
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));

  const uc = (id: string, patch: Partial<Certificate>) =>
    setData((d) => ({
      ...d,
      certificates: d.certificates.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  const addCert = () => {
    const id = uid("cert");
    setData((d) => ({
      ...d,
      certificates: [{ id, enabled: true, name: "", issuer: "", year: "", tech: [] }, ...d.certificates],
    }));
    setExpanded((p) => ({ ...p, cert: new Set([...p.cert, id]) }));
  };
  const removeCert = (id: string) =>
    setData((d) => ({ ...d, certificates: d.certificates.filter((c) => c.id !== id) }));

  const edu = data.education ?? [];
  const uEdu = (id: string, patch: Partial<Education>) =>
    setData((d) => ({
      ...d,
      education: (d.education ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  const addEdu = () => {
    const id = uid("edu");
    setData((d) => ({
      ...d,
      education: [
        { id, enabled: true, institution: "", degree: "", field: "", period: "", start: "", end: "" },
        ...(d.education ?? []),
      ],
    }));
    setExpanded((p) => ({ ...p, edu: new Set([...p.edu, id]) }));
  };
  const removeEdu = (id: string) =>
    setData((d) => ({ ...d, education: (d.education ?? []).filter((e) => e.id !== id) }));

  // ── Toolbar actions ──────────────────────────────────────────────────────────

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
    a.href = url;
    a.download = "portfolio.json";
    a.click();
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
            <Link to="/" className="chip flex items-center gap-1.5">
              <ArrowLeft size={12} /> Back
            </Link>
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
            <button type="button" onClick={download} className="chip flex items-center gap-1.5">
              <Download size={12} /> Export JSON
            </button>
            <button type="button" onClick={reset} className="chip flex items-center gap-1.5">
              <RotateCcw size={12} /> Reset
            </button>
            <button type="button" onClick={save} className="chip flex items-center gap-1.5" data-active="true">
              <Save size={12} /> Save
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Edits are saved to <strong>localStorage</strong> for live preview (hit <strong>Save</strong>). Go to the{" "}
          <strong>Resumes</strong> tab to publish to the database and get a shareable link.
          {loadedHash ? (
            <>
              {" "}Editing DB resume <code className="font-mono text-xs">{loadedHash}</code> — changes auto-save after
              1.5 s.
            </>
          ) : (
            <>
              {" "}No DB resume loaded — use <strong>Load</strong> in the Resumes tab to start editing one.
            </>
          )}
        </p>

        <Tabs defaultValue="resumes">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {(
              [
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
              ] as const
            ).map(([value, label]) => (
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
                <p className="text-xs text-muted-foreground">
                  Suppress years on projects, certificates, and education in public view and PDF.
                </p>
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
              <button type="button" onClick={addExp} className="chip flex items-center gap-1.5">
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
                          onChange={(idx, v) => ue(e.id, { highlights: e.highlights.map((h, j) => (j === idx ? v : h)) })}
                          onAdd={() => ue(e.id, { highlights: [...e.highlights, ""] })}
                          onRemove={(idx) => ue(e.id, { highlights: e.highlights.filter((_, j) => j !== idx) })}
                          hash={loadedHash}
                        />
                        <TagEditor
                          tags={e.tech}
                          inputValue={tagVal(tk)}
                          onInputChange={(v) => setTagVal(tk, v)}
                          onAdd={() => commitTag(tk, e.tech, (t) => ue(e.id, { tech: t }))}
                          onRemove={(idx) => ue(e.id, { tech: e.tech.filter((_, j) => j !== idx) })}
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
              <button type="button" onClick={addProj} className="chip flex items-center gap-1.5">
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
                          onRemove={(idx) => up(p.id, { tech: p.tech.filter((_, j) => j !== idx) })}
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
              <button type="button" onClick={addCert} className="chip flex items-center gap-1.5">
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
                          onRemove={(idx) => uc(c.id, { tech: (c.tech ?? []).filter((_, j) => j !== idx) })}
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
              <button type="button" onClick={addEdu} className="chip flex items-center gap-1.5">
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
