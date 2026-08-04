import { beforeEach, describe, expect, test, vi } from "vitest";
import { createApiDriveLedgerRemote, ensureDriveLedger } from "./drive-ledger.remote";
import { DriveSyncNotConnectedError } from "./drive-sync.errors";

const { ensurePost, get, put, del } = vi.hoisted(() => ({
  ensurePost: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@/libs/api.lib", () => ({
  api: {
    api: {
      drive: {
        ledger: {
          ensure: { $post: ensurePost },
          $get: get,
          $put: put,
          $delete: del,
        },
      },
    },
  },
}));

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("drive-ledger.remote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("ensureDriveLedger maps GOOGLE_AUTH_REQUIRED to DriveSyncNotConnectedError", async () => {
    ensurePost.mockResolvedValue(
      jsonResponse(401, {
        error: {
          code: "DRIVE_GOOGLE_AUTH_REQUIRED",
          message: "Google Drive authorization required",
        },
      })
    );

    await expect(ensureDriveLedger()).rejects.toBeInstanceOf(DriveSyncNotConnectedError);
  });

  test("download returns empty stub when FILE_NOT_BOUND", async () => {
    get.mockResolvedValue(
      jsonResponse(404, {
        error: { code: "DRIVE_FILE_NOT_BOUND", message: "No Drive ledger file bound" },
      })
    );

    const remote = createApiDriveLedgerRemote();
    await expect(remote.download()).resolves.toEqual({});
  });

  test("download returns empty stub when FILE_NOT_FOUND", async () => {
    get.mockResolvedValue(
      jsonResponse(404, {
        error: { code: "DRIVE_FILE_NOT_FOUND", message: "Drive ledger file not found" },
      })
    );

    const remote = createApiDriveLedgerRemote();
    await expect(remote.download()).resolves.toEqual({});
  });

  test("upload maps GOOGLE_AUTH_REQUIRED to DriveSyncNotConnectedError", async () => {
    put.mockResolvedValue(
      jsonResponse(401, {
        error: {
          code: "DRIVE_GOOGLE_AUTH_REQUIRED",
          message: "Google Drive authorization required",
        },
      })
    );

    const remote = createApiDriveLedgerRemote();
    await expect(remote.upload({ version: 2 } as never)).rejects.toBeInstanceOf(
      DriveSyncNotConnectedError
    );
  });
});
