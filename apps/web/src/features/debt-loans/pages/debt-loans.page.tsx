import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { DebtLoanList, DebtLoanListLoader } from "../components/debt-loan-list";
import { useDebtLoansQuery } from "../data/debt-loans.queries";

export function DebtLoansIndexPage() {
  const debtLoansQuery = useDebtLoansQuery();

  return (
    <PageLayout title="Debts & Loans" subtitle="Track money you owe or lent to others">
      {match(debtLoansQuery)
        .with({ isPending: true }, () => <DebtLoanListLoader />)
        .with({ isError: true }, () => <p>An error occured</p>)
        .otherwise(debtLoansQuery => (
          <>
            <Button asChild className="no-underline">
              <Link to="/debts-loans/create">
                <PlusIcon />
                New debt or loan
              </Link>
            </Button>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DebtLoanList data={debtLoansQuery.data} />
            </div>
          </>
        ))}
    </PageLayout>
  );
}
