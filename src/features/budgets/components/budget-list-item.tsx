import { Link } from "@tanstack/react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HidableBalance } from "@/components/hidable-balance";
import { type TransformedBudgetWithRelations } from "../data/budgets.schemas";

export type BudgetListItemProps = TransformedBudgetWithRelations;

export const BudgetListItem = (props: BudgetListItemProps) => {
  return (
    <Link to="/budgets/$budgetId" params={{ budgetId: props.id }} className="no-underline">
      <Card>
        <CardHeader className="pb-2">
          <div className="inline-flex items-center gap-1">
            {props.archived_at && (
              <Badge variant="destructive" className="mr-1">
                Archived
              </Badge>
            )}
            <Badge variant="secondary" className="mr-1">
              {props.wallet.name}
            </Badge>
          </div>
          <CardTitle>{props.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-nowrap">
          <Progress value={props.remaining_balance_percentage} />
          <div className="inline-flex items-center gap-2 text-xs">
            <div className="h-3 w-3 bg-primary" />
            <HidableBalance value={props.remaining_balance} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
