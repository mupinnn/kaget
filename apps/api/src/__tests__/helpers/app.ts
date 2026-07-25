import { createApp } from "../../app";
import type { Database } from "../../db/client";
import type { Auth } from "../../lib/auth";
import type { TestAuth } from "./auth";
import { MOCK_ENV } from "./mock";

export function createTestApp(db: Database, auth: TestAuth["auth"]) {
  return createApp(MOCK_ENV, db, auth as unknown as Auth);
}
