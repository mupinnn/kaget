import { nanoid } from "nanoid";
import { getWalletList } from "@/features/wallets/data/wallets.services";
import { db } from "@/libs/db.lib";
import {
  archiveBudgetIfZero,
  assertBudget,
  assertBudgetActive,
  assertWallet,
  createTransferPair,
  resolveAccount,
  toBudgetDetail,
  validateAddFunds,
  validateRefundAmount,
  validateTransferRules,
} from "@/libs/ledger.lib";
import { BadRequestError } from "@/utils/error.util";
import type {
  Budget,
  BudgetsRequestQuery,
  BudgetWithWallet,
  CreateBudget,
  UpdateBudgetBalance,
} from "./budgets.schemas";

async function attachWallets<T extends { walletId: string }>(
  budgets: T[],
  wallets?: Awaited<ReturnType<typeof getWalletList>>
): Promise<Array<T & { wallet: Awaited<ReturnType<typeof getWalletList>>[number] }>> {
  const resolvedWallets = wallets ?? (await getWalletList());
  const walletMap = new Map(resolvedWallets.map(wallet => [wallet.id, wallet]));

  return budgets.map(budget => {
    const wallet = walletMap.get(budget.walletId);

    if (!wallet) {
      throw new Error("Wallet not found for budget");
    }

    return { ...budget, wallet };
  });
}

export async function getBudgetList(query: BudgetsRequestQuery = {}) {
  let budgets = await db.budgets.orderBy("updatedAt").reverse().toArray();

  if (query.archived === true) {
    budgets = budgets.filter(budget => budget.archivedAt !== null);
  } else if (query.archived === false) {
    budgets = budgets.filter(budget => budget.archivedAt === null);
  }

  const details = budgets.map(toBudgetDetail);
  const withWallets = await attachWallets(details);

  if (query.limit) {
    return withWallets.slice(0, query.limit);
  }

  return withWallets;
}

export async function getBudgetDetail(budgetId: string): Promise<BudgetWithWallet> {
  const budget = toBudgetDetail(await assertBudget(budgetId));
  const [withWallet] = await attachWallets([budget]);
  return withWallet;
}

type BudgetCreateItem = {
  name: string;
  wallet_id: string;
  amount: number;
  budget_type: "BUDGET" | "GOAL";
  initial_contribution?: number;
};

function getWalletDeductionForCreate(item: BudgetCreateItem): number {
  if (item.budget_type === "GOAL") {
    return item.initial_contribution ?? 0;
  }
  return item.amount;
}

async function createBudgetWithTransfer(item: BudgetCreateItem, now: Date) {
  const budgetId = nanoid();
  const deduction = getWalletDeductionForCreate(item);

  const budget: Budget = {
    id: budgetId,
    name: item.name,
    walletId: item.wallet_id,
    balance: 0,
    totalBalance: item.amount,
    budgetType: item.budget_type,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.budgets.add(budget);

  if (deduction > 0) {
    const sender = await resolveAccount(item.wallet_id, "WALLET");
    const receiver = await resolveAccount(budgetId, "BUDGET");
    validateTransferRules(sender, receiver, deduction, 0);
    await createTransferPair({
      sender,
      receiver,
      amount: deduction,
      fee: 0,
      note: `Budget allocation for ${item.name}`,
      transferredAt: now,
      now,
    });
  }

  return toBudgetDetail(await assertBudget(budgetId));
}

export async function createBudget(payload: CreateBudget) {
  const items: BudgetCreateItem[] = payload.budgets.map(budget => ({
    name: budget.name,
    wallet_id: budget.wallet.id,
    amount: budget.balance,
    budget_type: "BUDGET",
  }));

  const deductionsByWallet = new Map<string, number>();
  for (const item of items) {
    const deduction = getWalletDeductionForCreate(item);
    deductionsByWallet.set(
      item.wallet_id,
      (deductionsByWallet.get(item.wallet_id) ?? 0) + deduction
    );
  }

  for (const [walletId, totalDeduction] of deductionsByWallet) {
    if (totalDeduction === 0) continue;
    const wallet = await assertWallet(walletId);
    if (wallet.balance < totalDeduction) {
      throw new BadRequestError("Insufficient wallet balance");
    }
  }

  const now = new Date();
  const created = await db.transaction(
    "rw",
    db.wallets,
    db.budgets,
    db.transfers,
    db.records,
    db.recordItems,
    async () => {
      const results = [];
      for (const item of items) {
        results.push(await createBudgetWithTransfer(item, now));
      }
      return results;
    }
  );

  return created;
}

export async function updateBudgetBalanceDetail(budgetId: string, payload: UpdateBudgetBalance) {
  const amount = payload.balance;
  const now = new Date();

  await db.transaction(
    "rw",
    db.wallets,
    db.budgets,
    db.transfers,
    db.records,
    db.recordItems,
    async () => {
      const budget = await assertBudget(budgetId);

      if (payload.type === "ADD") {
        assertBudgetActive(budget, "add");
        validateAddFunds(budget, amount);

        const wallet = await assertWallet(budget.walletId);
        if (wallet.balance < amount) {
          throw new BadRequestError("Insufficient wallet balance");
        }

        const sender = await resolveAccount(budget.walletId, "WALLET");
        const receiver = await resolveAccount(budgetId, "BUDGET");
        validateTransferRules(sender, receiver, amount, 0);
        await createTransferPair({
          sender,
          receiver,
          amount,
          fee: 0,
          note: `Add funds to ${budget.name}`,
          transferredAt: now,
          now,
        });
        return;
      }

      assertBudgetActive(budget, "refund");
      validateRefundAmount(budget, amount);

      const sender = await resolveAccount(budgetId, "BUDGET");
      const receiver = await resolveAccount(budget.walletId, "WALLET");
      validateTransferRules(sender, receiver, amount, 0);
      await createTransferPair({
        sender,
        receiver,
        amount,
        fee: 0,
        note: `Refund from ${budget.name}`,
        transferredAt: now,
        now,
      });
      await archiveBudgetIfZero(budgetId, now);
    }
  );

  return getBudgetDetail(budgetId);
}

export async function activateBudget(budgetId: string) {
  const now = new Date();

  await db.transaction(
    "rw",
    db.wallets,
    db.budgets,
    db.transfers,
    db.records,
    db.recordItems,
    async () => {
      const budget = await assertBudget(budgetId);

      if (!budget.archivedAt) {
        throw new BadRequestError("Budget is not archived");
      }

      const reactivateAmount = budget.totalBalance;
      const wallet = await assertWallet(budget.walletId);
      if (wallet.balance < reactivateAmount) {
        throw new BadRequestError("Insufficient wallet balance");
      }

      await db.budgets.update(budgetId, {
        archivedAt: null,
        balance: 0,
        updatedAt: now,
      });

      const sender = await resolveAccount(budget.walletId, "WALLET");
      const receiver = await resolveAccount(budgetId, "BUDGET");
      validateTransferRules(sender, receiver, reactivateAmount, 0);
      await createTransferPair({
        sender,
        receiver,
        amount: reactivateAmount,
        fee: 0,
        note: `Reactivate ${budget.name}`,
        transferredAt: now,
        now,
      });
    }
  );

  return getBudgetDetail(budgetId);
}
