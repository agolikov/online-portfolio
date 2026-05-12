import type { CoverLetterMetric, Portfolio } from "@/types/portfolio";

export interface ResumeRow {
  id: number;
  hash: string;
  alias: string | null;
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
  enabled?: boolean;
  summary: string;
  recipientName?: string;
  metrics: CoverLetterMetric[];
  vacancyText?: string;
}

export type SseEvent =
  | { type: "delta"; text: string }
  | { type: "tool"; name: string }
  | { type: "done"; dataChanged: boolean; coverLetterSaved: boolean; toolsUsed: string[] }
  | { type: "error"; message: string };

export type CoverLetterSseEvent =
  | { type: "delta"; text: string }
  | { type: "done"; coverLetter: string; summary: string; recipientName: string; metrics: CoverLetterMetric[]; vacancyText: string }
  | { type: "error"; message: string };

export type TextSseEvent =
  | { type: "delta"; text: string }
  | { type: "done"; text: string }
  | { type: "error"; message: string };

async function* readSse(res: Response): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) yield line.slice(6);
    }
  }
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

  updateAlias: (hash: string, alias: string | null) =>
    req<ResumeRow>(`/resumes/${hash}/alias`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias }),
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

  saveCoverLetter: (hash: string, coverLetter: string, vacancyText?: string, recipientName?: string) =>
    req<CoverLetterResponse>(`/resumes/${hash}/cover`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter, vacancyText, recipientName }),
    }),

  generateCoverLetter: (hash: string, vacancyText?: string, recipientName?: string) =>
    req<CoverLetterResponse>(`/resumes/${hash}/cover/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vacancyText, recipientName }),
    }),

  chatStream: async (hash: string, messages: ChatMessage[], onEvent: (e: SseEvent) => void): Promise<void> => {
    const res = await fetch(`${BASE}/chat/${hash}/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
    for await (const line of readSse(res)) {
      try { onEvent(JSON.parse(line) as SseEvent); } catch { /* ignore */ }
    }
  },

  refineTextStream: async (
    hash: string,
    text: string,
    onEvent: (e: TextSseEvent) => void,
  ): Promise<void> => {
    const res = await fetch(`${BASE}/resumes/${hash}/text/refine/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
    for await (const line of readSse(res)) {
      try { onEvent(JSON.parse(line) as TextSseEvent); } catch { /* ignore */ }
    }
  },

  editCoverLetterStream: async (
    hash: string,
    content: string,
    action: "refine" | "longer" | "shorter",
    onEvent: (e: TextSseEvent) => void,
  ): Promise<void> => {
    const res = await fetch(`${BASE}/resumes/${hash}/cover/edit/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, action }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
    for await (const line of readSse(res)) {
      try { onEvent(JSON.parse(line) as TextSseEvent); } catch { /* ignore */ }
    }
  },

  editSummaryStream: async (
    hash: string,
    action: "expand" | "condense" | "rebuild",
    onEvent: (e: TextSseEvent) => void,
  ): Promise<void> => {
    const res = await fetch(`${BASE}/resumes/${hash}/summary/edit/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
    for await (const line of readSse(res)) {
      try { onEvent(JSON.parse(line) as TextSseEvent); } catch { /* ignore */ }
    }
  },

  generateCoverLetterStream: async (
    hash: string,
    vacancyText: string,
    recipientName: string,
    onEvent: (e: CoverLetterSseEvent) => void,
  ): Promise<void> => {
    const res = await fetch(`${BASE}/resumes/${hash}/cover/generate/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vacancyText, recipientName }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
    for await (const line of readSse(res)) {
      try { onEvent(JSON.parse(line) as CoverLetterSseEvent); } catch { /* ignore */ }
    }
  },
};
