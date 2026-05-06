import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Portfolio, Tech } from "@/types/portfolio";
import { ThemeProvider } from "@/context/ThemeContext";
import { ControlBar } from "@/components/portfolio/ControlBar";
import { Header } from "@/components/portfolio/Header";
import { TechFilter } from "@/components/portfolio/TechFilter";
import { ExperienceList } from "@/components/portfolio/ExperienceList";
import { ProjectGrid } from "@/components/portfolio/ProjectGrid";
import { CertificateList } from "@/components/portfolio/CertificateList";
import { EducationList } from "@/components/portfolio/EducationList";
import { ContactForm } from "@/components/portfolio/ContactForm";
import { StoriesList } from "@/components/portfolio/StoriesList";
import { exportPortfolioPdf } from "@/lib/exportPdf";
import { usePortfolio } from "@/lib/portfolioStore";
import staticData from "@/data/portfolio.json";
import type { Experience } from "@/types/portfolio";

function parseTechParam(s: string | null): string[] {
  if (!s) return [];
  return s.split(",").map((t) => t.trim()).filter(Boolean);
}

export function PortfolioBody({ externalData }: { externalData?: Portfolio } = {}) {
  const storeData: Portfolio = usePortfolio();
  const data = externalData ?? storeData;
  const [searchParams, setSearchParams] = useSearchParams();

  // Merge store experience with static tech arrays so year counters are accurate
  // even when localStorage predates the latest tech tag additions.
  const experienceForYears = useMemo<Experience[]>(() => {
    return data.experience.map((e) => {
      const staticExp = (staticData.experience as Experience[]).find((s) => s.id === e.id);
      if (!staticExp) return e;
      return { ...e, tech: [...new Set([...e.tech, ...staticExp.tech])] };
    });
  }, [data.experience]);

  const EXTRA_TECH: Tech[] = [
    { name: "Git",         category: "Tool" },
    { name: "Azure DevOps",category: "Tool" },
    { name: "TeamCity",    category: "Tool" },
    { name: "Linux",       category: "OS"   },
    { name: "macOS",       category: "OS"   },
  ];

  const allTech = useMemo<Tech[]>(() => {
    const existing = new Set(data.tech.map((t) => t.name));
    const extras = EXTRA_TECH.filter((t) => !existing.has(t.name));
    const merged = [...data.tech, ...extras];
    const mergedNames = new Set(merged.map((t) => t.name));
    const eduSkills = (data.education ?? [])
      .flatMap((e) => e.skills ?? [])
      .filter((s, i, arr) => arr.indexOf(s) === i && !mergedNames.has(s))
      .map((s) => ({ name: s, category: "Fundamentals" }));
    return [...merged, ...eduSkills];
  }, [data.tech, data.education]);

  // Initialize from URL ?tech=Go,Kafka, then validate against known tech names.
  const knownNames = new Set(allTech.map((t) => t.name));
  const initial = parseTechParam(searchParams.get("tech")).filter((t) => knownNames.has(t));
  const [selected, setSelected] = useState<string[]>(initial);

  // Keep URL in sync with selection.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (selected.length === 0) next.delete("tech");
    else next.set("tech", selected.join(","));
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function toggle(name: string) {
    setSelected((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  }

  return (
    <div className="min-h-screen px-3 py-4 md:px-6 md:py-8">
      <main className="mx-auto flex max-w-4xl flex-col gap-4 md:gap-8">
        <ControlBar onExport={() => exportPortfolioPdf(data, selected)} />
        <Header profile={data.profile} />
        {allTech.length > 0 && (
          <TechFilter
            tech={allTech}
            experience={experienceForYears}
            selected={selected}
            onToggle={toggle}
            onClear={() => setSelected([])}
          />
        )}
        {data.experience.length > 0 && (
          <ExperienceList experience={data.experience} selected={selected} onToggle={toggle} />
        )}
        {data.projects.length > 0 && (
          <ProjectGrid projects={data.projects} selected={selected} onToggle={toggle} />
        )}
        {(data.certificates ?? []).length > 0 && (
          <CertificateList certificates={data.certificates ?? []} selected={selected} />
        )}
        {(data.education ?? []).length > 0 && (
          <EducationList education={data.education!} />
        )}
        {(data.stories ?? []).filter((story) => story.public !== false).length > 0 && (
          <StoriesList stories={(data.stories ?? []).filter((story) => story.public !== false)} />
        )}
        <ContactForm profile={data.profile} />

        <footer className="py-4 text-center text-xs uppercase tracking-widest text-muted-foreground">
          End of document · {data.profile.name}
        </footer>
      </main>
    </div>
  );
}

const Index = ({ externalData }: { externalData?: Portfolio } = {}) => (
  <ThemeProvider>
    <PortfolioBody externalData={externalData} />
  </ThemeProvider>
);

export default Index;
