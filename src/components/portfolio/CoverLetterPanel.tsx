import type { PortfolioCoverLetter } from "@/types/portfolio";

export function CoverLetterPanel({ coverLetter }: { coverLetter: PortfolioCoverLetter }) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">{coverLetter.content}</p>
  );
}
