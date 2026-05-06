import { pgTable, serial, varchar, text, jsonb, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  hash: varchar("hash", { length: 10 }).unique().notNull(),
  resumeData: jsonb("resume_data").notNull(),
  note: text("note").notNull().default(""),
  coverLetter: text("cover_letter").notNull().default(""),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Resume = typeof resumes.$inferSelect;

export const techSuggestions = pgTable("tech_suggestions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  category: varchar("category", { length: 100 }).notNull(),
});

export type TechSuggestion = typeof techSuggestions.$inferSelect;

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  toolsUsed: jsonb("tools_used").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ChatMessageRow = typeof chatMessages.$inferSelect;
