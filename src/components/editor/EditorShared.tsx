import { useState, useEffect, useRef } from "react";
import { resumesApi } from "@/lib/resumesApi";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles } from "lucide-react";

export const inputCls =
  "w-full bg-transparent border border-border px-3 py-2 text-sm outline-none focus:border-foreground placeholder:text-muted-foreground";
export const labelCls = "block text-xs uppercase tracking-widest text-muted-foreground mb-1";

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

// ── Refine button ─────────────────────────────────────────────────────────────

export function RefineButton({
  hash,
  value,
  onDone,
}: {
  hash?: string | null;
  value: string;
  onDone: (text: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  if (!hash) return null;

  async function run() {
    if (busy || !value.trim()) return;
    setBusy(true);
    try {
      await resumesApi.refineTextStream(hash, value, (event) => {
        if (event.type === "done") onDone(event.text);
        else if (event.type === "error")
          toast({ title: "Refine failed", description: event.message, variant: "destructive" });
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

// ── Field ─────────────────────────────────────────────────────────────────────

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  span2 = false,
  hash,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  span2?: boolean;
  hash?: string | null;
}) {
  return (
    <div className={span2 ? "md:col-span-2" : ""}>
      {multiline ? (
        <div className="flex items-center justify-between mb-1">
          <span className="block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
          <RefineButton hash={hash} value={value} onDone={onChange} />
        </div>
      ) : (
        <label className="block">
          <span className={labelCls}>{label}</span>
          <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
        </label>
      )}
      {multiline && (
        <textarea rows={rows} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

// ── Tag editor ────────────────────────────────────────────────────────────────

export function TagEditor({
  tags,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
}: {
  tags: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="md:col-span-2">
      <p className={labelCls}>Tech</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((t, i) => (
            <span key={t} className="chip flex items-center gap-1" data-active="true">
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
          className={`${inputCls} flex-1`}
          placeholder="Type a tag and press Enter…"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <button type="button" onClick={onAdd} className="chip flex items-center gap-1 shrink-0">
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}

// ── Highlight editor ──────────────────────────────────────────────────────────

function HighlightRow({
  value,
  hash,
  onChange,
  onRemove,
}: {
  value: string;
  hash?: string | null;
  onChange: (v: string) => void;
  onRemove: () => void;
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

export function HighlightEditor({
  highlights,
  onChange,
  onAdd,
  onRemove,
  hash,
}: {
  highlights: string[];
  onChange: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  hash?: string | null;
}) {
  return (
    <div className="md:col-span-2">
      <p className={labelCls}>Highlights</p>
      <div className="space-y-2">
        {highlights.map((h, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: highlights are positional strings without stable IDs
          <HighlightRow key={i}
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

// ── Card header ───────────────────────────────────────────────────────────────

export function CardHeader({
  title,
  subtitle,
  expanded,
  enabled = true,
  onToggle,
  onDelete,
  onEnabledChange,
  onMoveUp,
  onMoveDown,
}: {
  title: string;
  subtitle?: string;
  expanded: boolean;
  enabled?: boolean;
  onToggle: () => void;
  onDelete: () => void;
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
        {subtitle && <span className="text-xs text-muted-foreground truncate">{subtitle}</span>}
      </button>
      {onEnabledChange && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0" title="Show on main page">
          {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            aria-label={`Toggle visibility for ${title}`}
          />
        </span>
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

// ── Suggestion picker ─────────────────────────────────────────────────────────

export function SuggestionPicker({
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
        className={`${inputCls} flex-1 text-sm`}
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(q);
          }
        }}
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
              onMouseDown={(e) => {
                e.preventDefault();
                commit(s);
              }}
            >
              {s}
            </button>
          ))}
          {q.trim() && !suggestions.find((s) => s.toLowerCase() === q.trim().toLowerCase()) && (
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm italic text-muted-foreground hover:bg-muted transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                commit(q);
              }}
            >
              Create "{q.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
