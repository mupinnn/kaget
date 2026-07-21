const DEFAULT_PASSWORD = "e2e-test-password-123";

export type TestUser = {
  name: string;
  email: string;
  password: string;
};

export function createTestUser(prefix = "e2e"): TestUser {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `${prefix} User`,
    email: `${prefix}-${uniqueId}@example.com`,
    password: DEFAULT_PASSWORD,
  };
}
