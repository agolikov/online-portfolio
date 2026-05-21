import { describe, expect, it } from "vitest";
import { escapePdfSummaryText, normalizePdfText } from "@/lib/exportPdf";

describe("PDF text helpers", () => {
  it("normalizes generated markdown and smart punctuation for PDF text", () => {
    const text = "## Summary\n**Senior** Software Engineer — ships `AI/LLM` systems…";

    expect(normalizePdfText(text)).toBe("Summary\nSenior Software Engineer - ships AI/LLM systems...");
  });

  it("leaves normal summary text spacing intact", () => {
    const text = "Senior Software Engineer with 12+ years delivering C#, Go, Python, AI/LLMs, Rust and Terraform.";

    expect(normalizePdfText(text)).toBe(text);
  });

  it("escapes unsupported summary characters before PDF rendering", () => {
    const text = "Senior\u00A0Engineer\u202E with soft\u00ADhyphen and emoji ✅";

    expect(escapePdfSummaryText(text)).toBe("Senior Engineer with softhyphen and emoji");
  });
});
