export interface Profile {
  name: string;
  title: string;
  location: string;
  email: string;
  website: string;
  github: string;
  linkedin: string;
  summary: string;
}
export interface Tech {
  name: string;
  category: string;
}
export interface Experience {
  id: string;
  enabled?: boolean;
  company: string;
  role: string;
  period: string;
  /** ISO YYYY-MM (or YYYY) start date — used to compute years per tech */
  start: string;
  /** ISO YYYY-MM end date, or "present" */
  end: string;
  location: string;
  highlights: string[];
  tech: string[];
}
export interface Project {
  id: string;
  enabled?: boolean;
  name: string;
  tagline: string;
  description: string;
  link: string;
  tech: string[];
}
export interface Certificate {
  id: string;
  enabled?: boolean;
  name: string;
  issuer: string;
  year: string;
  credentialId?: string;
  link?: string;
  tech?: string[];
}
export interface Education {
  id: string;
  enabled?: boolean;
  institution: string;
  shortName?: string;
  degree: string;
  field: string;
  period: string;
  start: string;
  end: string;
  thesis?: string;
  skills?: string[];
}
export interface Story {
  id: string;
  enabled?: boolean;
  question: string;
  answer: string;
  /** Legacy visibility flag. Use enabled for new data. */
  public?: boolean;
}

export interface CoverLetterMetric {
  id: "techStack" | "experience" | "leadership" | "overall";
  label: string;
  score: number;
  summary: string;
}

export interface PortfolioCoverLetter {
  content: string;
  enabled?: boolean;
  summary?: string;
  recipientName?: string;
  vacancyText?: string;
  metrics?: CoverLetterMetric[];
  generatedAt?: string;
  updatedAt: string;
}

export interface PortfolioCoverLetters {
  current?: PortfolioCoverLetter;
}

export interface Portfolio {
  profile: Profile;
  tech: Tech[];
  experience: Experience[];
  projects: Project[];
  certificates: Certificate[];
  education?: Education[];
  stories?: Story[];
  coverLetters?: PortfolioCoverLetters;
}
