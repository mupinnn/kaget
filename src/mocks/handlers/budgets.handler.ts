import { http } from "msw";
import { nanoid } from "nanoid";
import { db } from "@/libs/db.lib";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";
import { Budget, CreateBudgetSchema, WalletBudget } from "@/features/budgets/data/budgets.schema";
import { NotFoundError } from "@/utils/error.util";

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

export const budgetsHandler = [
  http.get("/api/v1/budgets", async () => {
    try {
      const storedBudgets = await db.budget.toArray();

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
      const newBudget: Budget = {
        id: nanoid(),
        name: data.name,
        allocated_cash_balance: data.allocated_cash_balance,
        allocated_digital_balance: data.allocated_digital_balance,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const newWalletBudgetRelation: WalletBudget[] = [];

      if (data.cash_wallet) {
        newWalletBudgetRelation.push({
          id: nanoid(),
          wallet_id: data.cash_wallet.id,
          budget_id: newBudget.id,
        });
      }

      if (data.digital_wallet) {
        newWalletBudgetRelation.push({
          id: nanoid(),
          wallet_id: data.digital_wallet.id,
          budget_id: newBudget.id,
        });
      }

      // TODO: reduce wallet balance
      // TODO: record balance deduction as transfer

      await db.transaction("rw", db.budget, db.wallet_budget, async () => {
        await db.budget.add(newBudget);
        await db.wallet_budget.bulkAdd(newWalletBudgetRelation);
      });

      return mockSuccessResponse({ data: newBudget, message: "Successfully create a budget" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
