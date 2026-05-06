import "dotenv/config";
import express from "express";
import cors from "cors";
import { asc, eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "./db.js";
import { chatMessages, resumes, techSuggestions } from "./schema.js";
import { chat, generateCoverLetter } from "./ai.js";
import { attachCoverLetter, scoreRoleFit } from "./ai.js";
import type { Portfolio } from "../src/types/portfolio.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3004);

app.use(express.json({ limit: "2mb" }));
app.use(cors());

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
    const [row] = await db
      .update(resumes)
      .set({ enabled: !current.enabled })
      .where(eq(resumes.hash, req.params.hash))
      .returning();
    res.json(row);
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
    const { coverLetter, vacancyText } = req.body as { coverLetter: string; vacancyText?: string };
    const [current] = await db
      .select({ resumeData: resumes.resumeData })
      .from(resumes)
      .where(eq(resumes.hash, req.params.hash))
      .limit(1);
    if (!current) { res.status(404).json({ error: "Not found" }); return; }
    const portfolio = current.resumeData as Portfolio;
    const nextVacancyText = vacancyText ?? portfolio.coverLetters?.current?.vacancyText ?? "";
    const metrics = portfolio.coverLetters?.current?.metrics ?? scoreRoleFit(portfolio, nextVacancyText);
    const updatedPortfolio = attachCoverLetter(portfolio, coverLetter ?? "", nextVacancyText, metrics, false);
    const [row] = await db
      .update(resumes)
      .set({ coverLetter: coverLetter ?? "", resumeData: updatedPortfolio })
      .where(eq(resumes.hash, req.params.hash))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ coverLetter: row.coverLetter, metrics, vacancyText: nextVacancyText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Generate cover letter via AI (or fallback template)
app.post("/api/resumes/:hash/cover/generate", async (req, res) => {
  try {
    const { vacancyText } = req.body as { vacancyText?: string };
    const result = await generateCoverLetter(req.params.hash, vacancyText ?? "");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    appType: "spa",
    server: {
      middlewareMode: true,
      hmr: true,
    },
  });
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`App server listening on http://localhost:${PORT}`);
});
