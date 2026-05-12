import { useState } from "react";
import { resumesApi } from "@/lib/resumesApi";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Sparkles } from "lucide-react";
import { inputCls, labelCls } from "./EditorShared";

const SUMMARY_ACTIONS = [
  { action: "expand", label: "Add more details" },
  { action: "condense", label: "Add less details" },
  { action: "rebuild", label: "Rebuild" },
] as const;

export function SummaryField({
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
        else if (event.type === "done") {
          onChange(event.text);
          setStreaming(null);
        } else if (event.type === "error") {
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
        <label className={labelCls} htmlFor="profile-summary">
          Summary
        </label>
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
          {streaming}
          <span className="animate-pulse">▍</span>
        </div>
      ) : (
        <textarea
          id="profile-summary"
          rows={5}
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
