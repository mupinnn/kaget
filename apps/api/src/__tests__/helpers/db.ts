import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../../db/schema";

export async function setupTestDatabase() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../../../migrations"),
  });

  return {
    db,
    teardown: async () => {
      await db.execute(sql`DROP SCHEMA if exists public CASCADE`);
      await db.execute(sql`CREATE SCHEMA public`);
      await db.execute(sql`DROP schema if exists drizzle CASCADE`);
    },
    close: async () => {
      await client.close();
    },
  };
}
