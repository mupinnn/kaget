import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createMemoryDriveClient } from "../lib/drive/memory-drive";
import { AppError } from "../lib/error";
import { ERROR_CODES } from "../lib/error-codes";
import { createTestApp } from "./helpers/app";
import { expectError, expectSuccess } from "./helpers/assertions";
import { createTestAuth, getTestAuthHeaders } from "./helpers/auth";
import { setupTestDatabase } from "./helpers/db";

describe("Drive ledger broker", () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>;
  let authHeaders: Record<string, string>;
  let drive: ReturnType<typeof createMemoryDriveClient>;
  let client: ReturnType<typeof testClient<ReturnType<typeof createTestApp>>>;

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    const testAuth = await createTestAuth(testDatabase.db);

    const user = testAuth.test.createUser({
      email: "drive-user@example.com",
      name: "Drive User",
    });
    await testAuth.test.saveUser(user);
    authHeaders = await getTestAuthHeaders(testAuth.test, user.id);

    drive = createMemoryDriveClient();
    client = testClient(
      createTestApp(testDatabase.db, testAuth.auth, {
        drive,
        getGoogleAccessToken: async () => "test-google-access-token",
      })
    );
  });

  afterAll(async () => {
    await testDatabase.close();
  });

  it("rejects unauthenticated ensure", async () => {
    const res = await client.api.drive.ledger.ensure.$post();
    await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401);
  });

  it("ensures a default path file and persists fileId", async () => {
    const res = await client.api.drive.ledger.ensure.$post({}, { headers: authHeaders });
    const { data } = await expectSuccess<{
      data: { fileId: string; name: string; modifiedTime: string | null };
    }>(res, 201);

    expect(data.fileId).toBeTruthy();
    expect(data.name).toBe("kaget-ledger.json");
    expect(drive.peek(data.fileId)).toEqual({});
  });

  it("returns the same pointer on subsequent ensure", async () => {
    const first = await client.api.drive.ledger.ensure.$post({}, { headers: authHeaders });
    const { data: a } = await expectSuccess<{ data: { fileId: string } }>(first);

    const second = await client.api.drive.ledger.ensure.$post({}, { headers: authHeaders });
    const { data: b } = await expectSuccess<{ data: { fileId: string } }>(second);

    expect(b.fileId).toBe(a.fileId);
  });

  it("uploads and downloads opaque JSON content", async () => {
    const ensure = await client.api.drive.ledger.ensure.$post({}, { headers: authHeaders });
    const { data: bound } = await expectSuccess<{ data: { fileId: string } }>(ensure);

    const ledger = {
      version: 2,
      wallets: [{ id: "w1", name: "Cash" }],
      note: "opaque-to-server",
    };

    const put = await client.api.drive.ledger.$put(
      { json: { content: ledger } },
      { headers: authHeaders }
    );
    const { data: uploaded } = await expectSuccess<{ data: { fileId: string } }>(put);
    expect(uploaded.fileId).toBe(bound.fileId);
    expect(drive.peek(bound.fileId)).toEqual(ledger);

    const get = await client.api.drive.ledger.$get({}, { headers: authHeaders });
    const { data: downloaded } = await expectSuccess<{
      data: { fileId: string; content: unknown };
    }>(get);

    expect(downloaded.fileId).toBe(bound.fileId);
    expect(downloaded.content).toEqual(ledger);
  });

  it("rebounds when the Drive file is gone", async () => {
    const ensure = await client.api.drive.ledger.ensure.$post({}, { headers: authHeaders });
    const { data: before } = await expectSuccess<{ data: { fileId: string } }>(ensure);

    drive.trash(before.fileId);

    const rebound = await client.api.drive.ledger.ensure.$post({}, { headers: authHeaders });
    const { data: after } = await expectSuccess<{ data: { fileId: string } }>(rebound);

    expect(after.fileId).not.toBe(before.fileId);
    expect(drive.peek(after.fileId)).toEqual({});
  });

  it("clears the pointer on DELETE without removing Drive content", async () => {
    const ensure = await client.api.drive.ledger.ensure.$post({}, { headers: authHeaders });
    const { data: bound } = await expectSuccess<{ data: { fileId: string } }>(ensure);

    await client.api.drive.ledger.$put(
      { json: { content: { keep: true } } },
      { headers: authHeaders }
    );

    const del = await client.api.drive.ledger.$delete({}, { headers: authHeaders });
    const { data } = await expectSuccess<{ data: { cleared: boolean; fileId?: string } }>(del);
    expect(data).toMatchObject({ cleared: true, fileId: bound.fileId });
    expect(drive.peek(bound.fileId)).toEqual({ keep: true });

    const get = await client.api.drive.ledger.$get({}, { headers: authHeaders });
    await expectError(get, ERROR_CODES.DRIVE.FILE_NOT_BOUND, 404);
  });

  it("returns FILE_NOT_BOUND for GET/PUT before ensure", async () => {
    const freshDb = await setupTestDatabase();
    const freshAuth = await createTestAuth(freshDb.db);
    const user = freshAuth.test.createUser({
      email: "unbound@example.com",
      name: "Unbound",
    });
    await freshAuth.test.saveUser(user);
    const headers = await getTestAuthHeaders(freshAuth.test, user.id);
    const freshDrive = createMemoryDriveClient();
    const unboundClient = testClient(
      createTestApp(freshDb.db, freshAuth.auth, { drive: freshDrive })
    );

    const get = await unboundClient.api.drive.ledger.$get({}, { headers });
    await expectError(get, ERROR_CODES.DRIVE.FILE_NOT_BOUND, 404);

    const put = await unboundClient.api.drive.ledger.$put(
      { json: { content: { a: 1 } } },
      { headers }
    );
    await expectError(put, ERROR_CODES.DRIVE.FILE_NOT_BOUND, 404);

    await freshDb.close();
  });

  it("maps missing Google grant to DRIVE_GOOGLE_AUTH_REQUIRED", async () => {
    const testAuth = await createTestAuth(testDatabase.db);
    const user = testAuth.test.createUser({
      email: "reauth@example.com",
      name: "Reauth",
    });
    await testAuth.test.saveUser(user);
    const headers = await getTestAuthHeaders(testAuth.test, user.id);

    const gated = testClient(
      createTestApp(testDatabase.db, testAuth.auth, {
        drive,
        getGoogleAccessToken: async () => {
          throw new AppError(
            401,
            ERROR_CODES.DRIVE.GOOGLE_AUTH_REQUIRED,
            "Google Drive authorization required"
          );
        },
      })
    );

    const res = await gated.api.drive.ledger.ensure.$post({}, { headers });
    await expectError(res, ERROR_CODES.DRIVE.GOOGLE_AUTH_REQUIRED, 401);
  });
});
