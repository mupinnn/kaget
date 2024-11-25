import { Link } from "@tanstack/react-router";
import { PlusIcon, WalletIcon } from "lucide-react";
import { P, match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageLayout } from "@/components/page-layout";
import { useBudgetsQuery } from "../data/budgets.queries";

const loaders = Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} className="h-24 w-full" />
));

export function BudgetsIndexPage() {
  const budgetsQuery = useBudgetsQuery();

  return (
    <PageLayout title="Budgets" subtitle="Plan and maintain your money allocation with ease.">
      <Button asChild className="no-underline">
        <Link to="/wallets/create">
          <PlusIcon />
          Allocate new budget
        </Link>
      </Button>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {match(budgetsQuery)
          .with({ isPending: true }, () => loaders)
          .with({ isError: true }, () => <p>An error occured</p>)
          .with({ data: P.select(P.when(data => data.data.length === 0)) }, () => (
            <EmptyState
              title="No budget created"
              description="You have not added any budgets. Allocate one above."
              icon={WalletIcon}
            />
          ))
          .otherwise(() =>
            budgetsQuery.data?.data.map(budget => (
              <Link
                to="/wallets/$walletId"
                params={{ walletId: budget.id }}
                key={budget.id}
                className="no-underline"
              >
                {budget.name}
              </Link>
            ))
          )}
      </div>
    </PageLayout>
  );
}
