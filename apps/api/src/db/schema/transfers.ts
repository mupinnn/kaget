import { index, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sourceTypeEnum } from "./records";

export const transferTypeEnum = pgEnum("transfer_type", ["INCOMING", "OUTGOING"]);

export const transfer = pgTable(
  "transfer",
  {
    id: text("id").primaryKey(),
    note: text("note"),
    amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
    fee: numeric("fee", { precision: 19, scale: 4 }).notNull().default("0"),
    sourceId: text("source_id").notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    sourceName: text("source_name").notNull(),
    destinationId: text("destination_id").notNull(),
    destinationType: sourceTypeEnum("destination_type").notNull(),
    destinationName: text("destination_name").notNull(),
    type: transferTypeEnum("type").notNull(),
    refId: text("ref_id").notNull(),
    transferredAt: timestamp("transferred_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("transfer_ref_id_idx").on(table.refId),
    index("transfer_source_lookup_idx").on(table.sourceType, table.sourceId),
    index("transfer_transferred_at_idx").on(table.transferredAt),
  ]
);
