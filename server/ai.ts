import "dotenv/config";
import OpenAI from "openai";
import type { Certificate, CoverLetterMetric, Education, Experience, Portfolio, Project, Story } from "../src/types/portfolio.js";
import { db } from "./db.js";
import { resumes } from "./schema.js";
import { eq } from "drizzle-orm";
import toolsJson from "./tools.json" with { type: "json" };

export const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY ?? "no-key",
  baseURL: process.env.AI_BASE_URL, // undefined → OpenAI default; set for Ollama / other compat APIs
});

export const MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";

// Tool schemas live in tools.json — edit that file to add/change tools without touching logic here
export const TOOLS = toolsJson as unknown as OpenAI.Chat.Completions.ChatCompletionTool[];

export interface CoverLetterResult {
  coverLetter: string;
  summary: string;
  recipientName: string;
  metrics: CoverLetterMetric[];
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1),
  );
}

function clampScore(score: number): number {
  return Math.max(5, Math.min(98, Math.round(score)));
}

export function scoreRoleFit(portfolio: Portfolio, vacancyText = ""): CoverLetterMetric[] {
  const vacancy = tokenize(vacancyText);
  const candidateTech = new Set(portfolio.tech.map((t) => t.name.toLowerCase()));
  const experienceText = portfolio.experience
    .flatMap((e) => [e.role, e.company, e.location, ...e.highlights, ...e.tech])
    .join(" ");
  const candidateWords = tokenize(`${portfolio.profile.title} ${portfolio.profile.summary} ${experienceText}`);
  const vacancyTechHits = [...candidateTech].filter((tech) => vacancy.has(tech) || vacancyText.toLowerCase().includes(tech));
  const techScore = vacancyText.trim()
    ? clampScore(45 + vacancyTechHits.length * 9 + Math.min(15, candidateTech.size))
    : clampScore(70 + Math.min(20, candidateTech.size / 2));

  const sharedWords = [...vacancy].filter((word) => candidateWords.has(word));
  const experienceScore = vacancyText.trim()
    ? clampScore(40 + Math.min(45, sharedWords.length * 3))
    : 78;

  const profileText = `${portfolio.profile.title} ${portfolio.profile.summary} ${experienceText}`.toLowerCase();
  const candidateLead = /(lead|leader|principal|staff|manager|mentor|architect|head)/.test(profileText);
  const roleNeedsLead = /(lead|leader|principal|staff|manager|architect|head)/.test(vacancyText.toLowerCase());
  const roleJunior = /(junior|intern|graduate|entry)/.test(vacancyText.toLowerCase());
  const leadershipScore = roleNeedsLead
    ? (candidateLead ? 86 : 48)
    : roleJunior
      ? (candidateLead ? 62 : 82)
      : (candidateLead ? 80 : 68);

  const overall = clampScore(techScore * 0.35 + experienceScore * 0.35 + leadershipScore * 0.2 + 8);

  return [
    {
      id: "techStack",
      label: "Tech stack overlap",
      score: techScore,
      summary: vacancyText.trim()
        ? `${vacancyTechHits.length} direct stack signal${vacancyTechHits.length === 1 ? "" : "s"} found in the role text.`
        : "No vacancy text provided, so this uses the candidate's current stack breadth.",
    },
    {
      id: "experience",
      label: "Experience & transferable skills",
      score: experienceScore,
      summary: vacancyText.trim()
        ? `${sharedWords.length} resume-to-role keyword overlap signal${sharedWords.length === 1 ? "" : "s"} found.`
        : "No vacancy text provided, so this uses the candidate's experience depth.",
    },
    {
      id: "leadership",
      label: "Leadership level",
      score: leadershipScore,
      summary: roleNeedsLead
        ? candidateLead ? "The role asks for leadership and the resume shows leadership signals." : "The role asks for leadership but the resume has limited leadership signals."
        : "Leadership expectations appear compatible with the resume.",
    },
    {
      id: "overall",
      label: "Overall match",
      score: overall,
      summary: overall >= 80 ? "Strong fit." : overall >= 60 ? "Workable fit with gaps to frame carefully." : "Weak fit based on the provided role text.",
    },
  ];
}

