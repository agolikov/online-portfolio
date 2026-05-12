import { createContext, useContext } from "react";

export type Mode = "boring" | "colorful";
export type Scheme = "light" | "dark";
export type Accent = "emerald" | "amber" | "rose" | "violet" | "cyan";

export interface ThemeState {
  mode: Mode;
  scheme: Scheme;
  accent: Accent;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  setScheme: (s: Scheme) => void;
  setAccent: (a: Accent) => void;
}

export const ACCENT_HSL: Record<Accent, string> = {
  emerald: "152 76% 44%",
  amber: "38 92% 50%",
  rose: "346 84% 58%",
  violet: "262 84% 65%",
  cyan: "190 90% 50%",
};

export const ACCENTS: Accent[] = ["emerald", "amber", "rose", "violet", "cyan"];

export const ThemeContext = createContext<ThemeState | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme outside provider");
  return ctx;
}
