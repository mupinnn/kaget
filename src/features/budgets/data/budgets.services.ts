import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import { db } from "@/libs/db.lib";
import { successResponse } from "@/utils/service.util";
import { type Wallet } from "@/features/wallets/data/wallets.schemas";
import { getWalletById } from "@/features/wallets/data/wallets.services";
import { getSourceOrDestinationById } from "@/features/records/data/records.services";
import { commitTransfer } from "@/features/transfers/data/transfers.services";
import {
  type Budget,
  type TransformedBudgetWithRelations,
  type CreateBudget,
  CreateBudgetSchema,
  BudgetsRequestQuerySchema,
  UpdateBudgetBalanceSchema,
  type BudgetsRequestQuery,
  TransformedBudgetWithRelationsSchema,
  BudgetSchema,
  type UpdateBudgetBalance,
} from "./budgets.schemas";
import { formatCurrency } from "@/utils/common.util";

export async function getBudgetById(budgetId: string) {
  const storedBudgetById = await db.budget.get(budgetId);

  if (!storedBudgetById) throw new Error("Budget not found");

  return storedBudgetById;
}

export async function getBudgetItemById(budgetItemId: string) {
  const storedBudgetItemById = await db.budget_item.get(budgetItemId);

  if (!storedBudgetItemById) throw new Error("Budget item not found");

  return storedBudgetItemById;
}

export async function updateBudgetById(budgetId: string, modifyCallback: (budget: Budget) => void) {
  await db.budget
    .where("id")
    .equals(budgetId)
    .modify(budget => {
      budget.updated_at = new Date().toISOString();
      modifyCallback(budget);
    });
}

export async function addBudgetBalance(budgetId: string, amountToAdd: number) {
  await updateBudgetById(budgetId, budget => {
    budget.balance += amountToAdd;
  });
}

export async function deductBudgetBalance(budgetId: string, amountToDeduct: number) {
  await updateBudgetById(budgetId, budget => {
    budget.balance -= amountToDeduct;
  });
}

const MAX_PERCENTAGE = 100;

async function transformBudgetWithRelationsResponse(
  budget: Budget
): Promise<TransformedBudgetWithRelations> {
  const usedBalance = Math.abs(budget.total_balance - budget.balance);
  const remainingBalance = budget.balance;
  const remainingBalancePercentage = (budget.balance / budget.total_balance) * MAX_PERCENTAGE;
  const usedBalancePercentage = Math.abs(MAX_PERCENTAGE - remainingBalancePercentage);
  const storedWalletById = await getWalletById(budget.wallet_id);

  return {
    id: budget.id,
    name: budget.name,
    wallet_id: budget.wallet_id,
    created_at: budget.created_at,
    updated_at: budget.updated_at,
    archived_at: budget.archived_at,
    used_balance: usedBalance,
    used_balance_percentage: usedBalancePercentage,
    remaining_balance: remainingBalance,
    remaining_balance_percentage: remainingBalancePercentage,
    total_balance: budget.total_balance,
    wallet: storedWalletById,
  };
}

export async function getBudgetList(query: BudgetsRequestQuery = {}) {
  const parsedFilters = BudgetsRequestQuerySchema.parse(query);
  const budgetsCollection = db.budget.orderBy("updated_at").reverse();
  const storedBudgets = parsedFilters.limit
    ? await budgetsCollection.limit(parsedFilters.limit).toArray()
    : await budgetsCollection.toArray();
  const storedBudgetWithRelations = await Promise.all(
    storedBudgets.map(transformBudgetWithRelationsResponse)
  );

  return successResponse({
    data: TransformedBudgetWithRelationsSchema.array().parse(storedBudgetWithRelations),
    message: "Successfully retrieved budgets",
  });
}

export async function getBudgetDetail(budgetId: string) {
  const storedBudget = await getBudgetById(budgetId);
  const transformedBudget = await transformBudgetWithRelationsResponse(storedBudget);

  return successResponse({
    data: TransformedBudgetWithRelationsSchema.parse(transformedBudget),
    message: "Successfully retrieved a budget",
  });
}

