import { http } from "msw";
import { db } from "@/libs/db.lib";
import { mockErrorResponse, mockSuccessResponse } from "@/utils/mock.util";

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
];
