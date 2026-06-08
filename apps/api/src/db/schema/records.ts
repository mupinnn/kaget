import { relations } from "drizzle-orm";
import { index, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("source_type", ["WALLET", "BUDGET"]);

export const recordTypeEnum = pgEnum("record_type", [
  "INCOME",
  "EXPENSE",
  "DEBT",
  "DEBT_REPAYMENT",
  "LOAN",
  "LOAN_COLLECTION",
]);

export const record = pgTable(
  "record",
  {
    id: text("id").primaryKey(),
    note: text("note"),
    amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
    sourceId: text("source_id").notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    recordType: recordTypeEnum("record_type").notNull(),
    recordedAt: timestamp("recorded_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("record_source_lookup_idx").on(table.sourceType, table.sourceId),
    index("record_source_date_idx").on(table.sourceId, table.recordedAt),
  ]
);

export const recordItem = pgTable(
  "record_item",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => record.id, { onDelete: "cascade" }),
    note: text("note"),
    amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("record_item_record_id_idx").on(table.recordId)]
);

export const recordRelations = relations(record, ({ many }) => ({
  items: many(recordItem),
}));

export const recordItemRelations = relations(recordItem, ({ one }) => ({
  record: one(record, {
    fields: [recordItem.recordId],
    references: [record.id],
  }),
}));
