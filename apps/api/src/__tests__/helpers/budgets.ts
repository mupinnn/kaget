import { nanoid } from "nanoid";
import type { Database } from "../../db/client";
import { budget } from "../../db/schema";
import { formatAmount } from "../../lib/records";

type SeedBudgetParams = {
  walletId: string;
  name?: string;
  balance?: number;
  totalBalance?: number;
  budgetType?: "BUDGET" | "GOAL";
  archivedAt?: Date | null;
};

export async function seedBudget(db: Database, params: SeedBudgetParams) {
  const now = new Date();
  const balance = params.balance ?? 0;
  const totalBalance = params.totalBalance ?? balance;
  const id = nanoid();

  await db.insert(budget).values({
    id,
    name: params.name ?? "Test Budget",
    walletId: params.walletId,
    balance: formatAmount(balance),
    totalBalance: formatAmount(totalBalance),
    budgetType: params.budgetType ?? "BUDGET",
    archivedAt: params.archivedAt ?? null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.query.budget.findFirst({
    where: (b, { eq }) => eq(b.id, id),
  });

  return created!;
}
