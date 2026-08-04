import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

/** Server-side pointer to the user's Drive ledger file — never stores ledger body. */
export const driveLedgerFile = pgTable(
  "drive_ledger_file",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fileId: text("file_id").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [uniqueIndex("drive_ledger_file_user_id_idx").on(table.userId)]
);

export const driveLedgerFileRelations = relations(driveLedgerFile, ({ one }) => ({
  user: one(user, {
    fields: [driveLedgerFile.userId],
    references: [user.id],
  }),
}));
