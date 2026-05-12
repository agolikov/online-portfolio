import "dotenv/config";
import crypto from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { attachCoverLetter, scoreRoleFit } from "./ai.js";
import { db } from "./db.js";
import { chatMessages, resumes, techSuggestions } from "./schema.js";
import type {
  Certificate,
  Education,
  Experience,
  Portfolio,
  Profile,
  Project,
  Story,
  Tech,
} from "../src/types/portfolio.js";

function generateHash(): string {
  return crypto.randomBytes(5).toString("hex");
}

function asText(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

async function getResumeByHash(hash: string, includeDisabled = true) {
  const conditions = includeDisabled
    ? eq(resumes.hash, hash)
    : and(eq(resumes.hash, hash), eq(resumes.enabled, true));
  const [row] = await db.select().from(resumes).where(conditions).limit(1);
  if (!row) throw new Error("Resume not found");
  return row;
}

async function savePortfolio(hash: string, portfolio: Portfolio) {
  const [row] = await db
    .update(resumes)
    .set({ resumeData: portfolio })
    .where(eq(resumes.hash, hash))
    .returning();
  if (!row) throw new Error("Resume not found");
  return row;
}

function summarizeCandidate(portfolio: Portfolio): string {
  const latest = portfolio.experience[0];
  const topTech = portfolio.tech.slice(0, 5).map((tech) => tech.name).join(", ");
  const latestText = latest ? ` Most recently: ${latest.role} at ${latest.company}.` : "";
  return `${portfolio.profile.name} is a ${portfolio.profile.title}. ${portfolio.profile.summary}${latestText}${topTech ? ` Core stack: ${topTech}.` : ""}`.trim();
}

const profileSchema = z.object({
  name: z.string(),
  title: z.string(),
  location: z.string(),
  email: z.string(),
  website: z.string(),
  github: z.string(),
  linkedin: z.string(),
  summary: z.string(),
});

const techSchema = z.object({
  name: z.string(),
  category: z.string(),
});

const experienceSchema = z.object({
  id: z.string(),
  enabled: z.boolean().optional(),
  company: z.string(),
  role: z.string(),
  period: z.string(),
  start: z.string(),
  end: z.string(),
  location: z.string(),
  highlights: z.array(z.string()),
  tech: z.array(z.string()),
});

const projectSchema = z.object({
  id: z.string(),
  enabled: z.boolean().optional(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  link: z.string(),
  tech: z.array(z.string()),
});

const certificateSchema = z.object({
  id: z.string(),
  enabled: z.boolean().optional(),
  name: z.string(),
  issuer: z.string(),
  year: z.string(),
  credentialId: z.string().optional(),
  link: z.string().optional(),
  tech: z.array(z.string()).optional(),
});

const educationSchema = z.object({
  id: z.string(),
  enabled: z.boolean().optional(),
  institution: z.string(),
  shortName: z.string().optional(),
  degree: z.string(),
  field: z.string(),
  period: z.string(),
  start: z.string(),
  end: z.string(),
  thesis: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

const storySchema = z.object({
  id: z.string(),
  enabled: z.boolean().optional(),
  question: z.string(),
  answer: z.string(),
  public: z.boolean().optional(),
});

const portfolioSchema = z.object({
  profile: profileSchema,
  tech: z.array(techSchema),
  experience: z.array(experienceSchema),
  projects: z.array(projectSchema),
  certificates: z.array(certificateSchema),
  education: z.array(educationSchema).optional(),
  stories: z.array(storySchema).optional(),
  coverLetters: z.unknown().optional(),
});

const hashInput = {
  hash: z.string().describe("The 10-character resume hash."),
};

export function createPortfolioMcpServer() {
  const server = new McpServer({
    name: "interactive-resume-data",
    version: "1.0.0",
  });

server.registerTool(
  "list_resumes",
  {
    title: "List resumes",
    description: "List resume records and metadata. Resume JSON is omitted unless includeData is true.",
    inputSchema: {
      includeDisabled: z.boolean().optional().default(true),
      includeData: z.boolean().optional().default(false),
    },
  },
  async ({ includeDisabled, includeData }) => {
    const rows = await db.select().from(resumes).orderBy(asc(resumes.createdAt), asc(resumes.id));
    const filtered = includeDisabled ? rows : rows.filter((row) => row.enabled);
    return asText(
      filtered.map((row) => ({
        id: row.id,
        hash: row.hash,
        note: row.note,
        enabled: row.enabled,
        isDefault: row.isDefault,
        createdAt: row.createdAt,
        resumeData: includeData ? row.resumeData : undefined,
      })),
    );
  },
);

server.registerTool(
  "get_resume",
  {
    title: "Get resume",
    description: "Read a resume record, including the full portfolio JSON.",
    inputSchema: {
      ...hashInput,
      includeDisabled: z.boolean().optional().default(true),
    },
  },
  async ({ hash, includeDisabled }) => asText(await getResumeByHash(hash, includeDisabled)),
);

server.registerTool(
  "get_default_resume",
  {
    title: "Get default resume",
    description: "Read the enabled resume currently marked as the public default.",
  },
  async () => {
    const [row] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.isDefault, true), eq(resumes.enabled, true)))
      .limit(1);
    return asText(row ?? null);
  },
);

server.registerTool(
  "create_resume",
  {
    title: "Create resume",
    description: "Create a new resume from complete portfolio JSON. A hash is generated automatically.",
    inputSchema: {
      portfolio: portfolioSchema,
      note: z.string().optional().default(""),
      enabled: z.boolean().optional().default(true),
      isDefault: z.boolean().optional().default(false),
    },
  },
  async ({ portfolio, note, enabled, isDefault }) => {
    if (isDefault) await db.update(resumes).set({ isDefault: false });
    const [row] = await db
      .insert(resumes)
      .values({ hash: generateHash(), resumeData: portfolio, note, enabled, isDefault })
      .returning();
    return asText(row);
  },
);

server.registerTool(
  "replace_resume",
  {
    title: "Replace resume data",
    description: "Replace the full portfolio JSON for an existing resume hash.",
    inputSchema: {
      ...hashInput,
      portfolio: portfolioSchema,
    },
  },
  async ({ hash, portfolio }) => asText(await savePortfolio(hash, portfolio as Portfolio)),
);

server.registerTool(
  "delete_resume",
  {
    title: "Delete resume",
    description: "Delete a resume and its cascaded chat messages.",
    inputSchema: hashInput,
    annotations: { destructiveHint: true },
  },
  async ({ hash }) => {
    const [row] = await db.delete(resumes).where(eq(resumes.hash, hash)).returning();
    if (!row) throw new Error("Resume not found");
    return asText({ deleted: true, hash });
  },
);

server.registerTool(
  "set_resume_enabled",
  {
    title: "Set resume enabled",
    description: "Enable or disable a resume. Disabling a default resume also clears its default flag.",
    inputSchema: {
      ...hashInput,
      enabled: z.boolean(),
    },
  },
  async ({ hash, enabled }) => {
    const [row] = await db
      .update(resumes)
      .set(enabled ? { enabled: true } : { enabled: false, isDefault: false })
      .where(eq(resumes.hash, hash))
      .returning();
    if (!row) throw new Error("Resume not found");
    return asText(row);
  },
);

server.registerTool(
  "set_default_resume",
  {
    title: "Set default resume",
    description: "Set one enabled resume as the public default.",
    inputSchema: hashInput,
  },
  async ({ hash }) => {
    const row = await getResumeByHash(hash);
    if (!row.enabled) throw new Error("Only enabled resumes can be set as default");
    await db.update(resumes).set({ isDefault: false });
    const [updated] = await db.update(resumes).set({ isDefault: true }).where(eq(resumes.hash, hash)).returning();
    return asText(updated);
  },
);

server.registerTool(
  "clear_default_resume",
  {
    title: "Clear default resume",
    description: "Clear the public default resume flag from all resumes.",
  },
  async () => {
    await db.update(resumes).set({ isDefault: false });
    return asText({ cleared: true });
  },
);

server.registerTool(
  "update_resume_note",
  {
    title: "Update resume note",
    description: "Update the internal note attached to a resume.",
    inputSchema: {
      ...hashInput,
      note: z.string(),
    },
  },
  async ({ hash, note }) => {
    const [row] = await db.update(resumes).set({ note }).where(eq(resumes.hash, hash)).returning();
    if (!row) throw new Error("Resume not found");
    return asText(row);
  },
);

server.registerTool(
  "update_profile",
  {
    title: "Update profile",
    description: "Replace the profile section of a resume.",
    inputSchema: {
      ...hashInput,
      profile: profileSchema,
    },
  },
  async ({ hash, profile }) => {
    const row = await getResumeByHash(hash);
    const portfolio = row.resumeData as Portfolio;
    return asText(await savePortfolio(hash, { ...portfolio, profile: profile as Profile }));
  },
);

server.registerTool(
  "update_profile_field",
  {
    title: "Update profile field",
    description: "Update one profile text field.",
    inputSchema: {
      ...hashInput,
      field: z.enum(["name", "title", "location", "email", "website", "github", "linkedin", "summary"]),
      value: z.string(),
    },
  },
  async ({ hash, field, value }) => {
    const row = await getResumeByHash(hash);
    const portfolio = row.resumeData as Portfolio;
    return asText(await savePortfolio(hash, { ...portfolio, profile: { ...portfolio.profile, [field]: value } }));
  },
);

server.registerTool(
  "update_skills",
  {
    title: "Update skills",
    description: "Replace the complete skills/tech section.",
    inputSchema: {
      ...hashInput,
      skills: z.array(techSchema),
    },
  },
  async ({ hash, skills }) => {
    const row = await getResumeByHash(hash);
    const portfolio = row.resumeData as Portfolio;
    return asText(await savePortfolio(hash, { ...portfolio, tech: skills as Tech[] }));
  },
);

server.registerTool(
  "update_experience",
  {
    title: "Update experience",
    description: "Replace the complete experience section.",
    inputSchema: {
      ...hashInput,
      experience: z.array(experienceSchema),
    },
  },
  async ({ hash, experience }) => {
    const row = await getResumeByHash(hash);
    const portfolio = row.resumeData as Portfolio;
    return asText(await savePortfolio(hash, { ...portfolio, experience: experience as Experience[] }));
  },
);

server.registerTool(
  "update_projects",
  {
    title: "Update projects",
    description: "Replace the complete projects section.",
    inputSchema: {
      ...hashInput,
      projects: z.array(projectSchema),
    },
  },
  async ({ hash, projects }) => {
    const row = await getResumeByHash(hash);
    const portfolio = row.resumeData as Portfolio;
    return asText(await savePortfolio(hash, { ...portfolio, projects: projects as Project[] }));
  },
);

server.registerTool(
  "update_certificates",
  {
    title: "Update certificates",
    description: "Replace the complete certificates section.",
    inputSchema: {
      ...hashInput,
      certificates: z.array(certificateSchema),
    },
  },
  async ({ hash, certificates }) => {
    const row = await getResumeByHash(hash);
    const portfolio = row.resumeData as Portfolio;
    return asText(await savePortfolio(hash, { ...portfolio, certificates: certificates as Certificate[] }));
  },
);

server.registerTool(
  "update_education",
  {
    title: "Update education",
    description: "Replace the complete education section.",
    inputSchema: {
      ...hashInput,
      education: z.array(educationSchema),
    },
  },
  async ({ hash, education }) => {
    const row = await getResumeByHash(hash);
    const portfolio = row.resumeData as Portfolio;
    return asText(await savePortfolio(hash, { ...portfolio, education: education as Education[] }));
  },
);

server.registerTool(
  "update_stories",
  {
    title: "Update stories",
    description: "Replace the complete behavioral stories section.",
    inputSchema: {
      ...hashInput,
      stories: z.array(storySchema),
    },
  },
  async ({ hash, stories }) => {
    const row = await getResumeByHash(hash);
    const portfolio = row.resumeData as Portfolio;
    return asText(await savePortfolio(hash, { ...portfolio, stories: stories as Story[] }));
  },
);

server.registerTool(
  "save_cover_letter",
  {
    title: "Save cover letter",
    description: "Save cover-letter content and update portfolio cover-letter metadata.",
    inputSchema: {
      ...hashInput,
      content: z.string(),
      vacancyText: z.string().optional(),
      recipientName: z.string().optional(),
      enabled: z.boolean().optional(),
    },
  },
  async ({ hash, content, vacancyText, recipientName, enabled }) => {
    const row = await getResumeByHash(hash);
    const portfolio = row.resumeData as Portfolio;
    const nextVacancyText = vacancyText ?? portfolio.coverLetters?.current?.vacancyText ?? "";
    const metrics = scoreRoleFit(portfolio, nextVacancyText);
    const summary = summarizeCandidate(portfolio);
    const updatedPortfolio = attachCoverLetter(
      portfolio,
      content,
      nextVacancyText,
      metrics,
      false,
      summary,
      recipientName ?? portfolio.coverLetters?.current?.recipientName ?? "",
      enabled ?? portfolio.coverLetters?.current?.enabled ?? true,
    );
    const [updated] = await db
      .update(resumes)
      .set({ coverLetter: content, resumeData: updatedPortfolio })
      .where(eq(resumes.hash, hash))
      .returning();
    if (!updated) throw new Error("Resume not found");
    return asText(updated);
  },
);

server.registerTool(
  "score_role_fit",
  {
    title: "Score role fit",
    description: "Score the resume against vacancy text without saving a cover letter.",
    inputSchema: {
      ...hashInput,
      vacancyText: z.string().optional().default(""),
    },
  },
  async ({ hash, vacancyText }) => {
    const row = await getResumeByHash(hash);
    return asText(scoreRoleFit(row.resumeData as Portfolio, vacancyText));
  },
);

server.registerTool(
  "list_tech_suggestions",
  {
    title: "List tech suggestions",
    description: "List autocomplete technology suggestions.",
  },
  async () => {
    const rows = await db
      .select()
      .from(techSuggestions)
      .orderBy(asc(techSuggestions.category), asc(techSuggestions.name));
    return asText(rows);
  },
);

server.registerTool(
  "list_chat_history",
  {
    title: "List chat history",
    description: "List persisted chat messages for a resume.",
    inputSchema: hashInput,
  },
  async ({ hash }) => {
    const row = await getResumeByHash(hash);
    const messages = await db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
        toolsUsed: chatMessages.toolsUsed,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.resumeId, row.id))
      .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));
    return asText(messages);
  },
);

server.registerTool(
  "clear_chat_history",
  {
    title: "Clear chat history",
    description: "Delete persisted chat messages for a resume.",
    inputSchema: hashInput,
    annotations: { destructiveHint: true },
  },
  async ({ hash }) => {
    const row = await getResumeByHash(hash);
    await db.delete(chatMessages).where(eq(chatMessages.resumeId, row.id));
    return asText({ deleted: true, hash });
  },
);

  return server;
}
