import * as z from "zod";

/** Canonical ledger document family for Export, Import, and Drive file. */
export const LEDGER_DOCUMENT_VERSION = 2 as const;

const isoDateTime = z.iso.datetime({ offset: true });

/** Money as a finite number (display/export friendly). Dexie restore (#40) may refine precision. */
const moneyAmount = z.number().finite();

const ledgerSettingsSchema = z.object({
  currency_code: z.string().length(3),
});

const ledgerWalletSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["CASH", "DIGITAL"]),
  balance: moneyAmount,
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

const ledgerBudgetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  wallet_id: z.string().min(1),
  balance: moneyAmount,
  total_balance: moneyAmount,
  budget_type: z.enum(["BUDGET", "GOAL"]),
  archived_at: isoDateTime.nullable(),
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

const ledgerRecordItemSchema = z.object({
  id: z.string().min(1),
  note: z.string().nullable(),
  amount: moneyAmount,
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

const ledgerRecordSchema = z.object({
  id: z.string().min(1),
  note: z.string().nullable(),
  amount: moneyAmount,
  source_id: z.string().min(1),
  source_type: z.enum(["WALLET", "BUDGET"]),
  record_type: z.enum(["INCOME", "EXPENSE", "DEBT", "DEBT_REPAYMENT", "LOAN", "LOAN_COLLECTION"]),
  recorded_at: isoDateTime,
  created_at: isoDateTime,
  updated_at: isoDateTime,
  items: z.array(ledgerRecordItemSchema),
});

const ledgerTransferSchema = z.object({
  id: z.string().min(1),
  note: z.string().nullable(),
  amount: moneyAmount,
  fee: moneyAmount,
  source_id: z.string().min(1),
  source_type: z.enum(["WALLET", "BUDGET"]),
  source_name: z.string().min(1),
  destination_id: z.string().min(1),
  destination_type: z.enum(["WALLET", "BUDGET"]),
  destination_name: z.string().min(1),
  type: z.enum(["INCOMING", "OUTGOING"]),
  ref_id: z.string().min(1),
  transferred_at: isoDateTime,
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

const ledgerDebtLoanSchema = z.object({
  id: z.string().min(1),
  note: z.string().nullable(),
  other_party: z.string().min(1).max(255),
  amount: moneyAmount,
  type: z.enum(["DEBT", "LOAN"]),
  source_id: z.string().min(1),
  source_type: z.literal("WALLET"),
  initial_record_id: z.string().min(1),
  resolved_at: isoDateTime.nullable(),
  resolved_record_id: z.string().min(1).nullable(),
  occurred_at: isoDateTime,
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

/** Payload covered by `content_hash` (entities + settings only). */
export const ledgerDocumentPayloadSchema = z.object({
  settings: ledgerSettingsSchema,
  wallets: z.array(ledgerWalletSchema),
  budgets: z.array(ledgerBudgetSchema),
  records: z.array(ledgerRecordSchema),
  transfers: z.array(ledgerTransferSchema),
  debt_loans: z.array(ledgerDebtLoanSchema),
});

export const ledgerDocumentSchema = z.object({
  version: z.literal(LEDGER_DOCUMENT_VERSION),
  revised_at: isoDateTime,
  content_hash: z.string().regex(/^[a-f0-9]{64}$/),
  settings: ledgerSettingsSchema,
  wallets: z.array(ledgerWalletSchema),
  budgets: z.array(ledgerBudgetSchema),
  records: z.array(ledgerRecordSchema),
  transfers: z.array(ledgerTransferSchema),
  debt_loans: z.array(ledgerDebtLoanSchema),
});

export type LedgerDocumentPayload = z.infer<typeof ledgerDocumentPayloadSchema>;
export type LedgerDocument = z.infer<typeof ledgerDocumentSchema>;
export type LedgerDebtLoan = z.infer<typeof ledgerDebtLoanSchema>;
