import { db } from "@/libs/db.lib";
import { type Budget } from "./budgets.schemas";

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
