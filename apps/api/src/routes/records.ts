import { and, count, desc, eq, gte, inArray, lte, notInArray } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import * as z from "zod";
import type { Database } from "../db/client";
import { record, recordItem, wallet } from "../db/schema";
import { type Auth, getSafeSession } from "../lib/auth";
import {
  applyWalletBalanceDelta,
  assertOwnedWallet,
  formatAmount,
  getBalanceDelta,
  loadOwnedRecord,
  parseAmount,
  sumItemAmounts,
} from "../lib/records";
import { validator } from "../lib/validator";

const recordItemInputSchema = z.object({
  note: z.string().max(500).trim().optional(),
  amount: z.coerce.number().positive("Item amount must be positive"),
});

const createRecordSchema = z.object({
  source_id: z.string().min(1),
  source_type: z.literal("WALLET"),
  record_type: z.enum(["INCOME", "EXPENSE"], {
    message: "Record type must be INCOME or EXPENSE",
  }),
  recorded_at: z.coerce.date(),
  note: z.string().max(500).trim().optional(),
  items: z.array(recordItemInputSchema).min(1, "At least one item is required"),
});

const updateRecordItemSchema = recordItemInputSchema.extend({
  id: z.string().min(1).optional(),
});

const updateRecordSchema = z
  .object({
    note: z.string().max(500).trim().optional(),
    record_type: z.enum(["INCOME", "EXPENSE"]).optional(),
    source_id: z.string().min(1).optional(),
    recorded_at: z.coerce.date().optional(),
    items: z.array(updateRecordItemSchema).min(1, "At least one item is required").optional(),
  })
  .refine(body => Object.keys(body).length > 0, {
    message: "At least one field is required",
  });

