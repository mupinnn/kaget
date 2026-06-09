import { and, count, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { Hono } from "hono";
import * as z from "zod";
import type { Database } from "../db/client";
import { debtLoan, wallet } from "../db/schema";
import { type Auth, getSafeSession } from "../lib/auth";
import {
  assertOwnedDebtLoan,
  assertOwnedWalletForDebtLoan,
  createDebtLoan,
  deleteDebtLoan,
  loadDebtLoanDetail,
  resolveDebtLoan,
  updateDebtLoan,
} from "../lib/debt-loans";
import { assertOwnedWallet } from "../lib/records";
import { validator } from "../lib/validator";

const createDebtLoanSchema = z.object({
  type: z.enum(["DEBT", "LOAN"]),
  wallet_id: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  other_party: z.string().min(1, "Other party is required").max(255).trim(),
  occurred_at: z.coerce.date(),
  note: z.string().max(500).trim().optional(),
});

const updateDebtLoanSchema = z
  .object({
    note: z.string().max(500).trim().nullable().optional(),
    other_party: z.string().min(1, "Other party is required").max(255).trim().optional(),
    amount: z.coerce.number().positive("Amount must be positive").optional(),
    occurred_at: z.coerce.date().optional(),
  })
  .refine(body => Object.keys(body).length > 0, {
    message: "At least one field is required",
  });

const listDebtLoansQuerySchema = z.object({
  type: z.enum(["DEBT", "LOAN"]).optional(),
  status: z.enum(["PENDING", "RESOLVED"]).optional(),
  wallet_id: z.string().min(1).optional(),
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

function buildListConditions(walletIds: string[], query: z.infer<typeof listDebtLoansQuerySchema>) {
  const conditions = [eq(debtLoan.sourceType, "WALLET"), inArray(debtLoan.sourceId, walletIds)];

  if (query.wallet_id) {
    conditions.push(eq(debtLoan.sourceId, query.wallet_id));
  }

  if (query.type) {
    conditions.push(eq(debtLoan.type, query.type));
  }

  if (query.status === "PENDING") {
    conditions.push(isNull(debtLoan.resolvedAt));
  }

  if (query.status === "RESOLVED") {
    conditions.push(isNotNull(debtLoan.resolvedAt));
  }

  return and(...conditions);
}

export function createDebtLoanRoutes(db: Database, _auth: Auth) {
  return new Hono()
    .get("/", validator("query", listDebtLoansQuerySchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const query = c.req.valid("query");

      if (query.wallet_id) {
        await assertOwnedWallet(db, user.id, query.wallet_id);
      }

      const walletIds = await getUserWalletIds(db, user.id);

      if (walletIds.length === 0) {
        wideEvent.debt_loan = { count: 0 };
        return c.json({
          data: {
            debt_loans: [],
            pagination: { total: 0, limit: query.limit, offset: query.offset },
          },
        });
      }

      const conditions = buildListConditions(walletIds, query);

      const [totalResult] = await db.select({ total: count() }).from(debtLoan).where(conditions);

      const debtLoans = await db.query.debtLoan.findMany({
        where: conditions,
        orderBy: [desc(debtLoan.occurredAt)],
        limit: query.limit,
        offset: query.offset,
      });

      wideEvent.debt_loan = { count: debtLoans.length, total: totalResult.total };

      return c.json({
        data: {
          debt_loans: debtLoans,
          pagination: {
            total: totalResult.total,
            limit: query.limit,
            offset: query.offset,
          },
        },
      });
    })

    .post("/", validator("json", createDebtLoanSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const body = c.req.valid("json");
      const now = new Date();

      const walletData = await assertOwnedWalletForDebtLoan(db, user.id, body.wallet_id);

      const debtLoanId = await db.transaction(async tx =>
        createDebtLoan(tx, walletData, body, now)
      );

      const created = await loadDebtLoanDetail(db, user.id, debtLoanId);

      wideEvent.debt_loan = { id: debtLoanId, type: body.type, action: "create" };

      return c.json({ data: created }, 201);
    })

    .get("/:id", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const debtLoanId = c.req.param("id");

      const detail = await loadDebtLoanDetail(db, user.id, debtLoanId);

      wideEvent.debt_loan = { id: debtLoanId };

      return c.json({ data: detail });
    })

    .patch("/:id", validator("json", updateDebtLoanSchema), async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const debtLoanId = c.req.param("id");
      const body = c.req.valid("json");
      const now = new Date();

      const debtLoanData = await assertOwnedDebtLoan(db, user.id, debtLoanId);

      await db.transaction(async tx =>
        updateDebtLoan(tx, debtLoanData, debtLoanData.wallet, body, now)
      );

      const updated = await loadDebtLoanDetail(db, user.id, debtLoanId);

      wideEvent.debt_loan = { id: debtLoanId, action: "update" };

      return c.json({ data: updated });
    })

    .post("/:id/resolve", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const debtLoanId = c.req.param("id");
      const now = new Date();

      const debtLoanData = await assertOwnedDebtLoan(db, user.id, debtLoanId);

      await db.transaction(async tx => resolveDebtLoan(tx, debtLoanData, debtLoanData.wallet, now));

      const resolved = await loadDebtLoanDetail(db, user.id, debtLoanId);

      wideEvent.debt_loan = { id: debtLoanId, type: debtLoanData.type, action: "resolve" };

      return c.json({ data: resolved });
    })

    .delete("/:id", async c => {
      const { user } = getSafeSession(c);
      const wideEvent = c.get("wideEvent");
      const debtLoanId = c.req.param("id");
      const now = new Date();

      const debtLoanData = await assertOwnedDebtLoan(db, user.id, debtLoanId);

      await db.transaction(async tx => deleteDebtLoan(tx, debtLoanData, debtLoanData.wallet, now));

      wideEvent.debt_loan = { id: debtLoanId, action: "delete" };

      return c.json({ data: debtLoanData });
    });
}
