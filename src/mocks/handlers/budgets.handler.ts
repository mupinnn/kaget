import { http } from "msw";
import { db } from "@/libs/db.lib";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";
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
  http.get("/api/v1/budgets", () => {
    try {
      const storedBudgets: string[] = [];

      return mockSuccessResponse({
        data: storedBudgets,
        message: "Successfully retrieved budgets",
      });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),

  http.post("/api/v1/budgets", () => {
    try {
      return mockSuccessResponse({ data: { id: 1 }, message: "Successfully create a budget" });
    } catch (error) {
      return mockErrorResponse(error);
    }
  }),
];
