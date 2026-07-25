import { relations } from "drizzle-orm";
import { index, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sourceTypeEnum } from "./records";
import { wallet } from "./wallets";

export const debtLoanTypeEnum = pgEnum("debt_loan_type", ["DEBT", "LOAN"]);

export const debtLoan = pgTable(
  "debt_loan",
  {
    id: text("id").primaryKey(),
    note: text("note"),
    otherParty: text("other_party").notNull(),
    amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
    type: debtLoanTypeEnum("type").notNull(),
    sourceId: text("source_id")
      .notNull()
      .references(() => wallet.id, { onDelete: "cascade" }),
    sourceType: sourceTypeEnum("source_type").notNull(),
    initialRecordId: text("initial_record_id").notNull(),
    resolvedAt: timestamp("resolved_at"),
    resolvedRecordId: text("resolved_record_id"),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("debt_loan_source_lookup_idx").on(table.sourceType, table.sourceId),
    index("debt_loan_type_idx").on(table.type),
    index("debt_loan_resolved_at_idx").on(table.resolvedAt),
    uniqueIndex("debt_loan_initial_record_id_idx").on(table.initialRecordId),
    uniqueIndex("debt_loan_resolved_record_id_idx").on(table.resolvedRecordId),
  ]
);

export const debtLoanRelations = relations(debtLoan, ({ one }) => ({
  wallet: one(wallet, {
    fields: [debtLoan.sourceId],
    references: [wallet.id],
  }),
}));
