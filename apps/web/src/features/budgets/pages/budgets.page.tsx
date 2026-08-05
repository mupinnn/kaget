import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { BudgetList, BudgetListLoader } from "../components/budget-list";
import { useBudgetsQuery } from "../data/budgets.queries";

function BudgetsQueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm sm:col-span-2 xl:col-span-4">
      Couldn&apos;t load budgets.{" "}
      <button
        type="button"
        className="font-medium text-foreground underline-offset-4 hover:underline"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  );
}

export function BudgetsIndexPage() {
  const budgetsQuery = useBudgetsQuery();
  const hasBudgets = (budgetsQuery.data?.length ?? 0) > 0;

  return (
    <PageLayout
      title="Budgets"
      subtitle="Envelopes funded from your wallets — allocate before you spend."
    >
      {hasBudgets ? (
        <Button asChild className="no-underline" size="sm">
          <Link to="/budgets/create">
            <PlusIcon />
            Create new allocation
          </Link>
        </Button>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="budget-list">
        {match(budgetsQuery)
          .with({ isPending: true }, () => <BudgetListLoader />)
          .with({ isError: true }, () => (
            <BudgetsQueryError onRetry={() => void budgetsQuery.refetch()} />
          ))
          .otherwise(query => (
            <BudgetList data={query.data} />
          ))}
      </div>
    </PageLayout>
  );
}
