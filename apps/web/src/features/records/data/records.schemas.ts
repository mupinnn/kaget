import { z } from "zod";
import type { Wallet } from "@/features/wallets/data/wallets.schemas";

export type RecordType =
  | "INCOME"
  | "EXPENSE"
  | "DEBT"
  | "DEBT_REPAYMENT"
  | "LOAN"
  | "LOAN_COLLECTION";

export type SourceType = "WALLET" | "BUDGET";

/** UI labels for stored record type enums (domain values unchanged). */
export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  DEBT: "Debt",
  DEBT_REPAYMENT: "Debt repayment",
  LOAN: "Loan",
  LOAN_COLLECTION: "Loan collection",
};

/** UI labels for stored source type enums (domain values unchanged). */
export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  WALLET: "Wallet",
  BUDGET: "Budget",
};

export type RecordItem = {
  id: string;
  recordId: string;
  note: string | null;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Record = {
  id: string;
  note: string | null;
  amount: number;
  sourceId: string;
  sourceType: SourceType;
  recordType: RecordType;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type RecordWithItems = Record & { items: RecordItem[] };

export type OwnedRecord = RecordWithItems &
  (
    | { sourceType: "WALLET"; wallet: Wallet }
    | {
        sourceType: "BUDGET";
        budget: import("@/features/budgets/data/budgets.schemas").Budget;
      }
  );

export type ApiRecord = RecordWithItems;
export type RecordListItem = RecordWithItems & { sourceName: string };

export const RecordsRequestQuerySchema = z.object({
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  source_id: z.string().optional(),
  source_type: z.enum(["WALLET", "BUDGET"]).optional(),
});

export type RecordsRequestQuery = z.infer<typeof RecordsRequestQuerySchema>;

export const createRecordSchema = z
  .object({
    source_id: z.string().min(1),
    source_type: z.enum(["WALLET", "BUDGET"]),
    record_type: z.enum(["INCOME", "EXPENSE"], {
      message: "Record type must be INCOME or EXPENSE",
    }),
    recorded_at: z.coerce.date(),
    note: z.string().max(500).trim().optional(),
    items: z
      .array(
        z.object({
          note: z.string().max(500).trim().optional(),
          amount: z.coerce.number().positive("Item amount must be positive"),
        })
      )
      .min(1, "At least one item is required"),
  })
  .superRefine((data, ctx) => {
    if (data.source_type === "BUDGET" && data.record_type !== "EXPENSE") {
      ctx.addIssue({
        code: "custom",
        message: "Budget records must be EXPENSE",
        path: ["record_type"],
      });
    }
  });

export type CreateRecordInput = z.infer<typeof createRecordSchema>;

export const CreateRecordFormSchema = z.object({
  note: z.string().trim().optional(),
  amount: z.coerce.number().positive().optional(),
  record_type: z.enum(["INCOME", "EXPENSE"]),
  source: z.custom<Wallet | { id: string; name: string; balance: string | number }>(),
  dor: z.union([z.date(), z.string()]),
  items: z
    .array(
      z.object({
        note: z.string().trim().optional(),
        amount: z.coerce.number().positive(),
      })
    )
    .default([]),
});

export type CreateRecordForm = z.infer<typeof CreateRecordFormSchema>;
