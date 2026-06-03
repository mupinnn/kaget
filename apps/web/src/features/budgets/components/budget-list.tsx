import { Link } from "@tanstack/react-router";
import { BanknoteIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TransformedBudgetWithRelations } from "../data/budgets.schemas";
import { BudgetListItem } from "./budget-list-item";

export const BudgetListLoader = () => {
  return Array.from({ length: 5 }, (_, i) => i).map(i => (
    <Skeleton key={i} className="h-24 w-full" />
  ));
};

export interface BudgetListProps {
  data: TransformedBudgetWithRelations[];
  emptyMessageTitle?: string;
  emptyMessageDescription?: string;
}

export const BudgetList = ({
  data,
  emptyMessageTitle = "No budget created",
  emptyMessageDescription = "Allocate your money for a specific occasion",
}: BudgetListProps) => {
  if (data.length > 0) {
    return data.map(budget => <BudgetListItem key={budget.id} {...budget} />);
  }

  return (
    <EmptyState
      className="w-full sm:col-span-2 xl:col-span-4"
      title={emptyMessageTitle}
      description={emptyMessageDescription}
      icon={BanknoteIcon}
      actions={
        <Button asChild className="no-underline">
          <Link to="/budgets/create">Allocate money</Link>
        </Button>
      }
    />
  );
};
