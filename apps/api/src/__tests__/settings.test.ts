import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ERROR_CODES } from "../lib/error-codes";
import { createTestApp } from "./helpers/app";
import { expectError, expectSuccess } from "./helpers/assertions";
import { createTestAuth, getTestAuthHeaders } from "./helpers/auth";
import { setupTestDatabase } from "./helpers/db";

describe("Settings API", () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>;
  let authHeaders: Record<string, string>;
  let client: ReturnType<typeof testClient<ReturnType<typeof createTestApp>>>;

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    const { auth, test } = await createTestAuth(testDatabase.db);

    const user = test.createUser({
      email: "settings-test@example.com",
      name: "Settings Test User",
    });
    await test.saveUser(user);
    authHeaders = await getTestAuthHeaders(test, user.id);

    client = testClient(createTestApp(testDatabase.db, auth));
  });

  afterAll(async () => {
    await testDatabase.close();
  });

  describe("POST /settings", () => {
    it("should create settings with a valid currencyCode", async () => {
      const res = await client.api.settings.$post(
        {
          json: {
            currencyCode: "USD",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 201);
      expect(data).toMatchObject({
        currencyCode: "USD",
      });
      expect(data?.id).toBeTruthy();
      expect(data?.createdAt).toBeTruthy();
      expect(data?.updatedAt).toBeTruthy();
    });

    it("should return 409 when settings already exist", async () => {
      const res = await client.api.settings.$post(
        {
          json: {
            currencyCode: "EUR",
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.SETTINGS.CONFLICT, 409);
    });

    it("should return 400 for an invalid currencyCode", async () => {
      const { auth, test } = await createTestAuth(testDatabase.db);
      const user = test.createUser({
        email: "invalid-currency@example.com",
        name: "Invalid Currency User",
      });
      await test.saveUser(user);
      const otherAuthHeaders = await getTestAuthHeaders(test, user.id);
      const otherClient = testClient(createTestApp(testDatabase.db, auth));

      const res = await otherClient.api.settings.$post(
        {
          json: {
            currencyCode: "ZZZ",
          },
        },
        { headers: otherAuthHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });

    it("should reject unauthorized requests", async () => {
      const res = await client.api.settings.$post({
        json: {
          currencyCode: "USD",
        },
      });

      await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401);
    });
  });

  describe("GET /settings", () => {
    it("should return settings for the authenticated user", async () => {
      const res = await client.api.settings.$get({}, { headers: authHeaders });

      const { data } = await expectSuccess(res, 200);
      expect(data).toMatchObject({
        currencyCode: "USD",
      });
    });

    it("should return 404 when settings do not exist", async () => {
      const { auth, test } = await createTestAuth(testDatabase.db);
      const user = test.createUser({
        email: "no-settings@example.com",
        name: "No Settings User",
      });
      await test.saveUser(user);
      const otherAuthHeaders = await getTestAuthHeaders(test, user.id);
      const otherClient = testClient(createTestApp(testDatabase.db, auth));

      const res = await otherClient.api.settings.$get({}, { headers: otherAuthHeaders });

      await expectError(res, ERROR_CODES.SETTINGS.NOT_FOUND, 404);
    });
  });

  describe("PATCH /settings", () => {
    it("should update currencyCode", async () => {
      const beforeRes = await client.api.settings.$get({}, { headers: authHeaders });
      const { data: before } = await expectSuccess(beforeRes, 200);

      const res = await client.api.settings.$patch(
        {
          json: {
            currencyCode: "IDR",
          },
        },
        { headers: authHeaders }
      );

      const { data } = await expectSuccess(res, 200);
      expect(data).toMatchObject({
        id: before?.id,
        currencyCode: "IDR",
      });
      expect(new Date(data?.updatedAt ?? 0).getTime()).toBeGreaterThanOrEqual(
        new Date(before?.updatedAt ?? 0).getTime()
      );
    });

    it("should return 404 when settings do not exist", async () => {
      const { auth, test } = await createTestAuth(testDatabase.db);
      const user = test.createUser({
        email: "patch-no-settings@example.com",
        name: "Patch No Settings User",
      });
      await test.saveUser(user);
      const otherAuthHeaders = await getTestAuthHeaders(test, user.id);
      const otherClient = testClient(createTestApp(testDatabase.db, auth));

      const res = await otherClient.api.settings.$patch(
        {
          json: {
            currencyCode: "EUR",
          },
        },
        { headers: otherAuthHeaders }
      );

      await expectError(res, ERROR_CODES.SETTINGS.NOT_FOUND, 404);
    });

    it("should return 400 for an invalid currencyCode", async () => {
      const res = await client.api.settings.$patch(
        {
          json: {
            currencyCode: "ZZZ",
          },
        },
        { headers: authHeaders }
      );

      await expectError(res, ERROR_CODES.VALIDATION.INVALID_INPUT, 400);
    });
  });
});
