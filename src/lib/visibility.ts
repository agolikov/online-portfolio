import type { PortfolioCoverLetter, Story } from "@/types/portfolio";

export interface VisibleItem {
  enabled?: boolean;
}

export function isVisible(item?: VisibleItem | null): boolean {
  return item?.enabled !== false;
}

export function isStoryVisible(story: Story): boolean {
  return story.enabled ?? story.public ?? true;
}

export function isCoverLetterVisible(coverLetter?: PortfolioCoverLetter | null): boolean {
  return Boolean(coverLetter?.content) && coverLetter?.enabled !== false;
}
