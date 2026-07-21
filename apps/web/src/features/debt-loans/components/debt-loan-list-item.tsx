import { Link } from "@tanstack/react-router";
import { HidableBalance } from "@/components/hidable-balance";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/utils/date.util";
import type { DebtLoanListItem as DebtLoanListItemData } from "../data/debt-loans.schemas";
import { getDebtLoanStatus } from "../data/debt-loans.schemas";

export type DebtLoanListItemProps = DebtLoanListItemData;

export const DebtLoanListItem = (props: DebtLoanListItemProps) => {
  const status = getDebtLoanStatus(props);

  return (
    <Link to="/debts-loans/$debtLoanId" params={{ debtLoanId: props.id }} className="no-underline">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Badge variant={props.type === "DEBT" ? "default" : "secondary"}>{props.type}</Badge>
            <Badge variant={status === "PENDING" ? "outline" : "destructive"}>{status}</Badge>
          </div>
          <CardTitle>{props.otherParty}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-bold text-xl">
            <HidableBalance value={props.amount} />
          </p>
          <p className="text-muted-foreground text-xs">
            {formatDate(props.occurredAt, { dateStyle: "medium" })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
