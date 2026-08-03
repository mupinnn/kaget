import {
  LEDGER_DOCUMENT_VERSION,
  type LedgerDocument,
  type LedgerDocumentPayload,
  ledgerDocumentPayloadSchema,
  ledgerDocumentSchema,
} from "./ledger-document.schemas";

export class UnsupportedLedgerDocumentVersionError extends Error {
  readonly version: unknown;

  constructor(version: unknown) {
    super(
      typeof version === "undefined"
        ? "Ledger document is missing a version field"
        : `Unsupported ledger document version: ${String(version)}`
    );
    this.name = "UnsupportedLedgerDocumentVersionError";
    this.version = version;
  }
}

export class InvalidLedgerDocumentError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "InvalidLedgerDocumentError";
  }
}

export class LedgerDocumentHashMismatchError extends Error {
  constructor() {
    super("Ledger document content_hash does not match payload");
    this.name = "LedgerDocumentHashMismatchError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deterministic JSON for hashing (sorted object keys; arrays keep order). */
export function canonicalizeJson(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (!isRecord(value)) {
    return value;
  }
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortKeysDeep(value[key]);
  }
  return sorted;
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export function extractLedgerDocumentPayload(
  document: LedgerDocument | LedgerDocumentPayload
): LedgerDocumentPayload {
  return {
    settings: document.settings,
    wallets: document.wallets,
    budgets: document.budgets,
    records: document.records,
    transfers: document.transfers,
    debt_loans: document.debt_loans,
  };
}

/** Hash covers ledger payload only — not `version`, `revised_at`, or `content_hash`. */
export async function computeLedgerDocumentContentHash(
  payload: LedgerDocumentPayload
): Promise<string> {
  const parsed = ledgerDocumentPayloadSchema.parse(payload);
  return sha256Hex(canonicalizeJson(parsed));
}

export async function buildLedgerDocument(
  payload: LedgerDocumentPayload,
  options: { revisedAt?: string } = {}
): Promise<LedgerDocument> {
  const parsedPayload = ledgerDocumentPayloadSchema.parse(payload);
  const revised_at = options.revisedAt ?? new Date().toISOString();
  const content_hash = await computeLedgerDocumentContentHash(parsedPayload);

  return ledgerDocumentSchema.parse({
    version: LEDGER_DOCUMENT_VERSION,
    revised_at,
    content_hash,
    ...parsedPayload,
  });
}

export type ParseLedgerDocumentOptions = {
  /** When true (default), reject documents whose `content_hash` does not match the payload. */
  verifyHash?: boolean;
};

/**
 * Parse unknown JSON into the canonical ledger document.
 * Older/unknown versions throw {@link UnsupportedLedgerDocumentVersionError} (no silent migrate).
 */
export async function parseLedgerDocument(
  input: unknown,
  options: ParseLedgerDocumentOptions = {}
): Promise<LedgerDocument> {
  const verifyHash = options.verifyHash ?? true;

  if (!isRecord(input)) {
    throw new InvalidLedgerDocumentError("Ledger document must be a JSON object");
  }

  if (!("version" in input) || input.version !== LEDGER_DOCUMENT_VERSION) {
    throw new UnsupportedLedgerDocumentVersionError(input.version);
  }

  const parsed = ledgerDocumentSchema.safeParse(input);
  if (!parsed.success) {
    throw new InvalidLedgerDocumentError("Ledger document failed schema validation", {
      cause: parsed.error,
    });
  }

  if (verifyHash) {
    const expected = await computeLedgerDocumentContentHash(
      extractLedgerDocumentPayload(parsed.data)
    );
    if (expected !== parsed.data.content_hash) {
      throw new LedgerDocumentHashMismatchError();
    }
  }

  return parsed.data;
}

export async function parseLedgerDocumentJson(
  json: string,
  options?: ParseLedgerDocumentOptions
): Promise<LedgerDocument> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw new InvalidLedgerDocumentError("Ledger document is not valid JSON", { cause });
  }
  return parseLedgerDocument(parsed, options);
}

export async function serializeLedgerDocument(
  document: LedgerDocument,
  options: { pretty?: boolean } = {}
): Promise<string> {
  const validated = ledgerDocumentSchema.parse(document);
  return options.pretty ? `${JSON.stringify(validated, null, 2)}\n` : JSON.stringify(validated);
}
