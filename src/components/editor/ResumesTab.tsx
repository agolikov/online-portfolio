import { useState, useEffect, useRef, useCallback } from "react";
import type { Portfolio } from "@/types/portfolio";
import { resumesApi, type ResumeRow } from "@/lib/resumesApi";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Download, Upload, Plus, Trash2, RefreshCw, ExternalLink, Save } from "lucide-react";

// ── Note input ────────────────────────────────────────────────────────────────

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

// ── Alias input ───────────────────────────────────────────────────────────────

function AliasInput({
  hash,
  initial,
  onSaved,
}: {
  hash: string;
  initial: string | null;
  onSaved: (alias: string | null) => void;
}) {
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
        toast({
          title: "Invalid alias",
          description: "Lowercase letters, numbers, and hyphens only.",
          variant: "destructive",
        });
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

// ── Resumes tab ───────────────────────────────────────────────────────────────

export function ResumesTab({
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await resumesApi.list());
    } catch {
      toast({ title: "Failed to load resumes", description: "Is the API server running?", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
        <button
          type="button"
          onClick={createFromCurrent}
          className="chip flex items-center gap-1.5"
          data-active="true"
        >
          <Plus size={12} /> Create from current
        </button>
        <label className="chip flex items-center gap-1.5 cursor-pointer">
          <Upload size={12} /> Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={importJson} />
        </label>
        <button type="button" onClick={refresh} className="chip flex items-center gap-1.5">
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
                style={
                  isLoaded
                    ? { borderLeft: "3px solid hsl(var(--primary))" }
                    : { borderLeft: "3px solid transparent" }
                }
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{row.hash}</span>
                    {row.alias && (
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary">
                        /{row.alias}
                      </span>
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
                  <AliasInput
                    hash={row.hash}
                    initial={row.alias}
                    onSaved={(alias) => handleAliasSaved(row.hash, alias)}
                  />
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
                  <button
                    type="button"
                    onClick={() => loadRow(row)}
                    className="chip flex items-center gap-1"
                    title="Load into editor"
                  >
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
                      type="button"
                      onClick={() => setDefaultRow(row.hash)}
                      disabled={!row.enabled}
                      className="chip flex items-center gap-1 disabled:opacity-40"
                      title={
                        row.enabled
                          ? "Use this resume on the home page"
                          : "Enable resume before setting it as default"
                      }
                    >
                      <Save size={11} /> Default
                    </button>
                  )}
                  <button
                    type="button"
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
