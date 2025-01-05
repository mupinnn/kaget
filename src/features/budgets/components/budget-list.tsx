import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BanknoteIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetListItem } from "./budget-list-item";
import { type TransformedBudgetWithRelations } from "../data/budgets.schemas";

export const BudgetListLoader = () => {
  return Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />);
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
