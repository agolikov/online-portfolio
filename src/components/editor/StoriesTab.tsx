import { useState } from "react";
import type { Story } from "@/types/portfolio";
import { isStoryVisible } from "@/lib/visibility";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { labelCls, inputCls, RefineButton, move, uid } from "./EditorShared";

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

export function StoriesTab({
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
    onChange(stories.map((s) => (s.id === id ? { ...s, answer } : s)));
  }

  function toggleVisible(id: string, visible: boolean) {
    onChange(stories.map((s) => (s.id === id ? { ...s, enabled: visible } : s)));
  }

  const usedQuestions = new Set(stories.map((s) => s.question));

  return (
    <div className="mt-6 space-y-5">
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

      <div className="flex gap-2">
        <input
          className={`${inputCls} flex-1`}
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
          onClick={() => {
            if (customQ.trim()) {
              addQuestion(customQ.trim());
              setCustomQ("");
            }
          }}
        >
          <Plus size={12} /> Add
        </button>
      </div>

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
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0" title="Show on main page">
                  {isStoryVisible(story) ? <Eye size={14} /> : <EyeOff size={14} />}
                  <Switch
                    checked={isStoryVisible(story)}
                    onCheckedChange={(checked) => toggleVisible(story.id, checked)}
                    aria-label="Toggle visibility for story"
                  />
                </span>
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
                    <RefineButton
                      hash={hash}
                      value={story.answer}
                      onDone={(text) => updateAnswer(story.id, text)}
                    />
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