export function attachCoverLetter(
  portfolio: Portfolio,
  coverLetter: string,
  vacancyText: string,
  metrics: CoverLetterMetric[],
  generated: boolean,
  summary = summarizeCandidate(portfolio),
  recipientName = "",
  enabled = portfolio.coverLetters?.current?.enabled ?? true,
): Portfolio {
  const now = new Date().toISOString();
  return {
    ...portfolio,
    coverLetters: {
      ...portfolio.coverLetters,
      current: {
        content: coverLetter,
        enabled,
        summary,
        recipientName,
        vacancyText,
        metrics,
        generatedAt: generated ? now : portfolio.coverLetters?.current?.generatedAt,
        updatedAt: now,
      },
    },
  };
}

function summarizeCandidate(portfolio: Portfolio): string {
  const latest = portfolio.experience[0];
  const topTech = portfolio.tech.slice(0, 5).map((t) => t.name).join(", ");
  const latestText = latest ? ` Most recently: ${latest.role} at ${latest.company}.` : "";
  return `${portfolio.profile.name} is a ${portfolio.profile.title}. ${portfolio.profile.summary}${latestText}${topTech ? ` Core stack: ${topTech}.` : ""}`.trim();
}

const HONEST_COVER_LETTER_RULES = `Evidence rules:
- Use only achievements, skills, employers, projects, certificates, education, stories, metrics, and impact explicitly present in the resume evidence.
- Do not invent or imply missing metrics, production impact, leadership scope, employers, projects, certifications, domain experience, or years of experience.
- Do not claim direct experience with a required technology unless it appears in the resume evidence.
- You may describe transferable skills only when the resume evidence supports the bridge; label them as transferable or adjacent rather than direct experience.
- Be honest about important missing or weakly supported requirements, but keep the letter constructive and professional.
- Prefer concrete resume-backed examples over generic enthusiasm.
- If the evidence is thin, write a shorter, more modest letter instead of filling gaps with speculation.`;

function buildCoverLetterEvidenceContext(portfolio: Portfolio): string {
  const visibleExperience = (portfolio.experience ?? []).filter((item) => item.enabled !== false);
  const visibleProjects = (portfolio.projects ?? []).filter((item) => item.enabled !== false);
  const visibleCertificates = (portfolio.certificates ?? []).filter((item) => item.enabled !== false);
  const visibleEducation = (portfolio.education ?? []).filter((item) => item.enabled !== false);
  const visibleStories = (portfolio.stories ?? []).filter((item) => item.enabled !== false);

  const experience = visibleExperience.slice(0, 5).map((item) => [
    `- ${item.role} at ${item.company}${item.period ? ` (${item.period})` : ""}`,
    item.tech.length ? `  Tech: ${item.tech.join(", ")}` : "",
    ...item.highlights.slice(0, 4).map((highlight) => `  Achievement: ${highlight}`),
  ].filter(Boolean).join("\n")).join("\n");

  const projects = visibleProjects.slice(0, 5).map((item) => [
    `- ${item.name}${item.year ? ` (${item.year})` : ""}: ${item.tagline || item.description}`,
    item.tech.length ? `  Tech: ${item.tech.join(", ")}` : "",
  ].filter(Boolean).join("\n")).join("\n");

  const certificates = visibleCertificates.slice(0, 6)
    .map((item) => `- ${item.name}${item.issuer ? `, ${item.issuer}` : ""}${item.year ? ` (${item.year})` : ""}`)
    .join("\n");

  const education = visibleEducation.slice(0, 4)
    .map((item) => `- ${item.degree}${item.field ? ` in ${item.field}` : ""}, ${item.institution}${item.period ? ` (${item.period})` : ""}`)
    .join("\n");

  const stories = visibleStories.slice(0, 4)
    .map((item) => `- ${item.question}: ${item.answer}`)
    .join("\n");

  return [
    `Profile: ${portfolio.profile.name}, ${portfolio.profile.title}. ${portfolio.profile.summary}`,
    portfolio.tech.length ? `Skills: ${portfolio.tech.map((item) => item.name).join(", ")}` : "",
    experience ? `Experience:\n${experience}` : "",
    projects ? `Projects:\n${projects}` : "",
    certificates ? `Certificates:\n${certificates}` : "",
    education ? `Education:\n${education}` : "",
    stories ? `Stories:\n${stories}` : "",
  ].filter(Boolean).join("\n\n");
}

