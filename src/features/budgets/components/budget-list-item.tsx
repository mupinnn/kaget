import { Link } from "@tanstack/react-router";
import { formatCurrency } from "@/utils/common.util";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TransformedBudget } from "../data/budgets.schema";

export type BudgetListItemProps = TransformedBudget;

export const BudgetListItem = (props: BudgetListItemProps) => {
  return (
    <Link to="/budgets/$budgetId" params={{ budgetId: props.id }} className="no-underline">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{props.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Progress value={props.remaining_balance_percentage} />
          <div className="inline-flex items-center gap-2">
            <div className="h-3 w-3 bg-primary" />
            <span className="text-xs">Remaining : {formatCurrency(props.remaining_balance)}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <div className="h-3 w-3 bg-primary/20" />
            <span className="text-xs">Used : {formatCurrency(props.used_balance)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};