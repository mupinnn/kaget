import {
  createDebtLoanSchema,
  listDebtLoansQuerySchema,
  updateDebtLoanSchema,
} from "@kaget/api/schemas";
import type { InferResponseType } from "hono/client";
import type { z } from "zod";
import { api } from "@/libs/api.lib";

export type DebtLoanListItem = InferResponseType<
  (typeof api.api)["debts-loans"]["$get"],
  200
>["data"]["debt_loans"][number];

export type DebtLoanDetail = InferResponseType<
  (typeof api.api)["debts-loans"][":id"]["$get"],
  200
>["data"];

export type DebtLoansRequestQuery = z.infer<typeof listDebtLoansQuerySchema>;

export { createDebtLoanSchema, updateDebtLoanSchema };

export type CreateDebtLoan = z.infer<typeof createDebtLoanSchema>;
export type UpdateDebtLoan = z.infer<typeof updateDebtLoanSchema>;

export function getDebtLoanStatus(debtLoan: { resolvedAt: string | Date | null }) {
  return debtLoan.resolvedAt ? "RESOLVED" : "PENDING";
}