function buildHonestFallbackCoverLetter(
  portfolio: Portfolio,
  greeting: string,
  summary: string,
  vacancyText: string,
  metrics: CoverLetterMetric[],
): string {
  const p = portfolio.profile;
  const latest = (portfolio.experience ?? []).find((item) => item.enabled !== false);
  const techSignals = portfolio.tech.slice(0, 5).map((t) => t.name).join(", ");
  const importantGaps = metrics
    .filter((m) => m.score < 65)
    .map((m) => `- ${m.label}: ${m.score}% - ${m.summary}`)
    .join("\n") || "- No major mismatch stands out from the available role text.";

  return `${greeting}

I am applying as ${p.name}, ${p.title}. I want to be direct about the fit based on my actual resume.

The strongest evidence is ${summary}${latest ? ` My recent work as ${latest.role} at ${latest.company} included ${latest.highlights[0] ?? "relevant delivery experience"}.` : ""}${techSignals ? ` My visible stack includes ${techSignals}.` : ""}

I also want to be clear about the trade-offs. Based on the provided job description${vacancyText.trim() ? "" : " (which is limited)"}, these are the areas to frame carefully:
${importantGaps}

If that mix is useful for the role, I would be glad to discuss where I can contribute quickly and where I would need ramp-up time.

Best regards,
${p.name}`;
}

