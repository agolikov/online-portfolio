import posthog from "posthog-js";
import { useTheme, ACCENTS, type Accent } from "@/context/ThemeContext";
import { Sun, Moon, FileDown, Palette, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

function GithubIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.111.82-.261.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.509 11.509 0 0 1 3.004-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const ACCENT_PREVIEW: Record<Accent, string> = {
  emerald: "hsl(152 76% 44%)",
  amber:   "hsl(38 92% 50%)",
  rose:    "hsl(346 84% 58%)",
  violet:  "hsl(262 84% 65%)",
  cyan:    "hsl(190 90% 50%)",
};

interface Props {
  onExport: () => void;
}

export function ControlBar({ onExport }: Props) {
  const { mode, toggleMode, scheme, setScheme, accent, setAccent } = useTheme();
  const isBoring = mode === "boring";
  const isDark = scheme === "dark";

  return (
    <div className="toolbar-surface sticky top-3 z-30 mx-auto mb-8 flex w-full flex-wrap items-center justify-between gap-3 px-4 py-2.5 print:hidden backdrop-blur supports-[backdrop-filter]:bg-background/75">
      {/* Left: colorful toggle */}
      <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground cursor-pointer">
        <span className={!isBoring ? "text-foreground font-medium" : ""}>Color</span>
        <Switch
          checked={!isBoring}
          onCheckedChange={() => {
            posthog.capture("theme_mode_toggled", { mode: isBoring ? "colorful" : "boring" });
            toggleMode();
          }}
          aria-label="Toggle colorful mode"
        />
      </label>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5">
        {/* Accent swatches (colorful mode only) */}
        {!isBoring && (
          <div className="mr-1 flex items-center gap-1.5">
            <Palette size={14} className="text-muted-foreground" />
            {ACCENTS.map((a) => (
              <Tooltip key={a}>
                <TooltipTrigger asChild>
                  <button
                    aria-label={`Accent ${a}`}
                    onClick={() => { posthog.capture("accent_changed", { accent: a }); setAccent(a); }}
                    className="h-5 w-5 rounded-full border transition-transform hover:scale-110"
                    style={{
                      background: ACCENT_PREVIEW[a],
                      borderColor: accent === a ? "hsl(var(--foreground))" : "transparent",
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>{a}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Light / dark toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                posthog.capture("color_scheme_toggled", { scheme: isDark ? "light" : "dark" });
                setScheme(isDark ? "light" : "dark");
              }}
              className="chip"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
        </Tooltip>

        {/* GitHub */}
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="https://github.com/agolikov/online-portfolio"
              target="_blank"
              rel="noreferrer"
              className="chip"
              aria-label="GitHub"
              onClick={() => posthog.capture("github_link_clicked", { github_url: "https://github.com/agolikov/online-portfolio" })}
            >
              <GithubIcon size={13} />
            </a>
          </TooltipTrigger>
          <TooltipContent>GitHub</TooltipContent>
        </Tooltip>

        {/* Edit (dev only) */}
        {import.meta.env.DEV && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/edit" className="chip" aria-label="Edit portfolio">
                <Pencil size={13} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Edit portfolio</TooltipContent>
          </Tooltip>
        )}

        {/* Export PDF */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => { posthog.capture("pdf_exported"); onExport(); }}
              className="chip flex items-center gap-1.5"
              data-active="true"
              aria-label="Download PDF"
            >
              <FileDown size={13} />
              <span className="hidden text-xs sm:inline">Download PDF</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Download PDF</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
