import * as React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/common.util";

export interface WalletCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  digitalBalance: number;
  cashBalance: number;
  totalBalance: number;
}

export const WalletCard = React.forwardRef<HTMLDivElement, WalletCardProps>(
  ({ name, totalBalance, cashBalance, digitalBalance, ...props }, ref) => (
    <Card ref={ref} {...props}>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{formatCurrency(totalBalance)}</span>
          <Progress value={80} />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-primary" />
              <span>Digital - {formatCurrency(digitalBalance)} (80%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-primary/20" />
              <span>Cash - {formatCurrency(cashBalance)} (20%)</span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  )
);
WalletCard.displayName = "WalletCard";
