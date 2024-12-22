import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WalletIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetListItem } from "./budget-list-item";
import { Budget } from "../data/budgets.schema";

export const BudgetListLoader = () => {
  return Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />);
};

export interface BudgetListProps {
  data: Budget[];
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
      icon={WalletIcon}
      actions={
        <Button asChild className="no-underline">
          <Link to="/budgets/create">Allocate money</Link>
        </Button>
      }
    />
  );
};
