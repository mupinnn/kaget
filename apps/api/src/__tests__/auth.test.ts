import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GOOGLE_OAUTH_SCOPES } from "../lib/auth";
import { ERROR_CODES } from "../lib/error-codes";
import { createTestApp } from "./helpers/app";
import { expectError } from "./helpers/assertions";
import { createTestAuth, getTestAuthHeaders } from "./helpers/auth";
import { setupTestDatabase } from "./helpers/db";

describe("Auth posture", () => {
  let testDatabase: Awaited<ReturnType<typeof setupTestDatabase>>;
  let authHeaders: Record<string, string>;
  let client: ReturnType<typeof testClient<ReturnType<typeof createTestApp>>>;
  let auth: Awaited<ReturnType<typeof createTestAuth>>["auth"];

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    const testAuth = await createTestAuth(testDatabase.db);
    auth = testAuth.auth;

    const user = testAuth.test.createUser({
      email: "google-user@example.com",
      name: "Google User",
    });
    await testAuth.test.saveUser(user);
    authHeaders = await getTestAuthHeaders(testAuth.test, user.id);

    client = testClient(createTestApp(testDatabase.db, auth));
  });

  afterAll(async () => {
    await testDatabase.close();
  });

  it("requests Drive file scope with Google OAuth", () => {
    expect(GOOGLE_OAUTH_SCOPES).toContain("https://www.googleapis.com/auth/drive.file");
    expect(auth.options.socialProviders?.google).toMatchObject({
      clientId: "test-google-client-id",
      accessType: "offline",
      prompt: "consent",
    });
    expect(auth.options.emailAndPassword?.enabled).toBe(false);
  });

  it("rejects unauthenticated /api/me (local use does not need API session)", async () => {
    const res = await client.api.me.$get();
    await expectError(res, ERROR_CODES.AUTH.UNAUTHORIZED, 401);
  });

  it("returns the session user when authenticated", async () => {
    const res = await client.api.me.$get({}, { headers: authHeaders });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      user: {
        email: "google-user@example.com",
        name: "Google User",
      },
    });
  });

  it("rejects credential sign-in when email/password is disabled", async () => {
    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "anyone@example.com",
          password: "password123",
        }),
      })
    );

    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
