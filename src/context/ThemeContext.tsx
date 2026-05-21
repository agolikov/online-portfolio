import { type ReactNode, useEffect, useMemo, useState } from "react";
import { type Scheme, ThemeContext } from "./theme";

function readStorage<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<Scheme>(() => readStorage("p-scheme", "light"));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", scheme === "dark");
    root.dataset.mode = "boring";
    root.style.removeProperty("--accent-h");
    try {
      localStorage.setItem("p-scheme", scheme);
      localStorage.removeItem("p-mode");
      localStorage.removeItem("p-accent");
    } catch {
      // Ignore storage failures; the current in-memory theme is still valid.
    }
  }, [scheme]);

  const value = useMemo(
    () => ({
      scheme,
      setScheme,
    }),
    [scheme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