const listRecordsQuerySchema = z.object({
  source_id: z.string().min(1).optional(),
  record_type: z.enum(["INCOME", "EXPENSE"]).optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

async function getUserWalletIds(db: Database, userId: string) {
  const wallets = await db.query.wallet.findMany({
    where: eq(wallet.userId, userId),
    columns: { id: true },
  });

  return wallets.map(w => w.id);
}

function buildListConditions(walletIds: string[], query: z.infer<typeof listRecordsQuerySchema>) {
  const conditions = [eq(record.sourceType, "WALLET"), inArray(record.sourceId, walletIds)];

  if (query.source_id) {
    conditions.push(eq(record.sourceId, query.source_id));
  }

  if (query.record_type) {
    conditions.push(eq(record.recordType, query.record_type));
  }

  if (query.from_date) {
    conditions.push(gte(record.recordedAt, query.from_date));
  }

  if (query.to_date) {
    const endOfDay = new Date(query.to_date);
    endOfDay.setHours(23, 59, 59, 999);
    conditions.push(lte(record.recordedAt, endOfDay));
  }

  return conditions;
}

export function createRecordRoutes(db: Database, _auth: Auth) {
  return new Hono()
    .get("/", validator("query", listRecordsQuerySchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const query = c.req.valid("query");

      const walletIds = await getUserWalletIds(db, user.id);

      if (query.source_id) {
        await assertOwnedWallet(db, user.id, query.source_id);
      }

      if (walletIds.length === 0) {
        wideEvent.record = { count: 0 };
        return c.json({
          data: {
            records: [],
            pagination: { total: 0, limit: query.limit, offset: query.offset },
          },
        });
      }

      const conditions = buildListConditions(walletIds, query);

      const [totalResult] = await db
        .select({ total: count() })
        .from(record)
        .where(and(...conditions));

      const records = await db.query.record.findMany({
        where: and(...conditions),
        with: { items: true },
        orderBy: [desc(record.recordedAt)],
        limit: query.limit,
        offset: query.offset,
      });

      wideEvent.record = { count: records.length, total: totalResult.total };

      return c.json({
        data: {
          records,
          pagination: {
            total: totalResult.total,
            limit: query.limit,
            offset: query.offset,
          },
        },
      });
    })

    .post("/", validator("json", createRecordSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const body = c.req.valid("json");

      await assertOwnedWallet(db, user.id, body.source_id);

      const recordId = nanoid();
      const now = new Date();
      const totalAmount = sumItemAmounts(body.items);

      await db.transaction(async tx => {
        await tx.insert(record).values({
          id: recordId,
          note: body.note ?? null,
          amount: formatAmount(totalAmount),
          sourceId: body.source_id,
          sourceType: "WALLET",
          recordType: body.record_type,
          recordedAt: body.recorded_at,
          createdAt: now,
          updatedAt: now,
        });

        for (const item of body.items) {
          await tx.insert(recordItem).values({
            id: nanoid(),
            recordId,
            note: item.note ?? null,
            amount: formatAmount(item.amount),
            createdAt: now,
            updatedAt: now,
          });
        }

        const delta = getBalanceDelta(body.record_type, totalAmount);
        await applyWalletBalanceDelta(tx, body.source_id, delta, now);
      });

      const createdRecord = await loadOwnedRecord(db, user.id, recordId);

      wideEvent.record = {
        id: recordId,
        source_id: body.source_id,
        record_type: body.record_type,
      };

      return c.json({ data: createdRecord }, 201);
    })

    .get("/:id", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const recordId = c.req.param("id");

      const recordData = await loadOwnedRecord(db, user.id, recordId);

      wideEvent.record = { id: recordId };

      return c.json({ data: recordData });
    })

    .patch("/:id", validator("json", updateRecordSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const recordId = c.req.param("id");
      const body = c.req.valid("json");

      const current = await loadOwnedRecord(db, user.id, recordId);
      const now = new Date();

      const newSourceId = body.source_id ?? current.sourceId;
      const newRecordType = body.record_type ?? current.recordType;
      const newRecordedAt = body.recorded_at ?? current.recordedAt;
      const newNote = body.note !== undefined ? body.note : current.note;

      if (newSourceId !== current.sourceId) {
        await assertOwnedWallet(db, user.id, newSourceId);
      }

      const currentAmount = parseAmount(current.amount);
      const oldDelta = getBalanceDelta(current.recordType, currentAmount);

      let newAmount = currentAmount;
      if (body.items) {
        newAmount = sumItemAmounts(body.items);
      }

      const newDelta = getBalanceDelta(newRecordType, newAmount);

      await db.transaction(async tx => {
        await tx
          .update(record)
          .set({
            note: newNote,
            amount: formatAmount(newAmount),
            sourceId: newSourceId,
            recordType: newRecordType,
            recordedAt: newRecordedAt,
            updatedAt: now,
          })
          .where(eq(record.id, recordId));

        if (body.items) {
          const requestItemIds = body.items.flatMap(item => (item.id ? [item.id] : []));

          if (requestItemIds.length > 0) {
            await tx
              .delete(recordItem)
              .where(
                and(eq(recordItem.recordId, recordId), notInArray(recordItem.id, requestItemIds))
              );
          } else {
            await tx.delete(recordItem).where(eq(recordItem.recordId, recordId));
          }

          for (const item of body.items) {
            if (item.id) {
              await tx
                .update(recordItem)
                .set({
                  note: item.note ?? null,
                  amount: formatAmount(item.amount),
                  updatedAt: now,
                })
                .where(and(eq(recordItem.id, item.id), eq(recordItem.recordId, recordId)));
            } else {
              await tx.insert(recordItem).values({
                id: nanoid(),
                recordId,
                note: item.note ?? null,
                amount: formatAmount(item.amount),
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }

        if (current.sourceId === newSourceId) {
          await applyWalletBalanceDelta(tx, newSourceId, newDelta - oldDelta, now);
        } else {
          await applyWalletBalanceDelta(tx, current.sourceId, -oldDelta, now);
          await applyWalletBalanceDelta(tx, newSourceId, newDelta, now);
        }
      });

      const updatedRecord = await loadOwnedRecord(db, user.id, recordId);

      wideEvent.record = { id: recordId, source_id: newSourceId };

      return c.json({ data: updatedRecord });
    })

    .delete("/:id", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const recordId = c.req.param("id");

      const current = await loadOwnedRecord(db, user.id, recordId);
      const now = new Date();
      const amount = parseAmount(current.amount);
      const reversalDelta = -getBalanceDelta(current.recordType, amount);

      await db.transaction(async tx => {
        await tx.delete(record).where(eq(record.id, recordId));
        await applyWalletBalanceDelta(tx, current.sourceId, reversalDelta, now);
      });

      wideEvent.record = { id: recordId, deleted: true };

      return c.json({ data: current });
    });
}
