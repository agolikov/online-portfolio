import { createContext, useContext } from "react";

export type Scheme = "light" | "dark";

export interface ThemeState {
  scheme: Scheme;
  setScheme: (s: Scheme) => void;
}

export const ThemeContext = createContext<ThemeState | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme outside provider");
  return ctx;
}
