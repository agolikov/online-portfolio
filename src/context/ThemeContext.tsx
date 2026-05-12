import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ACCENT_HSL, type Accent, type Mode, type Scheme, ThemeContext } from "./theme";

function readStorage<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Boring mode is the default (enabled by default per spec)
  const [mode, setMode] = useState<Mode>(() => readStorage("p-mode", "boring"));
  const [scheme, setScheme] = useState<Scheme>(() => readStorage("p-scheme", "light"));
  const [accent, setAccent] = useState<Accent>(() => readStorage("p-accent", "emerald"));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", scheme === "dark");
    root.dataset.mode = mode;
    root.style.setProperty("--accent-h", ACCENT_HSL[accent]);
    try {
      localStorage.setItem("p-mode", mode);
      localStorage.setItem("p-scheme", scheme);
      localStorage.setItem("p-accent", accent);
    } catch {
      // Ignore storage failures; the current in-memory theme is still valid.
    }
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
