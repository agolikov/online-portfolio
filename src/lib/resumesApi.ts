import type { CoverLetterMetric, Portfolio } from "@/types/portfolio";

export interface ResumeRow {
  id: number;
  hash: string;
  resumeData: Portfolio;
  note: string;
  coverLetter: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  toolsUsed: string[];
  dataChanged: boolean;
  coverLetterSaved: boolean;
}

export interface ChatHistoryMessage extends ChatMessage {
  toolsUsed?: string[];
  createdAt: string;
}

export interface CoverLetterResponse {
  coverLetter: string;
  summary: string;
  metrics: CoverLetterMetric[];
  vacancyText?: string;
}

const BASE = "/api";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

export interface TechSuggestion {
  id: number;
  name: string;
  category: string;
}

export const resumesApi = {
  list: () =>
    req<ResumeRow[]>("/resumes"),

  getTechSuggestions: () =>
    req<TechSuggestion[]>("/tech-suggestions"),

  get: (hash: string) =>
    req<ResumeRow>(`/resumes/${hash}`),

  getDefault: async () => {
    const res = await fetch(`${BASE}/resumes/default`);
    if (res.status === 204) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? res.statusText);
    }
    return res.json() as Promise<ResumeRow>;
  },

  create: (data: Portfolio) =>
    req<ResumeRow>("/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  update: (hash: string, data: Portfolio) =>
    req<ResumeRow>(`/resumes/${hash}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  updateNote: (hash: string, note: string) =>
    req<ResumeRow>(`/resumes/${hash}/note`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    }),

  toggle: (hash: string) =>
    req<ResumeRow>(`/resumes/${hash}/toggle`, { method: "PATCH" }),

  setDefault: (hash: string) =>
    req<ResumeRow>(`/resumes/${hash}/default`, { method: "PATCH" }),

  clearDefault: () =>
    req<{ cleared: boolean }>("/resumes/default", { method: "DELETE" }),

  remove: (hash: string) =>
    req<{ deleted: boolean }>(`/resumes/${hash}`, { method: "DELETE" }),

  // ── AI chat ────────────────────────────────────────────────────────────────
  getChatHistory: (hash: string) =>
    req<ChatHistoryMessage[]>(`/chat/${hash}/history`),

  clearChatHistory: (hash: string) =>
    req<{ deleted: boolean }>(`/chat/${hash}/history`, { method: "DELETE" }),

  chat: (hash: string, messages: ChatMessage[]) =>
    req<ChatResponse>(`/chat/${hash}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    }),

  // ── Cover letter ───────────────────────────────────────────────────────────
  getCoverLetter: (hash: string) =>
    req<CoverLetterResponse>(`/resumes/${hash}/cover`),

  saveCoverLetter: (hash: string, coverLetter: string, vacancyText?: string) =>
    req<CoverLetterResponse>(`/resumes/${hash}/cover`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter, vacancyText }),
    }),

  generateCoverLetter: (hash: string, vacancyText?: string) =>
    req<CoverLetterResponse>(`/resumes/${hash}/cover/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vacancyText }),
    }),
};
