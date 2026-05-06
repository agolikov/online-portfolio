import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);
await migrate(db, { migrationsFolder: "./server/migrations" });
await pool.end();
console.log("Migrations applied.");
