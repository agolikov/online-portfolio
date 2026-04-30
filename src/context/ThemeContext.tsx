import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Mode = "boring" | "colorful";
export type Scheme = "light" | "dark";
export type Accent = "emerald" | "amber" | "rose" | "violet" | "cyan";

interface ThemeState {
  mode: Mode;
  scheme: Scheme;
  accent: Accent;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  setScheme: (s: Scheme) => void;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const ACCENT_HSL: Record<Accent, string> = {
  emerald: "152 76% 44%",
  amber: "38 92% 50%",
  rose: "346 84% 58%",
  violet: "262 84% 65%",
  cyan: "190 90% 50%",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Boring mode is the default (enabled by default per spec)
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem("p-mode") as Mode) || "boring");
  const [scheme, setScheme] = useState<Scheme>(() => (localStorage.getItem("p-scheme") as Scheme) || "light");
  const [accent, setAccent] = useState<Accent>(() => (localStorage.getItem("p-accent") as Accent) || "emerald");

   useEffect(() => {
     const root = document.documentElement;
     root.classList.toggle("dark", scheme === "dark");
     root.dataset.mode = mode;
     root.style.setProperty("--accent-h", ACCENT_HSL[accent]);
     localStorage.setItem("p-mode", mode);
     localStorage.setItem("p-scheme", scheme);
     localStorage.setItem("p-accent", accent);
   }, [mode, scheme, accent]);

  const value = useMemo(
    () => ({
      mode,
      scheme,
      accent,
      setMode,
      toggleMode: () => setMode((m) => (m === "boring" ? "colorful" : "boring")),
      setScheme,
      setAccent,
    }),
    [mode, scheme, accent]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme outside provider");
  return ctx;
}

export const ACCENTS: Accent[] = ["emerald", "amber", "rose", "violet", "cyan"];
