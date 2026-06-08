import { and, count, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { Hono } from "hono";
import * as z from "zod";
import type { Database } from "../db/client";
import { transfer } from "../db/schema";
import { type Auth, getSafeSession } from "../lib/auth";
import { assertOwnedBudget } from "../lib/budgets";
import { AppError } from "../lib/error";
import { ERROR_CODES } from "../lib/error-codes";
import { assertOwnedWallet } from "../lib/records";
import {
  createTransferPair,
  getUserAccountScope,
  loadOwnedTransfer,
  loadPairedTransfer,
  resolveAccount,
  validateTransferRules,
} from "../lib/transfers";
import { validator } from "../lib/validator";

const createTransferSchema = z.object({
  sender_id: z.string().min(1),
  sender_type: z.enum(["WALLET", "BUDGET"]),
  receiver_id: z.string().min(1),
  receiver_type: z.enum(["WALLET", "BUDGET"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  fee: z.coerce.number().min(0, "Fee cannot be negative").optional().default(0),
  note: z.string().max(500).trim().optional(),
  transferred_at: z.coerce.date().optional(),
});

const listTransfersQuerySchema = z.object({
  account_id: z.string().min(1).optional(),
  account_type: z.enum(["WALLET", "BUDGET"]).optional(),
  type: z.enum(["INCOMING", "OUTGOING"]).optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

function buildOwnershipConditions(walletIds: string[], budgetIds: string[]) {
  const conditions = [];

  if (walletIds.length > 0) {
    conditions.push(and(eq(transfer.sourceType, "WALLET"), inArray(transfer.sourceId, walletIds)));
  }

  if (budgetIds.length > 0) {
    conditions.push(and(eq(transfer.sourceType, "BUDGET"), inArray(transfer.sourceId, budgetIds)));
  }

  if (conditions.length === 0) {
    return null;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return or(...conditions);
}

function buildListConditions(
  walletIds: string[],
  budgetIds: string[],
  query: z.infer<typeof listTransfersQuerySchema>
) {
  const ownershipCondition = buildOwnershipConditions(walletIds, budgetIds);
  if (!ownershipCondition) {
    return null;
  }

  const conditions = [ownershipCondition];

  if (query.account_id && query.account_type) {
    conditions.push(
      eq(transfer.sourceId, query.account_id),
      eq(transfer.sourceType, query.account_type)
    );
  }

  if (query.type) {
    conditions.push(eq(transfer.type, query.type));
  }

  if (query.from_date) {
    conditions.push(gte(transfer.transferredAt, query.from_date));
  }

  if (query.to_date) {
    const endOfDay = new Date(query.to_date);
    endOfDay.setHours(23, 59, 59, 999);
    conditions.push(lte(transfer.transferredAt, endOfDay));
  }

  return and(...conditions);
}

async function assertOwnedAccount(
  db: Database,
  userId: string,
  accountId: string,
  accountType: "WALLET" | "BUDGET"
) {
  if (accountType === "WALLET") {
    await assertOwnedWallet(db, userId, accountId);
    return;
  }

  await assertOwnedBudget(db, userId, accountId);
}

export function createTransferRoutes(db: Database, _auth: Auth) {
  return new Hono()
    .get("/", validator("query", listTransfersQuerySchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const query = c.req.valid("query");

      if (query.account_id && !query.account_type) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION.INVALID_INPUT,
          "account_type is required when account_id is provided"
        );
      }

      if (query.account_type && !query.account_id) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION.INVALID_INPUT,
          "account_id is required when account_type is provided"
        );
      }

      if (query.account_id && query.account_type) {
        await assertOwnedAccount(db, user.id, query.account_id, query.account_type);
      }

      const { walletIds, budgetIds } = await getUserAccountScope(db, user.id);
      const conditions = buildListConditions(walletIds, budgetIds, query);

      if (!conditions) {
        wideEvent.transfer = { count: 0 };
        return c.json({
          data: {
            transfers: [],
            pagination: { total: 0, limit: query.limit, offset: query.offset },
          },
        });
      }

      const [totalResult] = await db.select({ total: count() }).from(transfer).where(conditions);

      const transfers = await db.query.transfer.findMany({
        where: conditions,
        orderBy: [desc(transfer.transferredAt)],
        limit: query.limit,
        offset: query.offset,
      });

      wideEvent.transfer = { count: transfers.length, total: totalResult.total };

      return c.json({
        data: {
          transfers,
          pagination: {
            total: totalResult.total,
            limit: query.limit,
            offset: query.offset,
          },
        },
      });
    })

    .post("/", validator("json", createTransferSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const body = c.req.valid("json");
      const now = new Date();
      const transferredAt = body.transferred_at ?? now;

      const sender = await resolveAccount(db, user.id, body.sender_id, body.sender_type);
      const receiver = await resolveAccount(db, user.id, body.receiver_id, body.receiver_type);

      validateTransferRules(sender, receiver, body.amount, body.fee);

      const outgoingId = await db.transaction(async tx =>
        createTransferPair(tx, {
          sender,
          receiver,
          amount: body.amount,
          fee: body.fee,
          note: body.note,
          transferredAt,
          now,
        })
      );

      const createdTransfer = await loadOwnedTransfer(db, user.id, outgoingId);

      wideEvent.transfer = {
        id: outgoingId,
        ref_id: createdTransfer.refId,
        sender_id: body.sender_id,
        receiver_id: body.receiver_id,
      };

      return c.json({ data: createdTransfer }, 201);
    })

    .get("/:id", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const transferId = c.req.param("id");

      const transferData = await loadOwnedTransfer(db, user.id, transferId);
      const pairedTransfer = await loadPairedTransfer(db, transferData.refId, transferData.id);

      wideEvent.transfer = { id: transferId };

      return c.json({ data: { ...transferData, pairedTransfer } });
    });
}
