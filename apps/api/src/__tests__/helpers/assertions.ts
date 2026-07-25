import { type ClientResponse } from "hono/client";
import { expect } from "vitest";
import type { ErrorResponse } from "../../lib/error";

export async function expectSuccess<T = unknown>(res: ClientResponse<T>, status = 200): Promise<T> {
  expect(res.status).toBe(status);
  const json = await res.json();
  expect(json).toHaveProperty("data");
  return json as T;
}

export type ApiWalletRecord = {
  sourceType: "WALLET";
  wallet: { balance: string; id: string };
};

export type ApiBudgetRecord = {
  sourceType: "BUDGET";
  budget: { balance: string };
};

export function assertWalletRecord(record: {
  sourceType: string;
}): asserts record is ApiWalletRecord {
  expect(record.sourceType).toBe("WALLET");
}

export function assertBudgetRecord(record: {
  sourceType: string;
}): asserts record is ApiBudgetRecord {
  expect(record.sourceType).toBe("BUDGET");
}

export async function expectError(
  res: Response,
  code: string,
  status?: number
): Promise<ErrorResponse["error"]> {
  if (status) expect(res.status).toBe(status);
  expect(res.ok).toBe(false);
  const json = await res.json();
  expect(json.error.code).toBe(code);
  return json.error;
}
