import { jsPDF } from "jspdf";
import type { Portfolio } from "@/types/portfolio";
import { isVisible } from "@/lib/visibility";

const LINK_LABELS: Record<string, string> = {
  "github.com": "GitHub",
  "gitlab.com": "GitLab",
  "linkedin.com": "LinkedIn",
  "leetcode.com": "LeetCode",
  "stackoverflow.com": "Stack Overflow",
  "medium.com": "Medium",
  "dev.to": "Dev.to",
  "twitter.com": "Twitter",
  "x.com": "X",
};

function shortLink(url: string): string {
  const host = url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  return LINK_LABELS[host] ?? host;
}

function fullUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

function normalizePdfText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/```/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/[•·]/g, "-")
    .replace(/…/g, "...")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "- ")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function exportPortfolioPdf(data: Portfolio, selectedTech: string[], resumeUrl?: string) {
  const { profile, experience, projects, certificates = [], education = [] } = data;
  const visibleExperience = experience.filter(isVisible);
  const visibleProjects = projects.filter(isVisible);
  const visibleCertificates = certificates.filter(isVisible);
  const visibleEducation = education.filter(isVisible);

  const expFiltered = selectedTech.length === 0
    ? visibleExperience
    : visibleExperience.filter((e) => e.tech.some((t) => selectedTech.includes(t)));
  const prjFiltered = selectedTech.length === 0
    ? visibleProjects
    : visibleProjects.filter((p) => p.tech.some((t) => selectedTech.includes(t)));
  const certFiltered = selectedTech.length === 0
    ? visibleCertificates
    : visibleCertificates.filter((c) => c.tech?.some((t) => selectedTech.includes(t)));

   const doc = new jsPDF({ unit: "pt", format: "a4" });
   const W = doc.internal.pageSize.getWidth();
   const H = doc.internal.pageSize.getHeight();
   const M = 48;
   let y = M;

   const SECTION_TITLE_OPTS = { size: 12, bold: true, color: 15, gap: 4 };
   const SECTION_GAP_AFTER_TITLE = 2;

  function ensure(space: number) {
    if (y + space > H - M) {
      doc.addPage();
      y = M;
    }
  }

  function rule() {
    ensure(14);
    doc.setDrawColor(0);
    doc.setLineWidth(0.6);
    doc.line(M, y, W - M, y);
    y += 10;
  }

  function text(str: string, opts: { size?: number; bold?: boolean; color?: number; gap?: number } = {}) {
    const { size = 10, bold = false, color = 20, gap = 4 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(normalizePdfText(str), W - M * 2) as string[];
    lines.forEach((l) => {
      ensure(size + gap);
      doc.text(l, M, y);
      y += size + gap;
    });
  }

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(15);
  doc.text(normalizePdfText(profile.name), M, y);
  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(80);
  const titleLine = [profile.title, profile.location].filter(Boolean).join(" - ");
  if (titleLine) { doc.text(normalizePdfText(titleLine), M, y); }
  y += 16;

  const contactItems: { label: string; url: string }[] = [
    profile.email ? { label: profile.email, url: `mailto:${profile.email}` } : null,
    profile.website ? { label: shortLink(profile.website), url: fullUrl(profile.website) } : null,
    profile.github ? { label: shortLink(profile.github), url: fullUrl(profile.github) } : null,
    profile.linkedin ? { label: shortLink(profile.linkedin), url: fullUrl(profile.linkedin) } : null,
  ].filter(Boolean) as { label: string; url: string }[];
  if (contactItems.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60);
    const sep = "  -  ";
    const sepWidth = doc.getTextWidth(sep);
    let cx = M;
    contactItems.forEach((item, i) => {
      const label = normalizePdfText(item.label);
      const lw = doc.getTextWidth(label);
      doc.text(label, cx, y);
      doc.link(cx, y - 9, lw, 11, { url: item.url });
      cx += lw;
      if (i < contactItems.length - 1) {
        doc.text(sep, cx, y);
        cx += sepWidth;
      }
    });
  }
  y += 14;
  rule();

  text(profile.summary, { size: 10, color: 60, gap: 3 });
  y += 6;

	 // Experience
   if (expFiltered.length > 0) {
     rule();
     y += 4;
     text("EXPERIENCE", SECTION_TITLE_OPTS);
     y += SECTION_GAP_AFTER_TITLE;

     expFiltered.forEach((e) => {
       ensure(60);
       doc.setFont("helvetica", "bold");
       doc.setFontSize(11);
       doc.setTextColor(15);
       const expTitle = `${normalizePdfText(e.role)} - ${normalizePdfText(e.company)}`;
       doc.text(expTitle, M, y);
       if (e.companyUrl) {
         const rolePrefix = `${normalizePdfText(e.role)} - `;
         const lx = M + doc.getTextWidth(rolePrefix);
         doc.link(lx, y - 11, doc.getTextWidth(normalizePdfText(e.company)), 13, { url: fullUrl(e.companyUrl) });
       }
       doc.setFont("helvetica", "normal");
       doc.setTextColor(90);
       doc.text(normalizePdfText(e.period), W - M, y, { align: "right" });
       y += 14;
       doc.setFontSize(9);
       doc.setTextColor(110);
       doc.text(normalizePdfText(e.location), M, y);
       y += 12;

       e.highlights.forEach((h) => {
         doc.setFont("helvetica", "normal");
         doc.setFontSize(10);
         doc.setTextColor(40);
         const lines = doc.splitTextToSize(`- ${normalizePdfText(h)}`, W - M * 2 - 10) as string[];
         lines.forEach((l) => {
           ensure(13);
           doc.text(l, M + 8, y);
           y += 13;
         });
       });

       doc.setFont("helvetica", "italic");
       doc.setFontSize(9);
       doc.setTextColor(80);
       const techLine = `Tech: ${e.tech.map(normalizePdfText).join(", ")}`;
       const techLines = doc.splitTextToSize(techLine, W - M * 2) as string[];
       techLines.forEach((l) => {
         ensure(12);
         doc.text(l, M, y);
         y += 12;
       });
       y += 8;
     });
   }

   // Projects
   if (prjFiltered.length > 0) {
     rule();
     y += 4;
     text("SIDE PROJECTS", SECTION_TITLE_OPTS);
     y += SECTION_GAP_AFTER_TITLE;

     prjFiltered.forEach((p) => {
       ensure(50);
       doc.setFont("helvetica", "bold");
       doc.setFontSize(11);
       doc.setTextColor(15);
       const projTitle = (p.year && !p.hideYear) ? `${normalizePdfText(p.name)} - ${normalizePdfText(p.year)}` : normalizePdfText(p.name);
       doc.text(projTitle, M, y);
       doc.setFont("helvetica", "normal");
       doc.setFontSize(9);
       doc.setTextColor(110);
       if (p.link) {
         const label = shortLink(p.link);
         doc.text(label, W - M, y, { align: "right" });
         const lw = doc.getTextWidth(label);
         doc.link(W - M - lw, y - 9, lw, 11, { url: fullUrl(p.link) });
       }
       y += 13;
       text(p.tagline, { size: 10, bold: true, color: 40, gap: 3 });
       text(p.description, { size: 10, color: 60, gap: 3 });
       doc.setFont("helvetica", "italic");
       doc.setFontSize(9);
       doc.setTextColor(80);
       const techLines = doc.splitTextToSize(`Tech: ${p.tech.map(normalizePdfText).join(", ")}`, W - M * 2) as string[];
       techLines.forEach((l) => {
         ensure(12);
         doc.text(l, M, y);
         y += 12;
       });
       y += 8;
     });
   }

   // Certificates
   if (certFiltered.length > 0) {
     rule();
     y += 4;
     text("CERTIFICATES", SECTION_TITLE_OPTS);
     y += SECTION_GAP_AFTER_TITLE;
     certFiltered.forEach((c) => {
       ensure(28);
       doc.setFont("helvetica", "bold");
       doc.setFontSize(10);
       doc.setTextColor(20);
       doc.text(normalizePdfText(c.name), M, y);
       if (!c.hideYear && c.year) {
         doc.setFont("helvetica", "normal");
         doc.setTextColor(90);
         doc.text(normalizePdfText(c.year), W - M, y, { align: "right" });
       }
       y += 12;
       doc.setFontSize(9);
       doc.setTextColor(90);
       const meta = c.credentialId ? `${normalizePdfText(c.issuer)}  -  ID ${normalizePdfText(c.credentialId)}` : normalizePdfText(c.issuer);
       doc.text(meta, M, y);
       y += 14;
     });
   }

   // Education
   if (visibleEducation.length > 0) {
     rule();
     y += 4;
     text("EDUCATION", SECTION_TITLE_OPTS);
     y += SECTION_GAP_AFTER_TITLE;

     visibleEducation.forEach((edu) => {
       ensure(50);
       doc.setFont("helvetica", "bold");
       doc.setFontSize(10);
       doc.setTextColor(20);
       doc.text(normalizePdfText(edu.institution), M, y);
       if (edu.showDates !== false && edu.period) {
         doc.setFont("helvetica", "normal");
         doc.setFontSize(9);
         doc.setTextColor(110);
         doc.text(normalizePdfText(edu.period), W - M, y, { align: "right" });
       }
       y += 14;

       doc.setFont("helvetica", "normal");
       doc.setFontSize(9);
       doc.setTextColor(90);
       const eduLine = `${normalizePdfText(edu.degree)} - ${normalizePdfText(edu.field)}`;
       const eduLines = doc.splitTextToSize(eduLine, W - M * 2) as string[];
       eduLines.forEach((l) => {
         ensure(12);
         doc.text(l, M, y);
         y += 12;
       });
       y += 4;
     });
   }

   // Footer page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`${normalizePdfText(profile.name)} - Page ${i} of ${total}`, W / 2, H - 20, { align: "center" });
    if (resumeUrl) {
      const label = resumeUrl.replace(/^https?:\/\//, "");
      const lw = doc.getTextWidth(label);
      doc.text(label, W - M, H - 20, { align: "right" });
      doc.link(W - M - lw, H - 29, lw, 11, { url: resumeUrl });
    }
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const slug = resumeUrl ? resumeUrl.split("/").pop() : undefined;
  const namePart = profile.name.replace(/\s+/g, "_");
  doc.save(slug ? `${namePart}_${slug}_cv_${stamp}.pdf` : `${namePart}_cv_${stamp}.pdf`);
}
