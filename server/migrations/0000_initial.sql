CREATE TABLE "resumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" varchar(10) NOT NULL,
	"resume_data" jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"cover_letter" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resumes_hash_unique" UNIQUE("hash")
);

CREATE TABLE "tech_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	CONSTRAINT "tech_suggestions_name_unique" UNIQUE("name")
);
