import { Link } from "@tanstack/react-router";
import { HidableBalance } from "@/components/hidable-balance";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type BudgetWithWallet, getRemainingBalancePercentage } from "../data/budgets.schemas";

export type BudgetListItemProps = BudgetWithWallet;

export function BudgetListItem(props: BudgetListItemProps) {
  return (
    <Link to="/budgets/$budgetId" params={{ budgetId: props.id }} className="no-underline">
      <Card className="h-full gap-0 py-3 transition-colors hover:bg-muted/40">
        <CardHeader className="gap-1.5 px-3 pb-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {props.archivedAt ? (
              <Badge variant="destructive" className="rounded-md font-normal">
                Archived
              </Badge>
            ) : null}
            <Badge variant="secondary" className="rounded-md font-normal">
              {props.wallet.name}
            </Badge>
          </div>
          <CardTitle className="truncate font-medium text-sm leading-tight">{props.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-3 pt-0">
          <Progress value={getRemainingBalancePercentage(props)} className="h-1.5" />
          <p className="font-semibold text-xl tabular-nums tracking-tight">
            <HidableBalance value={props.balance} />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
