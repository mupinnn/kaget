import { Link } from "@tanstack/react-router";
import { HandCoinsIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DebtLoanListItem as DebtLoanListItemType } from "../data/debt-loans.schemas";
import { DebtLoanListItem } from "./debt-loan-list-item";

export function DebtLoanListLoader() {
  return (
    <div className="divide-y">
      {["a", "b", "c", "d", "e"].map(id => (
        <div key={id} className="py-2.5">
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export type DebtLoanListProps = {
  data?: DebtLoanListItemType[];
};

export function DebtLoanList({ data = [] }: DebtLoanListProps) {
  if (data.length > 0) {
    return (
      <div className="divide-y">
        {data.map(debtLoan => (
          <DebtLoanListItem key={debtLoan.id} {...debtLoan} />
        ))}
      </div>
    );
  }

  return (
    <EmptyState
      className="p-4"
      title="No debts or loans yet"
      description="Track money you owe or lent — balances update on this device."
      icon={HandCoinsIcon}
      actions={
        <Button asChild className="no-underline" size="sm">
          <Link to="/debts-loans/create">New debt or loan</Link>
        </Button>
      }
    />
  );
}
