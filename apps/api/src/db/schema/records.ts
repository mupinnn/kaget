import { relations } from "drizzle-orm";
import { index, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { wallet } from "./wallets";

export const recordTypeEnum = pgEnum("record_type", ["INCOME", "EXPENSE"]);

export const record = pgTable(
  "record",
  {
    id: text("id").primaryKey(),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallet.id, { onDelete: "cascade" }),
    type: recordTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
    category: text("category").notNull(),
    note: text("note"),
    date: timestamp("date").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("record_wallet_id_idx").on(table.walletId),
    index("record_date_idx").on(table.date),
  ]
);

export const recordRelations = relations(record, ({ one }) => ({
  wallet: one(wallet, {
    fields: [record.walletId],
    references: [wallet.id],
  }),
}));
