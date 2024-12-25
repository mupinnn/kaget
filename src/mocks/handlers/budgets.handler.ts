import { http } from "msw";
import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";
import { NotFoundError, UnprocessableEntityError } from "@/utils/error.util";
import {
  Budget,
  BudgetsRequestQuerySchema,
  CreateBudgetSchema,
  RefundBudgetSchema,
  TransformedBudgetWithRelations,
} from "@/features/budgets/data/budgets.schema";
import { Wallet } from "@/features/wallets/data/wallets.schema";
import { createTransfer } from "./transfers.handler";
import { getSourceOrDestinationById } from "./records.handler";
import { getWalletById } from "./wallets.handler";

export async function getBudgetById(budgetId: string) {
  const storedBudgetById = await db.budget.get(budgetId);

  if (!storedBudgetById) throw new NotFoundError("Budget not found");

  return storedBudgetById;
}

export async function getBudgetItemById(budgetItemId: string) {
  const storedBudgetItemById = await db.budget_item.get(budgetItemId);

  if (!storedBudgetItemById) throw new NotFoundError("Budget item not found");

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
    wallet: storedWalletById,
  };
}

export const budgetsHandler = [
  http.get("/api/v1/budgets", async ({ request }) => {
    try {
      const rawFilters = Object.fromEntries(new URL(request.url).searchParams);
      const parsedFilters = BudgetsRequestQuerySchema.parse(rawFilters);

      const budgetsCollection = db.budget.orderBy("updated_at").reverse();
      const storedBudgets = parsedFilters.limit
        ? await budgetsCollection.limit(parsedFilters.limit).toArray()
        : await budgetsCollection.toArray();

      return mockSuccessResponse({
        data: await Promise.all(storedBudgets.map(transformBudgetWithRelationsResponse)),
        message: "Successfully retrieved budgets",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.get("/api/v1/budgets/:budgetId", async ({ params }) => {
    try {
      const storedBudget = await getBudgetById(params.budgetId as string);
      const transformedBudget = await transformBudgetWithRelationsResponse(storedBudget);

      return mockSuccessResponse({
        data: transformedBudget,
        message: "Successfully retrieved a budget",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.post("/api/v1/budgets", async ({ request }) => {
    try {
      const data = CreateBudgetSchema.parse(await request.json());
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

          await createTransfer({
            amount: newBudgets.find(budget => budget.id === budgetId)?.balance ?? 0,
            fee: 0,
            note: `Budgeting for ${createdBudget.name}`,
            source: relatedWallet,
            destination: createdBudget,
          });
        }
      });

      return mockSuccessResponse({
        data: newBudgets[newBudgets.length - 1],
        message: "Successfully create a budget",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.delete("/api/v1/budgets/:budgetId", async ({ params }) => {
    try {
      const budgetId = params.budgetId as string;
      const budgetRecords = await db.record.where("source_id").equals(budgetId).toArray();
      const storedBudgetById = await getBudgetById(budgetId);

      if (budgetRecords.length > 0) {
        throw new UnprocessableEntityError(
          "Unable to delete budget. The budget is already in use."
        );
      }

      await db.transaction("rw", db.budget, db.wallet, db.transfer, db.record, async () => {
        const storedWalletById = await getWalletById(storedBudgetById.wallet_id);

        await createTransfer({
          amount: storedBudgetById.total_balance,
          fee: 0,
          note: `Budget deletion and refund from ${storedBudgetById.name} budget`,
          source: storedBudgetById,
          destination: storedWalletById,
        });

        await db.budget.delete(budgetId);
      });

      return mockSuccessResponse({ data: storedBudgetById, message: "Successfully delete budget" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.patch("/api/v1/budgets/:budgetId/refund", async ({ params, request }) => {
    try {
      const budgetId = params.budgetId as string;
      const data = RefundBudgetSchema.parse(await request.json());
      const storedBudgetById = await getBudgetById(budgetId);

      await db.transaction("rw", db.budget, db.wallet, db.transfer, db.record, async () => {
        const storedWalletById = await getWalletById(storedBudgetById.wallet_id);

        if (data.balance > storedBudgetById.balance) {
          throw new UnprocessableEntityError(
            "Unable to refund. The refunded balance exceeds the remaining budget balance."
          );
        }

        await createTransfer({
          amount: data.balance,
          fee: 0,
          note: `Refund from ${storedBudgetById.name} budget`,
          source: storedBudgetById,
          destination: storedWalletById,
        });

        await updateBudgetById(budgetId, budget => {
          budget.total_balance -= data.balance;
        });
      });

      return mockSuccessResponse({
        data: storedBudgetById,
        message: "Successfully refund the budget",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