async function savePortfolio(hash: string, portfolio: Portfolio): Promise<void> {
  await db.update(resumes).set({ resumeData: portfolio }).where(eq(resumes.hash, hash));
}

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  hash: string,
  portfolio: Portfolio,
): Promise<{ result: string; updatedPortfolio?: Portfolio; coverLetterSaved?: boolean }> {
  switch (name) {
    case "get_resume":
      return { result: JSON.stringify(portfolio, null, 2) };

    case "update_skills": {
      const skills = args.skills as Array<{ name: string; category: string }>;
      const updated: Portfolio = { ...portfolio, tech: skills };
      await savePortfolio(hash, updated);
      const cats = new Set(skills.map((s) => s.category)).size;
      return {
        result: `Skills updated — ${skills.length} skills across ${cats} categories.`,
        updatedPortfolio: updated,
      };
    }

    case "update_profile": {
      const profile = args.profile as Portfolio["profile"];
      const updated: Portfolio = { ...portfolio, profile };
      await savePortfolio(hash, updated);
      return { result: "Profile updated.", updatedPortfolio: updated };
    }

    case "update_profile_field": {
      const field = args.field as keyof Portfolio["profile"];
      const value = args.value as string;
      const updated: Portfolio = { ...portfolio, profile: { ...portfolio.profile, [field]: value } };
      await savePortfolio(hash, updated);
      return { result: `Profile.${field} updated.`, updatedPortfolio: updated };
    }

    case "update_experience": {
      const experience = args.experience as Experience[];
      const updated: Portfolio = { ...portfolio, experience };
      await savePortfolio(hash, updated);
      return { result: `Experience updated — ${experience.length} entries.`, updatedPortfolio: updated };
    }

    case "update_projects": {
      const projects = args.projects as Project[];
      const updated: Portfolio = { ...portfolio, projects };
      await savePortfolio(hash, updated);
      return { result: `Projects updated — ${projects.length} entries.`, updatedPortfolio: updated };
    }

    case "update_certificates": {
      const certificates = args.certificates as Certificate[];
      const updated: Portfolio = { ...portfolio, certificates };
      await savePortfolio(hash, updated);
      return { result: `Certificates updated — ${certificates.length} entries.`, updatedPortfolio: updated };
    }

    case "update_education": {
      const education = args.education as Education[];
      const updated: Portfolio = { ...portfolio, education };
      await savePortfolio(hash, updated);
      return { result: `Education updated — ${education.length} entries.`, updatedPortfolio: updated };
    }

    case "update_stories": {
      const stories = args.stories as Story[];
      const updated: Portfolio = { ...portfolio, stories };
      await savePortfolio(hash, updated);
      return { result: `Stories updated — ${stories.length} entries.`, updatedPortfolio: updated };
    }

    case "save_cover_letter": {
      const content = args.content as string;
      const enabled = typeof args.enabled === "boolean" ? args.enabled : undefined;
      const metrics = portfolio.coverLetters?.current?.metrics ?? scoreRoleFit(portfolio);
      const vacancyText = portfolio.coverLetters?.current?.vacancyText ?? "";
      const summary = portfolio.coverLetters?.current?.summary ?? summarizeCandidate(portfolio);
      const recipientName = portfolio.coverLetters?.current?.recipientName ?? "";
      const updated = attachCoverLetter(portfolio, content, vacancyText, metrics, false, summary, recipientName, enabled);
      await db.update(resumes).set({ coverLetter: content, resumeData: updated }).where(eq(resumes.hash, hash));
      return { result: "Cover letter saved. Accessible at /<hash>/cover.", updatedPortfolio: updated, coverLetterSaved: true };
    }

    default:
      return { result: `Unknown tool: ${name}` };
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

function systemPrompt(portfolio: Portfolio): string {
  return `You are an AI assistant managing ${portfolio.profile.name}'s professional portfolio.

What you can do:
- Answer questions about their experience, skills, projects, education, and behavioral stories
- Update profile, skills, experience, projects, certificates, education, stories, and cover letters in the database (those changes are live immediately)
- Generate professional reports and analysis based on the resume
- Write cover letters and save them so they appear at the /cover URL

Rules:
- Call get_resume before answering factual questions about the person.
- Before using any update_* tool, call get_resume and preserve unrelated existing entries. Section update tools replace the entire section they receive.
- When updating data confirm what changed.
- When writing or revising a cover letter, first call get_resume, use only resume-backed evidence, do not invent achievements or metrics, craft the full letter, then call save_cover_letter.
- Be concise and professional. Tailor responses to a job-seeking context.`;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

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

export async function chat(hash: string, messages: ChatMessage[]): Promise<ChatResponse> {
  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "no-key") {
    return {
      content: "AI features are disabled. Set AI_API_KEY (and optionally AI_BASE_URL, AI_MODEL) in your .env file.",
      toolsUsed: [],
      dataChanged: false,
      coverLetterSaved: false,
    };
  }

  const [row] = await db.select().from(resumes).where(eq(resumes.hash, hash)).limit(1);
  if (!row) throw new Error("Resume not found");

  let portfolio = row.resumeData as Portfolio;
  let dataChanged = false;
  let coverLetterSaved = false;
  const toolsUsed: string[] = [];

  const thread: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt(portfolio) },
    ...messages,
  ];

  for (let i = 0; i < 8; i++) {
    const res = await openai.chat.completions.create({
      model: MODEL,
      messages: thread,
      tools: TOOLS,
      tool_choice: "auto",
    });

    const msg = res.choices[0].message;
    thread.push(msg);

    if (!msg.tool_calls?.length) {
      return { content: msg.content ?? "", toolsUsed, dataChanged, coverLetterSaved };
    }

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(call.function.arguments); } catch { /* ignore */ }

      toolsUsed.push(call.function.name);
      const { result, updatedPortfolio, coverLetterSaved: cls } =
        await executeTool(call.function.name, args, hash, portfolio);

      if (updatedPortfolio) { portfolio = updatedPortfolio; dataChanged = true; }
      if (cls) coverLetterSaved = true;

      thread.push({ role: "tool", tool_call_id: call.id, content: result });
    }
  }

  return { content: "Reached tool iteration limit.", toolsUsed, dataChanged, coverLetterSaved };
}

// ── Streaming chat ────────────────────────────────────────────────────────────

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onTool: (name: string) => void;
  onDone: (result: ChatResponse) => void;
  onError: (err: Error) => void;
}

