import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { and, asc, eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "./db.js";
import { chatMessages, resumes, techSuggestions } from "./schema.js";
import { chat, generateCoverLetter } from "./ai.js";
import { attachCoverLetter, scoreRoleFit } from "./ai.js";
import { createPortfolioMcpServer } from "./mcp.js";
import type { Portfolio } from "../src/types/portfolio.js";

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(cors());

// General API limit — 120 req/min per IP
app.use("/api", rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

// Strict limit on expensive AI endpoints — 10 req/min per IP
const aiLimit = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use("/api/chat", aiLimit);
app.use("/api/resumes", (req, _res, next) => {
  if (req.path.endsWith("/cover/generate") && req.method === "POST") return aiLimit(req, _res, next);
  next();
});

app.all("/mcp", async (req, res) => {
  const mcpServer = createPortfolioMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    void transport.close();
    void mcpServer.close();
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: String(err) });
    }
  }
});

function generateHash(): string {
  return crypto.randomBytes(5).toString("hex"); // always 10 hex chars
}

// List all resumes (includes disabled — for edit page)
app.get("/api/resumes", async (_req, res) => {
  try {
    const rows = await db.select().from(resumes).orderBy(resumes.createdAt);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Get the default public resume for the root page. Returns 204 when none is set.
app.get("/api/resumes/default", async (_req, res) => {
  try {
    const [row] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.isDefault, true), eq(resumes.enabled, true)))
      .limit(1);
    if (!row) {
      res.status(204).send();
      return;
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Get single resume by hash — only enabled ones (public route used by /:hash page)
app.get("/api/resumes/:hash", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .limit(1);
    if (!row || !row.enabled) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Create new resume — generates hash automatically
app.post("/api/resumes", async (req, res) => {
  try {
    const hash = generateHash();
    const [row] = await db
      .insert(resumes)
      .values({ hash, resumeData: req.body })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Update resume data (hash stays the same)
app.put("/api/resumes/:hash", async (req, res) => {
  try {
    const [row] = await db
      .update(resumes)
      .set({ resumeData: req.body })
      .where(eq(resumes.hash, req.params.hash))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Update note
app.patch("/api/resumes/:hash/note", async (req, res) => {
  try {
    const { note } = req.body as { note: string };
    const [row] = await db
      .update(resumes)
      .set({ note: note ?? "" })
      .where(eq(resumes.hash, req.params.hash))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Toggle enabled / disabled
app.patch("/api/resumes/:hash/toggle", async (req, res) => {
  try {
    const [current] = await db
      .select({ enabled: resumes.enabled })
      .from(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .limit(1);
    if (!current) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const nextEnabled = !current.enabled;
    const [row] = await db
      .update(resumes)
      .set(nextEnabled ? { enabled: true } : { enabled: false, isDefault: false })
      .where(eq(resumes.hash, req.params.hash))
      .returning();
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Set one enabled resume as default for the root page.
app.patch("/api/resumes/:hash/default", async (req, res) => {
  try {
    const [current] = await db
      .select({ id: resumes.id, enabled: resumes.enabled })
      .from(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .limit(1);
    if (!current) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!current.enabled) {
      res.status(400).json({ error: "Only enabled resumes can be set as default" });
      return;
    }
    await db.update(resumes).set({ isDefault: false });
    const [row] = await db
      .update(resumes)
      .set({ isDefault: true })
      .where(eq(resumes.hash, req.params.hash))
      .returning();
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.delete("/api/resumes/default", async (_req, res) => {
  try {
    await db.update(resumes).set({ isDefault: false });
    res.json({ cleared: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Delete resume
app.delete("/api/resumes/:hash", async (req, res) => {
  try {
    const [row] = await db
      .delete(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Tech suggestions — read-only, used for autocomplete in the edit page
app.get("/api/tech-suggestions", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(techSuggestions)
      .orderBy(techSuggestions.category, techSuggestions.name);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// ── Chat ─────────────────────────────────────────────────────────────────────

app.get("/api/chat/:hash/history", async (req, res) => {
  try {
    const [row] = await db
      .select({ id: resumes.id })
      .from(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const history = await db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
        toolsUsed: chatMessages.toolsUsed,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.resumeId, row.id))
      .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.delete("/api/chat/:hash/history", async (req, res) => {
  try {
    const [row] = await db
      .select({ id: resumes.id })
      .from(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await db.delete(chatMessages).where(eq(chatMessages.resumeId, row.id));
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/chat/:hash", async (req, res) => {
  try {
    const { messages } = req.body as { messages: { role: "user" | "assistant"; content: string }[] };
    const [row] = await db
      .select({ id: resumes.id })
      .from(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const latestUser = [...(messages ?? [])].reverse().find((m) => m.role === "user");
    if (latestUser) {
      await db.insert(chatMessages).values({
        resumeId: row.id,
        role: "user",
        content: latestUser.content,
      });
    }
    const result = await chat(req.params.hash, messages ?? []);
    await db.insert(chatMessages).values({
      resumeId: row.id,
      role: "assistant",
      content: result.content,
      toolsUsed: result.toolsUsed,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// ── Cover letter ──────────────────────────────────────────────────────────────

// Get cover letter for a resume (included in GET /api/resumes/:hash already, but also standalone)
app.get("/api/resumes/:hash/cover", async (req, res) => {
  try {
    const [row] = await db
      .select({ coverLetter: resumes.coverLetter, resumeData: resumes.resumeData })
      .from(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    const portfolio = row.resumeData as Portfolio;
	    res.json({
	      coverLetter: row.coverLetter,
	      enabled: portfolio.coverLetters?.current?.enabled ?? true,
	      summary: portfolio.coverLetters?.current?.summary ?? "",
      recipientName: portfolio.coverLetters?.current?.recipientName ?? "",
      metrics: portfolio.coverLetters?.current?.metrics ?? [],
      vacancyText: portfolio.coverLetters?.current?.vacancyText ?? "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Save / update cover letter manually
app.put("/api/resumes/:hash/cover", async (req, res) => {
  try {
    const { coverLetter, vacancyText, recipientName } = req.body as { coverLetter: string; vacancyText?: string; recipientName?: string };
    const [current] = await db
      .select({ resumeData: resumes.resumeData })
      .from(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .limit(1);
    if (!current) { res.status(404).json({ error: "Not found" }); return; }
    const portfolio = current.resumeData as Portfolio;
    const nextVacancyText = vacancyText ?? portfolio.coverLetters?.current?.vacancyText ?? "";
    const metrics = portfolio.coverLetters?.current?.metrics ?? scoreRoleFit(portfolio, nextVacancyText);
    const nextRecipientName = recipientName ?? portfolio.coverLetters?.current?.recipientName ?? "";
    const updatedPortfolio = attachCoverLetter(portfolio, coverLetter ?? "", nextVacancyText, metrics, false, undefined, nextRecipientName);
    const [row] = await db
      .update(resumes)
      .set({ coverLetter: coverLetter ?? "", resumeData: updatedPortfolio })
      .where(eq(resumes.hash, req.params.hash))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
	    res.json({
	      coverLetter: row.coverLetter,
	      enabled: updatedPortfolio.coverLetters?.current?.enabled ?? true,
	      summary: updatedPortfolio.coverLetters?.current?.summary ?? "",
      recipientName: nextRecipientName,
      metrics,
      vacancyText: nextVacancyText,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Generate cover letter via AI (or fallback template)
app.post("/api/resumes/:hash/cover/generate", async (req, res) => {
  try {
    const { vacancyText, recipientName } = req.body as { vacancyText?: string; recipientName?: string };
    const result = await generateCoverLetter(req.params.hash, vacancyText ?? "", recipientName ?? "");
    res.json({ ...result, vacancyText: vacancyText ?? "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

export default app;
