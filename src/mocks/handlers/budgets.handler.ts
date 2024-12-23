import { http } from "msw";
import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";
import { NotFoundError } from "@/utils/error.util";
import {
  Budget,
  BudgetsRequestQuerySchema,
  CreateBudgetSchema,
  TransformedBudget,
} from "@/features/budgets/data/budgets.schema";
import { Wallet } from "@/features/wallets/data/wallets.schema";
import { createTransfer } from "./transfers.handler";
import { getSourceOrDestinationById } from "./records.handler";

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

function transformBudgetResponse(budget: Budget): TransformedBudget {
  const usedBalance = Math.abs(budget.total_balance - budget.balance);
  const remainingBalance = budget.balance;
  const remainingBalancePercentage = (budget.balance / budget.total_balance) * MAX_PERCENTAGE;
  const usedBalancePercentage = Math.abs(MAX_PERCENTAGE - remainingBalancePercentage);

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
        data: storedBudgets.map(transformBudgetResponse),
        message: "Successfully retrieved budgets",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.get("/api/v1/budgets/:budgetId", async ({ params }) => {
    try {
      const storedBudget = await getBudgetById(params.budgetId as string);
      const transformedBudget = transformBudgetResponse(storedBudget);

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
];