export async function chatStream(hash: string, messages: ChatMessage[], cb: StreamCallbacks): Promise<void> {
  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "no-key") {
    cb.onDelta("AI features are disabled. Set AI_API_KEY (and optionally AI_BASE_URL, AI_MODEL) in your .env file.");
    cb.onDone({ content: "AI features are disabled. Set AI_API_KEY (and optionally AI_BASE_URL, AI_MODEL) in your .env file.", toolsUsed: [], dataChanged: false, coverLetterSaved: false });
    return;
  }

  const [row] = await db.select().from(resumes).where(eq(resumes.hash, hash)).limit(1);
  if (!row) { cb.onError(new Error("Resume not found")); return; }

  let portfolio = row.resumeData as Portfolio;
  let dataChanged = false;
  let coverLetterSaved = false;
  const toolsUsed: string[] = [];

  const thread: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt(portfolio) },
    ...messages,
  ];

  for (let i = 0; i < 8; i++) {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: thread,
      tools: TOOLS,
      tool_choice: "auto",
      stream: true,
    });

    let content = "";
    const toolCallMap: Record<number, { id: string; name: string; args: string }> = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallMap[tc.index]) toolCallMap[tc.index] = { id: "", name: "", args: "" };
          if (tc.id) toolCallMap[tc.index].id = tc.id;
          if (tc.function?.name) toolCallMap[tc.index].name += tc.function.name;
          if (tc.function?.arguments) toolCallMap[tc.index].args += tc.function.arguments;
        }
      }

      if (delta.content) {
        content += delta.content;
        cb.onDelta(delta.content);
      }
    }

    const toolCallsArray = Object.values(toolCallMap);

    if (toolCallsArray.length === 0) {
      cb.onDone({ content, toolsUsed, dataChanged, coverLetterSaved });
      return;
    }

    thread.push({
      role: "assistant",
      content: content || null,
      tool_calls: toolCallsArray.map((tc) => ({
        type: "function" as const,
        id: tc.id,
        function: { name: tc.name, arguments: tc.args },
      })),
    });

    for (const tc of toolCallsArray) {
      if (!tc.name) continue;
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(tc.args); } catch { /* ignore */ }

      toolsUsed.push(tc.name);
      cb.onTool(tc.name);

      const { result, updatedPortfolio, coverLetterSaved: cls } =
        await executeTool(tc.name, args, hash, portfolio);

      if (updatedPortfolio) { portfolio = updatedPortfolio; dataChanged = true; }
      if (cls) coverLetterSaved = true;

      thread.push({ role: "tool", tool_call_id: tc.id, content: result });
    }
  }

  cb.onDone({ content: "Reached tool iteration limit.", toolsUsed, dataChanged, coverLetterSaved });
}

// ── Streaming cover letter generation ────────────────────────────────────────

export interface CoverLetterStreamCallbacks {
  onDelta: (text: string) => void;
  onDone: (result: CoverLetterResult) => void;
  onError: (err: Error) => void;
}

export async function generateCoverLetterStream(
  hash: string,
  vacancyText = "",
  recipientName = "",
  cb: CoverLetterStreamCallbacks,
): Promise<void> {
  const [row] = await db.select().from(resumes).where(eq(resumes.hash, hash)).limit(1);
  if (!row) { cb.onError(new Error("Resume not found")); return; }

  const portfolio = row.resumeData as Portfolio;
  const metrics = scoreRoleFit(portfolio, vacancyText);
  const summary = summarizeCandidate(portfolio);
  const evidenceContext = buildCoverLetterEvidenceContext(portfolio);
  const greetingName = recipientName.trim() || "Hiring Manager";
  const greeting = `Dear ${greetingName},`;

  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "no-key") {
    const letter = buildHonestFallbackCoverLetter(portfolio, greeting, summary, vacancyText, metrics);
    for (const char of letter) cb.onDelta(char);
    const updated = attachCoverLetter(portfolio, letter, vacancyText, metrics, true, summary, recipientName.trim());
    await db.update(resumes).set({ coverLetter: letter, resumeData: updated }).where(eq(resumes.hash, hash));
    cb.onDone({ coverLetter: letter, summary, recipientName: recipientName.trim(), metrics });
    return;
  }

  const stream = await openai.chat.completions.create({
    model: MODEL,
    stream: true,
    messages: [
      {
        role: "user",
        content: `You are writing a professional cover letter. Output ONLY the cover letter text — no preamble, no explanation.

${HONEST_COVER_LETTER_RULES}

Start exactly with: "${greeting}"

Requirements:
- Target 160–220 words. Plain text only.
- Be honest and direct. If the stack, domain, seniority, or leadership level is not a great fit, say so briefly without making it the whole letter.
- Highlight the most important fit points and the most important gaps.
- Include tech stack overlap, experience transferability, leadership match, and overall fit.
- End with: Best regards,\n${portfolio.profile.name}

Resume evidence:
${evidenceContext}

Candidate summary: ${summary}
Vacancy text: ${vacancyText || "(none provided)"}
Role-fit metrics:
${metrics.map((m) => `${m.label}: ${m.score}% — ${m.summary}`).join("\n")}`,
      },
    ],
  });

  let coverLetter = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      coverLetter += delta;
      cb.onDelta(delta);
    }
  }

  const updated = attachCoverLetter(portfolio, coverLetter, vacancyText, metrics, true, summary, recipientName.trim());
  await db.update(resumes).set({ coverLetter, resumeData: updated }).where(eq(resumes.hash, hash));
  cb.onDone({ coverLetter, summary, recipientName: recipientName.trim(), metrics });
}

