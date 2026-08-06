import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { DebtLoanList, DebtLoanListLoader } from "../components/debt-loan-list";
import { useDebtLoansQuery } from "../data/debt-loans.queries";

function DebtLoansQueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm">
      Couldn&apos;t load debts and loans.{" "}
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

export function DebtLoansIndexPage() {
  const debtLoansQuery = useDebtLoansQuery();
  const hasItems = (debtLoansQuery.data?.length ?? 0) > 0;

  return (
    <PageLayout title="Debts & Loans" subtitle="Money you owe or lent — tracked on this device.">
      {match(debtLoansQuery)
        .with({ isPending: true }, () => <DebtLoanListLoader />)
        .with({ isError: true }, () => (
          <DebtLoansQueryError onRetry={() => void debtLoansQuery.refetch()} />
        ))
        .otherwise(query => (
          <>
            {hasItems ? (
              <Button asChild className="no-underline" size="sm">
                <Link to="/debts-loans/create">
                  <PlusIcon />
                  New debt or loan
                </Link>
              </Button>
            ) : null}

            <DebtLoanList data={query.data} />
          </>
        ))}
    </PageLayout>
  );
}
