import { relations } from "drizzle-orm";
import { index, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { wallet } from "./wallets";

export const budgetTypeEnum = pgEnum("budget_type", ["BUDGET", "GOAL"]);

export const budget = pgTable(
  "budget",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallet.id, { onDelete: "cascade" }),
    balance: numeric("balance", { precision: 19, scale: 4 }).notNull().default("0"),
    totalBalance: numeric("total_balance", { precision: 19, scale: 4 }).notNull(),
    budgetType: budgetTypeEnum("budget_type").notNull().default("BUDGET"),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("budget_wallet_id_idx").on(table.walletId)]
);

export const budgetRelations = relations(budget, ({ one }) => ({
  wallet: one(wallet, {
    fields: [budget.walletId],
    references: [wallet.id],
  }),
}));
