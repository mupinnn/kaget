import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { Database } from "../db/client";
import { record, wallet } from "../db/schema";
import { type Auth, getSafeSession } from "../lib/auth";
import { AppError } from "../lib/error";
import { ERROR_CODES } from "../lib/error-codes";
import { validator } from "../lib/validator";

const createWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required").max(255).trim(),
  type: z.enum(["CASH", "DIGITAL"]),
  initial_balance: z.coerce
    .number()
    .min(0, "Initial balance must be non-negative")
    .optional()
    .default(0),
});

const updateWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required").max(255).trim(),
});

export function createWalletRoutes(db: Database, _auth: Auth) {
  return new Hono()
    .get("/", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");

      const wallets = await db.query.wallet.findMany({
        where: eq(wallet.userId, user.id),
        orderBy: (wallet, { desc }) => [desc(wallet.createdAt)],
      });

      wideEvent.wallet = { count: wallets.length };

      return c.json({ data: wallets });
    })

    .post("/", validator("json", createWalletSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const { name, type, initial_balance } = c.req.valid("json");

      const walletId = nanoid();
      const now = new Date();

      await db.transaction(async tx => {
        await tx.insert(wallet).values({
          id: walletId,
          userId: user.id,
          name,
          type,
          balance: "0",
          createdAt: now,
          updatedAt: now,
        });

        if (initial_balance > 0) {
          const recordId = nanoid();
          await tx.insert(record).values({
            id: recordId,
            walletId,
            type: "INCOME",
            amount: initial_balance.toString(),
            category: "Opening Balance",
            note: "Initial balance",
            date: now,
            createdAt: now,
            updatedAt: now,
          });

          await tx
            .update(wallet)
            .set({ balance: initial_balance.toString(), updatedAt: now })
            .where(eq(wallet.id, walletId));
        }
      });

      const newWallet = await db.query.wallet.findFirst({
        where: eq(wallet.id, walletId),
      });

      wideEvent.wallet = { id: walletId, initial_balance };

      return c.json({ data: newWallet }, 201);
    })

    .get("/:id", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const walletId = c.req.param("id");

      const walletData = await db.query.wallet.findFirst({
        where: and(eq(wallet.id, walletId), eq(wallet.userId, user.id)),
        with: {
          records: {
            orderBy: (record, { desc }) => [desc(record.date)],
            limit: 10,
          },
        },
      });

      if (!walletData) {
        throw new AppError(404, ERROR_CODES.WALLET.NOT_FOUND, "Wallet not found");
      }

      wideEvent.wallet = { id: walletId, record_count: walletData.records.length };

      return c.json({ data: walletData });
    })

    .patch("/:id", validator("json", updateWalletSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const walletId = c.req.param("id");
      const { name } = c.req.valid("json");

      const walletData = await db.query.wallet.findFirst({
        where: and(eq(wallet.id, walletId), eq(wallet.userId, user.id)),
      });

      if (!walletData) {
        throw new AppError(404, ERROR_CODES.WALLET.NOT_FOUND, "Wallet not found");
      }

      const now = new Date();
      await db.update(wallet).set({ name, updatedAt: now }).where(eq(wallet.id, walletId));

      const updatedWallet = await db.query.wallet.findFirst({
        where: eq(wallet.id, walletId),
      });

      wideEvent.wallet = { id: walletId };

      return c.json({ data: updatedWallet });
    })

    .delete("/:id", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const walletId = c.req.param("id");

      const walletData = await db.query.wallet.findFirst({
        where: and(eq(wallet.id, walletId), eq(wallet.userId, user.id)),
        with: {
          records: true,
        },
      });

      if (!walletData) {
        throw new AppError(404, ERROR_CODES.WALLET.NOT_FOUND, "Wallet not found");
      }

      await db.transaction(async tx => {
        await tx.delete(record).where(eq(record.walletId, walletId));

        await tx.delete(wallet).where(eq(wallet.id, walletId));
      });

      wideEvent.wallet = { id: walletId, deleted_record_count: walletData.records.length };

      return c.json({ data: walletData });
    });
}
