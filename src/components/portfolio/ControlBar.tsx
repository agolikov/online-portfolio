import posthog from "posthog-js";
import { useTheme, ACCENTS, type Accent } from "@/context/ThemeContext";
import { Sun, Moon, FileDown, Palette, Pencil, Github } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { usePortfolio } from "@/lib/portfolioStore";

const ACCENT_PREVIEW: Record<Accent, string> = {
  emerald: "hsl(152 76% 44%)",
  amber: "hsl(38 92% 50%)",
  rose: "hsl(346 84% 58%)",
  violet: "hsl(262 84% 65%)",
  cyan: "hsl(190 90% 50%)",
};

interface Props {
  onExport: () => void;
}

export function ControlBar({ onExport }: Props) {
  const { mode, toggleMode, scheme, setScheme, accent, setAccent } = useTheme();
  const { profile } = usePortfolio();
  const isBoring = mode === "boring";

  return (
    <div className="paper w-full sticky top-3 z-30 mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 print:hidden bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground cursor-pointer">
          <span className={isBoring ? "text-foreground font-medium" : ""}>Boring</span>
          <Switch
            checked={!isBoring}
            onCheckedChange={() => {
              posthog.capture("theme_mode_toggled", { mode: isBoring ? "colorful" : "boring" });
              toggleMode();
            }}
            aria-label="Toggle boring / colorful mode"
          />
          <span className={!isBoring ? "text-foreground font-medium" : ""}>Colorful</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {isBoring ? (
            <button
              onClick={() => {
                posthog.capture("color_scheme_toggled", { scheme: scheme === "dark" ? "light" : "dark" });
                setScheme(scheme === "dark" ? "light" : "dark");
              }}
              className="chip flex items-center gap-1.5"
              aria-label="Toggle dark mode"
            >
              {scheme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
              {scheme === "dark" ? "Light" : "Dark"}
            </button>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Palette size={14} className="text-muted-foreground" />
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    aria-label={`Accent ${a}`}
                    onClick={() => {
                      posthog.capture("accent_changed", { accent: a });
                      setAccent(a);
                    }}
                    className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      background: ACCENT_PREVIEW[a],
                      borderColor: accent === a ? "hsl(var(--foreground))" : "transparent",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  posthog.capture("color_scheme_toggled", { scheme: scheme === "dark" ? "light" : "dark" });
                  setScheme(scheme === "dark" ? "light" : "dark");
                }}
                className="chip flex items-center gap-1.5"
                aria-label="Toggle dark mode"
              >
                {scheme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
                {scheme === "dark" ? "Light" : "Dark"}
              </button>
            </>
          )}
        </div>
        <a
          href="https://github.com/agolikov/online-portfolio"
          target="_blank"
          rel="noreferrer"
          className="chip flex items-center gap-1.5"
          aria-label="GitHub"
          onClick={() => posthog.capture("github_link_clicked", { github_url: "https://github.com/agolikov/online-portfolio" })}
        >
          <Github size={12} /> GitHub
        </a>
        {import.meta.env.DEV && (
          <Link to="/edit" className="chip flex items-center gap-1.5" aria-label="Edit (dev only)">
            <Pencil size={12} /> Edit
          </Link>
        )}
        <button
          onClick={() => {
            posthog.capture("pdf_exported");
            onExport();
          }}
          className="chip flex items-center gap-1.5"
          data-active="true"
        >
          <FileDown size={12} /> Export PDF
        </button>
      </div>
    </div>
  );
}
