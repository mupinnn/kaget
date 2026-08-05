import { Link } from "@tanstack/react-router";
import { BanknoteIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { BudgetWithWallet } from "../data/budgets.schemas";
import { BudgetListItem } from "./budget-list-item";

export function BudgetListLoader() {
  return ["a", "b", "c", "d", "e"].map(id => (
    <Skeleton key={id} className="h-[6.5rem] w-full rounded-lg" />
  ));
}

export interface BudgetListProps {
  data: BudgetWithWallet[];
  emptyMessageTitle?: string;
  emptyMessageDescription?: string;
}

export function BudgetList({
  data,
  emptyMessageTitle = "No budgets yet",
  emptyMessageDescription = "Move money from a wallet into an envelope so spending stays intentional.",
}: BudgetListProps) {
  if (data.length > 0) {
    return data.map(budget => <BudgetListItem key={budget.id} {...budget} />);
  }

  return (
    <EmptyState
      className="w-full p-4 sm:col-span-2 xl:col-span-4"
      title={emptyMessageTitle}
      description={emptyMessageDescription}
      icon={BanknoteIcon}
      actions={
        <Button asChild className="no-underline" size="sm">
          <Link to="/budgets/create">Allocate money</Link>
        </Button>
      }
    />
  );
}
