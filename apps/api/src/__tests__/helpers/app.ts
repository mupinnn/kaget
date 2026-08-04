import { createApp } from "../../app";
import type { Database } from "../../db/client";
import type { Auth } from "../../lib/auth";
import { createMemoryDriveClient } from "../../lib/drive/memory-drive";
import type { DriveDeps } from "../../lib/drive/types";
import type { TestAuth } from "./auth";
import { MOCK_ENV } from "./mock";

export function createTestApp(
  db: Database,
  auth: TestAuth["auth"],
  driveDeps: Partial<DriveDeps> = {}
) {
  const drive = driveDeps.drive ?? createMemoryDriveClient();
  const getGoogleAccessToken =
    driveDeps.getGoogleAccessToken ?? (async () => "test-google-access-token");

  return createApp(MOCK_ENV, db, auth as unknown as Auth, {
    drive,
    getGoogleAccessToken,
  });
}