// ── Generic text refine ───────────────────────────────────────────────────────

export async function refineTextStream(text: string, cb: TextStreamCallbacks): Promise<void> {
  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "no-key") {
    cb.onDelta(text);
    cb.onDone(text);
    return;
  }

  const stream = await openai.chat.completions.create({
    model: MODEL,
    stream: true,
    messages: [
      {
        role: "user",
        content: `Fix grammar, typos, and awkward phrasing. Keep the same meaning, tone, and approximate length. Output ONLY the refined text — no preamble or explanation.\n\n${text}`,
      },
    ],
  });

  let result = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) { result += delta; cb.onDelta(delta); }
  }
  cb.onDone(result);
}

// ── Cover letter edit (refine / longer / shorter) ────────────────────────────

export type CoverLetterEditAction = "refine" | "longer" | "shorter";

export interface TextStreamCallbacks {
  onDelta: (text: string) => void;
  onDone: (text: string) => void;
  onError: (err: Error) => void;
}

const COVER_EDIT_INSTRUCTIONS: Record<CoverLetterEditAction, string> = {
  refine: "Fix grammar, typos, and awkward phrasing only. Do not change the structure, length, meaning, or factual claims. Do not add new achievements, metrics, technologies, leadership scope, employers, projects, certifications, or impact.",
  longer: "Expand this cover letter by 20-30% by adding detail only to points already present in the letter. Do not add new achievements, metrics, technologies, leadership scope, employers, projects, certifications, or impact.",
  shorter: "Condense this cover letter by 20-30%, removing redundancy while preserving the same factual claims. Do not add new achievements, metrics, technologies, leadership scope, employers, projects, certifications, or impact.",
};

export async function editCoverLetterStream(
  content: string,
  action: CoverLetterEditAction,
  cb: TextStreamCallbacks,
): Promise<void> {
  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "no-key") {
    cb.onDelta(content);
    cb.onDone(content);
    return;
  }

  const stream = await openai.chat.completions.create({
    model: MODEL,
    stream: true,
    messages: [
      {
        role: "user",
        content: `${COVER_EDIT_INSTRUCTIONS[action]} Output ONLY the revised cover letter text — no preamble or explanation.\n\nCover letter:\n${content}`,
      },
    ],
  });

  let result = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) { result += delta; cb.onDelta(delta); }
  }
  cb.onDone(result);
}

// ── Profile summary edit ──────────────────────────────────────────────────────

export type SummaryEditAction = "expand" | "condense" | "rebuild";

const SUMMARY_INSTRUCTIONS: Record<SummaryEditAction, string> = {
  expand: "Expand the professional summary by adding more specific detail about skills, impact, and experience. Keep it one paragraph.",
  condense: "Condense the professional summary to its most essential points. Keep it one concise paragraph.",
  rebuild: "Rewrite the professional summary from scratch based on the candidate context below. Keep it one strong paragraph.",
};