export async function createBudget(payload: CreateBudget) {
  const data = CreateBudgetSchema.parse(payload);
  const newBudgets = data.budgets.map<Budget>(budget => ({
    id: nanoid(),
    name: budget.name,
    balance: budget.balance,
    total_balance: budget.balance,
    wallet_id: budget.wallet.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  }));
  const newEmptyBudgets = newBudgets.map<Budget>(budget => ({
    ...budget,
    balance: 0,
  }));

  await db.transaction("rw", db.wallet, db.budget, db.transfer, db.record, async () => {
    const createdBudgetsId = await db.budget.bulkAdd(newEmptyBudgets, { allKeys: true });

    for (const budgetId of createdBudgetsId) {
      const createdBudget = (await getSourceOrDestinationById(budgetId, "BUDGET")) as Budget;
      const relatedWallet = (await getSourceOrDestinationById(
        createdBudget.wallet_id,
        "WALLET"
      )) as Wallet;

      await commitTransfer({
        amount: newBudgets.find(budget => budget.id === budgetId)?.balance ?? 0,
        fee: 0,
        note: `Budgeting for ${createdBudget.name}`,
        source: relatedWallet,
        destination: createdBudget,
      });
    }
  });

  return successResponse({
    data: BudgetSchema.parse(newBudgets[newBudgets.length - 1]),
    message: "Successfully create a budget",
  });
}

export async function deleteBudget(budgetId: string) {
  const budgetRecords = await db.record.where("source_id").equals(budgetId).toArray();
  const storedBudgetById = await getBudgetById(budgetId);

  if (budgetRecords.length > 0) {
    throw new Error("Unable to delete budget. The budget is already in use.");
  }

  await db.transaction("rw", db.budget, db.wallet, db.transfer, db.record, async () => {
    const storedWalletById = await getWalletById(storedBudgetById.wallet_id);

    await commitTransfer({
      amount: storedBudgetById.total_balance,
      fee: 0,
      note: `Budget deletion and refund from ${storedBudgetById.name} budget`,
      source: storedBudgetById,
      destination: storedWalletById,
    });

    await db.budget.delete(budgetId);
  });

  return successResponse({
    data: BudgetSchema.parse(storedBudgetById),
    message: "Successfully delete the budget",
  });
}

export async function updateBudgetBalanceDetail(budgetId: string, payload: UpdateBudgetBalance) {
  const data = UpdateBudgetBalanceSchema.parse(payload);
  const storedBudgetById = await getBudgetById(budgetId);

  await db.transaction("rw", db.budget, db.wallet, db.transfer, db.record, async () => {
    const storedWalletById = await getWalletById(storedBudgetById.wallet_id);

    await match(data.type)
      .with("REFUND", async () => {
        if (data.balance > storedBudgetById.balance) {
          throw new Error(
            "Unable to refund. The refunded balance exceeds the remaining budget balance."
          );
        }

        await commitTransfer({
          amount: data.balance,
          fee: 0,
          note: `Refund from ${storedBudgetById.name} budget`,
          source: storedBudgetById,
          destination: storedWalletById,
        });

        await updateBudgetById(budgetId, budget => {
          if (budget.balance <= 0) {
            budget.archived_at = new Date().toISOString();
          }
        });
      })
      .with("ADD", async () => {
        if (data.balance > storedWalletById.balance) {
          throw new Error("Unable to add balance. The added balance exceeds the wallet balance.");
        }

        const balanceAfterAdding = data.balance + storedBudgetById.balance;
        if (balanceAfterAdding > storedBudgetById.total_balance) {
          throw new Error(
            `Unable to add balance. The remaining balance after adding (${formatCurrency(balanceAfterAdding)}) exceed the total budget balance (${formatCurrency(storedBudgetById.total_balance)})`
          );
        }

        await commitTransfer({
          amount: data.balance,
          fee: 0,
          note: `Add ${storedBudgetById.name} budget balance`,
          source: storedWalletById,
          destination: storedBudgetById,
        });
      })
      .exhaustive();
  });

  return successResponse({
    data: BudgetSchema.parse(storedBudgetById),
    message: "Successfully update the budget balance",
  });
}

export async function activateBudget(budgetId: string) {
  const storedBudgetById = await getBudgetById(budgetId);
  const storedWalletById = await getWalletById(storedBudgetById.wallet_id);

  if (!storedBudgetById.archived_at) {
    throw new Error("Unable to activate currently running budget");
  }

  if (storedWalletById.balance < storedBudgetById.total_balance) {
    throw new Error(
      `Unable to activate budget due to insufficient balance of ${storedWalletById.name} wallet`
    );
  }

  await db.transaction("rw", db.budget, db.wallet, db.transfer, db.record, async () => {
    await updateBudgetById(budgetId, budget => {
      budget.archived_at = null;
    });
    await commitTransfer({
      amount: storedBudgetById.total_balance,
      fee: 0,
      note: `Add ${storedBudgetById.name} budget balance`,
      source: storedWalletById,
      destination: storedBudgetById,
    });
  });

  return successResponse({
    data: BudgetSchema.parse(storedBudgetById),
    message: "Successfully reactivate the budget",
  });
}
