import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { resumesApi, type ResumeRow } from "@/lib/resumesApi";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { PortfolioBody } from "./Index";

function ResumeHashBody() {
  const { hash } = useParams<{ hash: string }>();
  const [row, setRow] = useState<ResumeRow | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!hash) { setNotFound(true); return; }
    resumesApi.get(hash).then(setRow).catch(() => setNotFound(true));
  }, [hash]);

  // Re-fetch when AI chat updates the resume data
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ hash: string }>).detail;
      if (detail.hash === hash) {
        resumesApi.get(hash!).then(setRow).catch(() => {});
      }
    };
    window.addEventListener("resume-data-changed", handler);
    return () => window.removeEventListener("resume-data-changed", handler);
  }, [hash]);

  if (notFound) return <Navigate to="/" replace />;

  if (!row) return <PageSpinner />;

  return <PortfolioBody externalData={row.resumeData} resumeSlug={row.alias ?? row.hash} />;
}

export default function ResumeHashPage() {
  return (
    <ThemeProvider>
      <ResumeHashBody />
    </ThemeProvider>
  );
}
