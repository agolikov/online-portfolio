import { useState, useEffect, useRef } from "react";
import type { Tech } from "@/types/portfolio";
import type { TechSuggestion } from "@/lib/resumesApi";
import { resumesApi } from "@/lib/resumesApi";
import { X } from "lucide-react";
import { labelCls, SuggestionPicker } from "./EditorShared";

function NewSkillInput({
  onCommit,
  onCancel,
}: {
  onCommit: (v: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <input
      ref={ref}
      className="bg-transparent outline-none w-24 text-xs"
      placeholder="skill name…"
      onBlur={(e) => {
        const v = e.target.value.trim();
        if (!v) {
          onCancel();
          return;
        }
        onCommit(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

export function TechTab({
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
    onChange(tech.map((t) => (t.name === oldName ? { ...t, name: n } : t)));
  }

  return (
    <div className="mt-6 space-y-6">
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
        <SuggestionPicker placeholder="Add category…" suggestions={availableCats} onAdd={addCategory} />
      </div>

      <div className="border-t border-border" />

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
                        <NewSkillInput
                          onCommit={(v) => updateSkillName("", v)}
                          onCancel={() => removeSkill("")}
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
