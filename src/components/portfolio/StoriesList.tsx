import { useState } from "react";
import type { Story } from "@/types/portfolio";
import { ChevronDown, ChevronUp } from "lucide-react";

export function StoriesList({ stories }: { stories: Story[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section className="paper rule animate-fade-in px-4 py-6 md:px-6 md:py-8">
      <h2 className="section-title mb-5 md:mb-7">Stories</h2>

      <div className="space-y-2">
        {stories.map((story) => {
          const isOpen = open.has(story.id);
          return (
            <div key={story.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <button
                type="button"
                onClick={() => toggle(story.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
              >
                <span className="text-sm font-medium leading-snug">{story.question}</span>
                {isOpen
                  ? <ChevronUp size={14} className="shrink-0 text-muted-foreground" />
                  : <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
                }
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-sm leading-relaxed text-muted-foreground border-t border-border whitespace-pre-wrap">
                  {story.answer || <em>No answer yet.</em>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
