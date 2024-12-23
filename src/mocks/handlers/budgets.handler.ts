import { http } from "msw";
import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";
import { NotFoundError } from "@/utils/error.util";
import {
  Budget,
  BudgetsRequestQuerySchema,
  CreateBudgetSchema,
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
        data: storedBudgets,
        message: "Successfully retrieved budgets",
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
        wallet_id: budget.wallet.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