export async function editSummaryStream(
  hash: string,
  action: SummaryEditAction,
  cb: TextStreamCallbacks,
): Promise<void> {
  const [row] = await db.select().from(resumes).where(eq(resumes.hash, hash)).limit(1);
  if (!row) { cb.onError(new Error("Resume not found")); return; }

  const portfolio = row.resumeData as Portfolio;
  const p = portfolio.profile;

  const visibleExp = (portfolio.experience ?? []).filter((e) => e.enabled !== false);
  const visibleProj = (portfolio.projects ?? []).filter((e) => e.enabled !== false);
  const visibleCerts = (portfolio.certificates ?? []).filter((e) => e.enabled !== false);

  const context = [
    `Name: ${p.name}`,
    `Title: ${p.title}`,
    `Current summary: ${p.summary}`,
    visibleExp.length ? `Experience: ${visibleExp.map((e) => `${e.role} at ${e.company}`).join("; ")}` : "",
    visibleProj.length ? `Projects: ${visibleProj.map((e) => e.name).join(", ")}` : "",
    visibleCerts.length ? `Certifications: ${visibleCerts.map((e) => e.name).join(", ")}` : "",
    `Skills: ${portfolio.tech.slice(0, 12).map((t) => t.name).join(", ")}`,
  ].filter(Boolean).join("\n");

  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "no-key") {
    cb.onDelta(p.summary);
    cb.onDone(p.summary);
    return;
  }

  const stream = await openai.chat.completions.create({
    model: MODEL,
    stream: true,
    messages: [
      {
        role: "user",
        content: `${SUMMARY_INSTRUCTIONS[action]} Output ONLY the summary text — no labels or explanation.\n\nCandidate context:\n${context}`,
      },
    ],
  });

  let result = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) { result += delta; cb.onDelta(delta); }
  }
  cb.onDone(result);
}

// ── Cover letter generation ───────────────────────────────────────────────────

export async function generateCoverLetter(hash: string, vacancyText = "", recipientName = ""): Promise<CoverLetterResult> {
  const [row] = await db.select().from(resumes).where(eq(resumes.hash, hash)).limit(1);
  if (!row) throw new Error("Resume not found");
  const portfolio = row.resumeData as Portfolio;
  const metrics = scoreRoleFit(portfolio, vacancyText);
  const summary = summarizeCandidate(portfolio);
  const evidenceContext = buildCoverLetterEvidenceContext(portfolio);
  const greetingName = recipientName.trim() || "Hiring Manager";
  const greeting = `Dear ${greetingName},`;

  // Fallback template when no AI key is configured
  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "no-key") {
    const letter = buildHonestFallbackCoverLetter(portfolio, greeting, summary, vacancyText, metrics);

    const updated = attachCoverLetter(portfolio, letter, vacancyText, metrics, true, summary, recipientName.trim());
    await db.update(resumes).set({ coverLetter: letter, resumeData: updated }).where(eq(resumes.hash, hash));
    return { coverLetter: letter, summary, recipientName: recipientName.trim(), metrics };
  }

  // AI-generated cover letter
  await chat(hash, [
    {
      role: "user",
      content: `Generate a professional cover letter for me. Steps:
1. Call get_resume to read my data.
2. Generate a short professional cover letter based on the job description and the resume data returned by get_resume.
3. Start exactly with this greeting: "${greeting}"
4. Keep it short enough to read in under 1 minute. Target 160-220 words. Plain text only.
5. Follow these evidence rules:
${HONEST_COVER_LETTER_RULES}
6. Be honest and direct. Do not sugarcoat weak fit areas. If the stack, domain, seniority, or leadership level is not a good fit, say that clearly and briefly without making it the whole letter.
7. Highlight only the most important fit points and the most important gaps.
8. Include:
   - tech stack overlap, including whether it is a strong or weak fit
   - direct experience and transferable skills, clearly separating adjacent stack fit from direct experience
   - leadership fit, especially if candidate seniority does not match the role
   - overall match percentage
9. Use this resume evidence snapshot only as grounding. The get_resume result is authoritative:
${evidenceContext}
10. Use this vacancy text as the role context when present:
${vacancyText || "(No vacancy text provided.)"}
11. Use these role-fit metrics explicitly and honestly:
${metrics.map((m) => `${m.label}: ${m.score}% - ${m.summary}`).join("\n")}
12. Call save_cover_letter with the completed letter.

Do not include bullet labels like "fit points" or "gaps" unless they read naturally in the letter. Output only the completed cover letter through save_cover_letter.`,
    },
  ]);

  const [updated] = await db
    .select({ coverLetter: resumes.coverLetter })
    .from(resumes)
    .where(eq(resumes.hash, hash))
    .limit(1);
  const coverLetter = updated?.coverLetter ?? "";
  const updatedPortfolio = attachCoverLetter(portfolio, coverLetter, vacancyText, metrics, true, summary, recipientName.trim());
  await db.update(resumes).set({ resumeData: updatedPortfolio }).where(eq(resumes.hash, hash));
  return { coverLetter, summary, recipientName: recipientName.trim(), metrics };
}
