import { describe, expect, test } from "vitest";
import {
  buildLedgerDocument,
  canonicalizeJson,
  computeLedgerDocumentContentHash,
  InvalidLedgerDocumentError,
  LedgerDocumentHashMismatchError,
  parseLedgerDocument,
  parseLedgerDocumentJson,
  serializeLedgerDocument,
  UnsupportedLedgerDocumentVersionError,
} from "./ledger-document";
import { LEDGER_DOCUMENT_VERSION, type LedgerDocumentPayload } from "./ledger-document.schemas";

const emptyPayload = (): LedgerDocumentPayload => ({
  settings: { currency_code: "USD" },
  wallets: [],
  budgets: [],
  records: [],
  transfers: [],
  debt_loans: [],
});

const samplePayload = (): LedgerDocumentPayload => ({
  settings: { currency_code: "IDR" },
  wallets: [
    {
      id: "w1",
      name: "Cash",
      type: "CASH",
      balance: 100_000,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    },
  ],
  budgets: [
    {
      id: "b1",
      name: "Groceries",
      wallet_id: "w1",
      balance: 50_000,
      total_balance: 50_000,
      budget_type: "BUDGET",
      archived_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  records: [
    {
      id: "r1",
      note: "Market",
      amount: 10_000,
      source_id: "b1",
      source_type: "BUDGET",
      record_type: "EXPENSE",
      recorded_at: "2026-01-03T12:00:00.000Z",
      created_at: "2026-01-03T12:00:00.000Z",
      updated_at: "2026-01-03T12:00:00.000Z",
      items: [
        {
          id: "ri1",
          note: "Veg",
          amount: 10_000,
          created_at: "2026-01-03T12:00:00.000Z",
          updated_at: "2026-01-03T12:00:00.000Z",
        },
      ],
    },
  ],
  transfers: [],
  debt_loans: [
    {
      id: "d1",
      note: null,
      other_party: "Alex",
      amount: 25_000,
      type: "DEBT",
      source_id: "w1",
      source_type: "WALLET",
      initial_record_id: "r-debt",
      resolved_at: null,
      resolved_record_id: null,
      occurred_at: "2026-01-04T00:00:00.000Z",
      created_at: "2026-01-04T00:00:00.000Z",
      updated_at: "2026-01-04T00:00:00.000Z",
    },
    {
      id: "l1",
      note: "Lunch",
      other_party: "Sam",
      amount: 15_000,
      type: "LOAN",
      source_id: "w1",
      source_type: "WALLET",
      initial_record_id: "r-loan",
      resolved_at: null,
      resolved_record_id: null,
      occurred_at: "2026-01-05T00:00:00.000Z",
      created_at: "2026-01-05T00:00:00.000Z",
      updated_at: "2026-01-05T00:00:00.000Z",
    },
  ],
});

describe("ledger document", () => {
  test("canonicalizeJson sorts object keys deeply", () => {
    expect(canonicalizeJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      JSON.stringify({ a: { c: 3, d: 2 }, b: 1 })
    );
  });

  test("build → serialize → parse round-trip preserves debt_loans", async () => {
    const built = await buildLedgerDocument(samplePayload(), {
      revisedAt: "2026-08-03T00:00:00.000Z",
    });
    expect(built.version).toBe(LEDGER_DOCUMENT_VERSION);
    expect(built.debt_loans).toHaveLength(2);
    expect(built.debt_loans.map(row => row.type).sort()).toEqual(["DEBT", "LOAN"]);

    const json = await serializeLedgerDocument(built);
    const parsed = await parseLedgerDocumentJson(json);
    expect(parsed).toEqual(built);
  });

  test("content_hash ignores revised_at changes for the same payload", async () => {
    const payload = emptyPayload();
    const a = await buildLedgerDocument(payload, { revisedAt: "2026-01-01T00:00:00.000Z" });
    const b = await buildLedgerDocument(payload, { revisedAt: "2026-02-02T00:00:00.000Z" });
    expect(a.content_hash).toBe(b.content_hash);
    expect(a.revised_at).not.toBe(b.revised_at);
  });

  test("rejects legacy version 1.0 with unsupported error", async () => {
    await expect(
      parseLedgerDocument({
        version: "1.0",
        exported_at: "2026-02-05T10:00:00Z",
        settings: { currency: "USD" },
        wallets: [],
        records: [],
        budgets: [],
        transfers: [],
      })
    ).rejects.toBeInstanceOf(UnsupportedLedgerDocumentVersionError);
  });

  test("rejects hash mismatch", async () => {
    const doc = await buildLedgerDocument(emptyPayload());
    await expect(
      parseLedgerDocument({ ...doc, content_hash: "0".repeat(64) })
    ).rejects.toBeInstanceOf(LedgerDocumentHashMismatchError);
  });

  test("rejects invalid JSON", async () => {
    await expect(parseLedgerDocumentJson("{")).rejects.toBeInstanceOf(InvalidLedgerDocumentError);
  });

  test("computeLedgerDocumentContentHash matches build", async () => {
    const payload = samplePayload();
    const hash = await computeLedgerDocumentContentHash(payload);
    const doc = await buildLedgerDocument(payload);
    expect(doc.content_hash).toBe(hash);
  });
});
