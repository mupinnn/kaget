import { relations } from "drizzle-orm";
import { index, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const walletTypeEnum = pgEnum("wallet_type", ["CASH", "DIGITAL"]);

export const wallet = pgTable(
  "wallet",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    balance: numeric("balance", { precision: 19, scale: 4 }).notNull().default("0"),
    type: walletTypeEnum("type").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("wallet_user_id_idx").on(table.userId),
    index("wallet_created_at_idx").on(table.createdAt),
  ]
);

export const walletRelations = relations(wallet, ({ one }) => ({
  user: one(user, {
    fields: [wallet.userId],
    references: [user.id],
  }),
}));
