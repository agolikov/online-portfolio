import portfolioStatic from "@/data/portfolio.json";
import type { Portfolio } from "@/types/portfolio";
import { useEffect, useState } from "react";

const STORAGE_KEY = "portfolio-data-override";

/**
 * Returns the portfolio JSON, with an optional in-browser override saved by
 * the dev-only /edit page. The override is stored in localStorage so iterating
 * on copy doesn't require re-running the build. Falls back to the static JSON
 * when nothing is saved.
 */
export function loadPortfolio(): Portfolio {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Portfolio;
  } catch {
    /* ignore — fall through to static */
  }
  return portfolioStatic as Portfolio;
}

export function savePortfolioOverride(p: Portfolio) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent("portfolio-data-changed"));
}

export function clearPortfolioOverride() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("portfolio-data-changed"));
}

/** Subscribe to changes (override saved/cleared) so live preview updates. */
export function usePortfolio(): Portfolio {
  const [data, setData] = useState<Portfolio>(loadPortfolio);
  useEffect(() => {
    const handler = () => setData(loadPortfolio());
    window.addEventListener("portfolio-data-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("portfolio-data-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return data;
}

export const PORTFOLIO_STORAGE_KEY = STORAGE_KEY;
