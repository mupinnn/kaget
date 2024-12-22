import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/page-layout";
import { useBudgetsQuery } from "../data/budgets.queries";
import { BudgetList, BudgetListLoader } from "../components/budget-list";

export function BudgetsIndexPage() {
  const budgetsQuery = useBudgetsQuery();

  return (
    <PageLayout title="Budgets" subtitle="Plan and maintain your budget with ease">
      {budgetsQuery.data?.data && budgetsQuery.data.data.length > 0 ? (
        <Button asChild className="no-underline">
          <Link to="/budgets/create">
            <PlusIcon />
            Create new allocation
          </Link>
        </Button>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {match(budgetsQuery)
          .with({ isPending: true }, () => <BudgetListLoader />)
          .with({ isError: true }, () => <p>An error occured</p>)
          .otherwise(budgetsQuery => (
            <BudgetList data={budgetsQuery.data.data} />
          ))}
      </div>
    </PageLayout>
  );
}
