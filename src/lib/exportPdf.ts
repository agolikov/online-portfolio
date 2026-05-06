import { jsPDF } from "jspdf";
import type { Portfolio } from "@/types/portfolio";

export function exportPortfolioPdf(data: Portfolio, selectedTech: string[]) {
  const { profile, experience, projects, certificates = [], education = [] } = data;

  const expFiltered = selectedTech.length === 0
    ? experience
    : experience.filter((e) => e.tech.some((t) => selectedTech.includes(t)));
  const prjFiltered = selectedTech.length === 0
    ? projects
    : projects.filter((p) => p.tech.some((t) => selectedTech.includes(t)));
  const certFiltered = selectedTech.length === 0
    ? certificates
    : certificates.filter((c) => c.tech?.some((t) => selectedTech.includes(t)));

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
    const lines = doc.splitTextToSize(str, W - M * 2) as string[];
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
  doc.text(profile.name, M, y);
  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(80);
  const titleLine = [profile.title, profile.location].filter(Boolean).join(" · ");
  if (titleLine) { doc.text(titleLine, M, y); }
  y += 16;

  const contactParts = [
    profile.email,
    profile.website,
    profile.github,
    profile.linkedin,
  ].filter(Boolean);
  if (contactParts.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(contactParts.join("  ·  "), M, y);
  }
  y += 14;
  rule();

  text(profile.summary, { size: 10, color: 60, gap: 3 });
  y += 6;

  if (selectedTech.length > 0) {
    text("ACTIVE FILTER", { size: 8, bold: true, color: 100 });
    text(selectedTech.join(" · "), { size: 10, bold: true, color: 20 });
    y += 4;
  }

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
       doc.text(`${e.role} — ${e.company}`, M, y);
       doc.setFont("helvetica", "normal");
       doc.setTextColor(90);
       doc.text(e.period, W - M, y, { align: "right" });
       y += 14;
       doc.setFontSize(9);
       doc.setTextColor(110);
       doc.text(e.location, M, y);
       y += 12;

       e.highlights.forEach((h) => {
         doc.setFont("helvetica", "normal");
         doc.setFontSize(10);
         doc.setTextColor(40);
         const lines = doc.splitTextToSize("• " + h, W - M * 2 - 10) as string[];
         lines.forEach((l) => {
           ensure(13);
           doc.text(l, M + 8, y);
           y += 13;
         });
       });

       doc.setFont("helvetica", "italic");
       doc.setFontSize(9);
       doc.setTextColor(80);
       const techLine = "Tech: " + e.tech.join(", ");
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
     text("PROJECTS", SECTION_TITLE_OPTS);
     y += SECTION_GAP_AFTER_TITLE;

     prjFiltered.forEach((p) => {
       ensure(50);
       doc.setFont("helvetica", "bold");
       doc.setFontSize(11);
       doc.setTextColor(15);
       doc.text(p.name, M, y);
       doc.setFont("helvetica", "normal");
       doc.setFontSize(9);
       doc.setTextColor(110);
       doc.text(p.link, W - M, y, { align: "right" });
       y += 13;
       text(p.tagline, { size: 10, bold: true, color: 40, gap: 3 });
       text(p.description, { size: 10, color: 60, gap: 3 });
       doc.setFont("helvetica", "italic");
       doc.setFontSize(9);
       doc.setTextColor(80);
       const techLines = doc.splitTextToSize("Tech: " + p.tech.join(", "), W - M * 2) as string[];
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
       doc.text(c.name, M, y);
       doc.setFont("helvetica", "normal");
       doc.setTextColor(90);
       doc.text(c.year, W - M, y, { align: "right" });
       y += 12;
       doc.setFontSize(9);
       doc.setTextColor(90);
       const meta = c.credentialId ? `${c.issuer}  ·  ID ${c.credentialId}` : c.issuer;
       doc.text(meta, M, y);
       y += 14;
     });
   }

   // Education
   if (education.length > 0) {
     rule();
     y += 4;
     text("EDUCATION", SECTION_TITLE_OPTS);
     y += SECTION_GAP_AFTER_TITLE;

     education.forEach((edu) => {
       ensure(50);
       doc.setFont("helvetica", "bold");
       doc.setFontSize(10);
       doc.setTextColor(20);
       doc.text(edu.institution, M, y);
       doc.setFont("helvetica", "normal");
       doc.setFontSize(9);
       doc.setTextColor(110);
       doc.text(edu.period, W - M, y, { align: "right" });
       y += 14;

       doc.setFont("helvetica", "normal");
       doc.setFontSize(9);
       doc.setTextColor(90);
       const eduLine = `${edu.degree} · ${edu.field}`;
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
    doc.text(`${profile.name} · Page ${i} of ${total}`, W / 2, H - 20, { align: "center" });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${profile.name.replace(/\s+/g, "_")}_cv_${stamp}.pdf`);
}
