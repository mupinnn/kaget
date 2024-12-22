import { Link } from "@tanstack/react-router";
import { formatCurrency } from "@/utils/common.util";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Budget } from "../data/budgets.schema";

export type BudgetListItemProps = Budget;

export const BudgetListItem = (props: BudgetListItemProps) => {
  return (
    <Link to=".." className="no-underline">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal">{props.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(props.balance)}</p>
        </CardContent>
      </Card>
    </Link>
  );
};
