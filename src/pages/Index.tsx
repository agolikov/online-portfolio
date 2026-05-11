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
import { CoverLetterPanel } from "@/components/portfolio/CoverLetterPanel";
import { resumesApi } from "@/lib/resumesApi";
import { isCoverLetterVisible, isStoryVisible, isVisible } from "@/lib/visibility";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import staticData from "@/data/portfolio.json";
import type { Experience } from "@/types/portfolio";

const EXTRA_TECH: Tech[] = [
  { name: "Git",         category: "Tool" },
  { name: "Azure DevOps",category: "Tool" },
  { name: "TeamCity",    category: "Tool" },
  { name: "Linux",       category: "OS"   },
  { name: "macOS",       category: "OS"   },
];

function parseTechParam(s: string | null): string[] {
  if (!s) return [];
  return s.split(",").map((t) => t.trim()).filter(Boolean);
}

export function PortfolioBody({ externalData }: { externalData?: Portfolio } = {}) {
  const [defaultData, setDefaultData] = useState<Portfolio | null>(null);
  const [defaultLoaded, setDefaultLoaded] = useState(Boolean(externalData));
  const data = externalData ?? defaultData ?? (staticData as Portfolio);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (externalData) return;
    let mounted = true;
    resumesApi.getDefault()
      .then((row) => {
        if (!mounted) return;
        setDefaultData(row?.resumeData ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setDefaultData(null);
      })
      .finally(() => {
        if (mounted) setDefaultLoaded(true);
      });
    return () => { mounted = false; };
  }, [externalData]);

  // Merge store experience with static tech arrays so year counters are accurate
  // even when localStorage predates the latest tech tag additions.
  const experienceForYears = useMemo<Experience[]>(() => {
    return data.experience.filter(isVisible).map((e) => {
      const staticExp = (staticData.experience as Experience[]).find((s) => s.id === e.id);
      if (!staticExp) return e;
      return { ...e, tech: [...new Set([...e.tech, ...staticExp.tech])] };
    });
  }, [data.experience]);

  const visibleExperience = useMemo(() => data.experience.filter(isVisible), [data.experience]);
  const visibleProjects = useMemo(() => data.projects.filter(isVisible), [data.projects]);
  const visibleCertificates = useMemo(() => (data.certificates ?? []).filter(isVisible), [data.certificates]);
  const visibleEducation = useMemo(() => (data.education ?? []).filter(isVisible), [data.education]);
  const visibleStories = useMemo(() => (data.stories ?? []).filter(isStoryVisible), [data.stories]);

  const allTech = useMemo<Tech[]>(() => {
    const existing = new Set(data.tech.map((t) => t.name));
    const extras = EXTRA_TECH.filter((t) => !existing.has(t.name));
    const merged = [...data.tech, ...extras];
    const mergedNames = new Set(merged.map((t) => t.name));
    const eduSkills = visibleEducation
      .flatMap((e) => e.skills ?? [])
      .filter((s, i, arr) => arr.indexOf(s) === i && !mergedNames.has(s))
      .map((s) => ({ name: s, category: "Fundamentals" }));
    return [...merged, ...eduSkills];
  }, [data.tech, visibleEducation]);

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

  async function exportPdf() {
    const { exportPortfolioPdf } = await import("@/lib/exportPdf");
    exportPortfolioPdf(data, selected);
  }

  const currentCoverLetter = data.coverLetters?.current;
  const visibleCoverLetter = isCoverLetterVisible(currentCoverLetter) ? currentCoverLetter : undefined;
  const [coverOpen, setCoverOpen] = useState(false);

  useEffect(() => {
    if (defaultLoaded && visibleCoverLetter?.content) {
      setCoverOpen(true);
    }
  }, [defaultLoaded, visibleCoverLetter?.content]);

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 md:gap-10">
        {!defaultLoaded && (
          <div className="paper px-4 py-3 text-sm text-muted-foreground">Loading...</div>
        )}
        <ControlBar onExport={exportPdf} />
        <Header profile={data.profile} />
        {visibleCoverLetter?.content && (
          <div className="paper rule flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest">Cover Letter</h2>
              <p className="mt-1 text-xs text-muted-foreground">Saved for this resume.</p>
            </div>
            <Dialog open={coverOpen} onOpenChange={setCoverOpen}>
              <DialogTrigger asChild>
                <button type="button" className="chip" data-active="true">
                  Show Cover Letter
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cover Letter</DialogTitle>
                  <DialogDescription className="sr-only">
                    Saved cover letter and role-fit summary for this resume.
                  </DialogDescription>
                </DialogHeader>
                <CoverLetterPanel coverLetter={visibleCoverLetter} />
              </DialogContent>
            </Dialog>
          </div>
        )}
        {allTech.length > 0 && (
          <TechFilter
            tech={allTech}
            experience={experienceForYears}
            selected={selected}
            onToggle={toggle}
            onClear={() => setSelected([])}
          />
        )}
        {visibleExperience.length > 0 && (
          <ExperienceList experience={visibleExperience} selected={selected} onToggle={toggle} />
        )}
        {visibleProjects.length > 0 && (
          <ProjectGrid projects={visibleProjects} selected={selected} onToggle={toggle} />
        )}
        {visibleCertificates.length > 0 && (
          <CertificateList certificates={visibleCertificates} selected={selected} />
        )}
        {visibleEducation.length > 0 && (
          <EducationList education={visibleEducation} />
        )}
        {visibleStories.length > 0 && (
          <StoriesList stories={visibleStories} />
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
