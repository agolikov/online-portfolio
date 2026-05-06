import "dotenv/config";
import OpenAI from "openai";
import type { Certificate, CoverLetterMetric, Education, Experience, Portfolio, Project, Story } from "../src/types/portfolio.js";
import { db } from "./db.js";
import { resumes } from "./schema.js";
import { eq } from "drizzle-orm";
import toolsJson from "./tools.json";

export const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY ?? "no-key",
  baseURL: process.env.AI_BASE_URL, // undefined → OpenAI default; set for Ollama / other compat APIs
});

export const MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";

// Tool schemas live in tools.json — edit that file to add/change tools without touching logic here
export const TOOLS = toolsJson as unknown as OpenAI.Chat.Completions.ChatCompletionTool[];

export interface CoverLetterResult {
  coverLetter: string;
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
): Portfolio {
  const now = new Date().toISOString();
  return {
    ...portfolio,
    coverLetters: {
      ...portfolio.coverLetters,
      current: {
        content: coverLetter,
        vacancyText,
        metrics,
        generatedAt: generated ? now : portfolio.coverLetters?.current?.generatedAt,
        updatedAt: now,
      },
    },
  };
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
      const metrics = portfolio.coverLetters?.current?.metrics ?? scoreRoleFit(portfolio);
      const vacancyText = portfolio.coverLetters?.current?.vacancyText ?? "";
      const updated = attachCoverLetter(portfolio, content, vacancyText, metrics, false);
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
- When writing a cover letter, first call get_resume, craft the full letter, then call save_cover_letter.
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

// ── Cover letter generation ───────────────────────────────────────────────────

export async function generateCoverLetter(hash: string, vacancyText = ""): Promise<CoverLetterResult> {
  const [row] = await db.select().from(resumes).where(eq(resumes.hash, hash)).limit(1);
  if (!row) throw new Error("Resume not found");
  const portfolio = row.resumeData as Portfolio;
  const metrics = scoreRoleFit(portfolio, vacancyText);

  // Fallback template when no AI key is configured
  if (!process.env.AI_API_KEY || process.env.AI_API_KEY === "no-key") {
    const p = portfolio.profile;
    const latest = portfolio.experience[0];
    const letter = `Dear Hiring Manager,

Thank you for considering my application. My name is ${p.name} and I work as ${p.title}.

${p.summary}

My Experience

${latest
  ? `Most recently, I served as ${latest.role} at ${latest.company}, where I ${latest.highlights[0]?.toLowerCase() ?? "delivered meaningful results"}.`
  : "I have a track record of delivering results across various roles and environments."
}

Advantages
${portfolio.tech.slice(0, 4).map((t) => `- Proficient in ${t.name}`).join("\n")}
- Collaborative team player with a growth mindset
- Strong problem-solving and communication skills

Areas for Growth
- I am always seeking to expand my technical horizons and take on new challenges
- Open to learning new domains and adapting to evolving team needs

Role Fit Snapshot
${metrics.map((m) => `- ${m.label}: ${m.score}% — ${m.summary}`).join("\n")}

I am genuinely interested in opportunities where I can contribute meaningfully while continuing to grow professionally.

Best regards,
${p.name}`;

    const updated = attachCoverLetter(portfolio, letter, vacancyText, metrics, true);
    await db.update(resumes).set({ coverLetter: letter, resumeData: updated }).where(eq(resumes.hash, hash));
    return { coverLetter: letter, metrics };
  }

  // AI-generated cover letter
  await chat(hash, [
    {
      role: "user",
      content: `Generate a professional cover letter for me. Steps:
1. Call get_resume to read my data.
2. Write a full cover letter that:
   - Opens with a warm greeting to the hiring manager
   - Highlights my top experience and achievements with specific details
   - Lists 3-4 genuine advantages/strengths based on my resume
   - Honestly acknowledges 1-2 areas of growth (show self-awareness)
   - Uses this vacancy text as the role context when present:
${vacancyText || "(No vacancy text provided.)"}
   - Reflects these role-fit metrics without mentioning them as raw scoring mechanics:
${metrics.map((m) => `${m.label}: ${m.score}% — ${m.summary}`).join("\n")}
   - Closes with genuine enthusiasm and openness to learn
3. Call save_cover_letter with the completed letter.
Keep it under 400 words. Plain text only, no markdown.`,
    },
  ]);

  const [updated] = await db
    .select({ coverLetter: resumes.coverLetter })
    .from(resumes)
    .where(eq(resumes.hash, hash))
    .limit(1);
  const coverLetter = updated?.coverLetter ?? "";
  const updatedPortfolio = attachCoverLetter(portfolio, coverLetter, vacancyText, metrics, true);
  await db.update(resumes).set({ resumeData: updatedPortfolio }).where(eq(resumes.hash, hash));
  return { coverLetter, metrics };
}
