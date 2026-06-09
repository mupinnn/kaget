import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import * as z from "zod";
import type { Database } from "../db/client";
import { debtLoan, record, recordItem, transfer, wallet } from "../db/schema";
import { type Auth, getSafeSession } from "../lib/auth";
import { AppError } from "../lib/error";
import { ERROR_CODES } from "../lib/error-codes";
import { applyWalletBalanceDelta, formatAmount, getBalanceDelta } from "../lib/records";
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
            note: "Opening Balance",
            amount: formatAmount(initial_balance),
            sourceId: walletId,
            sourceType: "WALLET",
            recordType: "INCOME",
            recordedAt: now,
            createdAt: now,
            updatedAt: now,
          });

          await tx.insert(recordItem).values({
            id: nanoid(),
            recordId,
            note: "Opening Balance",
            amount: formatAmount(initial_balance),
            createdAt: now,
            updatedAt: now,
          });

          const delta = getBalanceDelta("INCOME", initial_balance);
          await applyWalletBalanceDelta(tx, walletId, delta, now);
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
      });

      if (!walletData) {
        throw new AppError(404, ERROR_CODES.WALLET.NOT_FOUND, "Wallet not found");
      }

      const records = await db.query.record.findMany({
        where: and(eq(record.sourceId, walletId), eq(record.sourceType, "WALLET")),
        with: { items: true },
        orderBy: [desc(record.recordedAt)],
        limit: 10,
      });

      wideEvent.wallet = { id: walletId, record_count: records.length };

      return c.json({ data: { ...walletData, records } });
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
      });

      if (!walletData) {
        throw new AppError(404, ERROR_CODES.WALLET.NOT_FOUND, "Wallet not found");
      }

      const recordsToDelete = await db.query.record.findMany({
        where: and(eq(record.sourceId, walletId), eq(record.sourceType, "WALLET")),
        columns: { id: true },
      });

      const transfersToDelete = await db.query.transfer.findMany({
        where: and(eq(transfer.sourceId, walletId), eq(transfer.sourceType, "WALLET")),
        columns: { id: true },
      });

      const debtLoansToDelete = await db.query.debtLoan.findMany({
        where: and(eq(debtLoan.sourceId, walletId), eq(debtLoan.sourceType, "WALLET")),
        columns: { id: true },
      });

      await db.transaction(async tx => {
        if (debtLoansToDelete.length > 0) {
          await tx
            .delete(debtLoan)
            .where(and(eq(debtLoan.sourceId, walletId), eq(debtLoan.sourceType, "WALLET")));
        }

        if (recordsToDelete.length > 0) {
          await tx
            .delete(record)
            .where(and(eq(record.sourceId, walletId), eq(record.sourceType, "WALLET")));
        }

        if (transfersToDelete.length > 0) {
          await tx
            .delete(transfer)
            .where(and(eq(transfer.sourceId, walletId), eq(transfer.sourceType, "WALLET")));
        }

        await tx.delete(wallet).where(eq(wallet.id, walletId));
      });

      wideEvent.wallet = {
        id: walletId,
        deleted_record_count: recordsToDelete.length,
        deleted_transfer_count: transfersToDelete.length,
        deleted_debt_loan_count: debtLoansToDelete.length,
      };

      return c.json({ data: walletData });
    });
}
