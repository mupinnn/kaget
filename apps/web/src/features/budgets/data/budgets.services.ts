import { getWalletList } from "@/features/wallets/data/wallets.services";
import { api } from "@/libs/api.lib";
import { unwrap } from "@/utils/api.util";
import type {
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
  const budgets = await unwrap(
    api.api.budgets.$get({
      query:
        query.archived === undefined
          ? {}
          : { archived: query.archived ? ("true" as const) : ("false" as const) },
    })
  );

  const withWallets = await attachWallets(budgets);

  if (query.limit) {
    return withWallets.slice(0, query.limit);
  }

  return withWallets;
}

export async function getBudgetDetail(budgetId: string): Promise<BudgetWithWallet> {
  const budget = await unwrap(api.api.budgets[":id"].$get({ param: { id: budgetId } }));
  const [withWallet] = await attachWallets([budget]);
  return withWallet;
}

export async function createBudget(payload: CreateBudget) {
  return unwrap(
    api.api.budgets.bulk.$post({
      json: {
        budgets: payload.budgets.map(budget => ({
          name: budget.name,
          wallet_id: budget.wallet.id,
          amount: budget.balance,
          budget_type: "BUDGET" as const,
        })),
      },
    })
  );
}

export async function updateBudgetBalanceDetail(budgetId: string, payload: UpdateBudgetBalance) {
  if (payload.type === "ADD") {
    return unwrap(
      api.api.budgets[":id"]["add-funds"].$post({
        param: { id: budgetId },
        json: { amount: payload.balance },
      })
    );
  }

  return unwrap(
    api.api.budgets[":id"].refund.$post({
      param: { id: budgetId },
      json: { amount: payload.balance },
    })
  );
}

export async function activateBudget(budgetId: string) {
  return unwrap(
    api.api.budgets[":id"].reactivate.$post({
      param: { id: budgetId },
      json: { use_same_amount: true },
    })
  );
}
