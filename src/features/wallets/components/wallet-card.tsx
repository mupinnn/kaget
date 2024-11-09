import * as React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/common.util";

export interface WalletCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  totalBalance: number;
}

export const WalletCard = React.forwardRef<HTMLDivElement, WalletCardProps>(
  ({ name, totalBalance, ...props }, ref) => (
    <Card ref={ref} {...props}>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{formatCurrency(totalBalance)}</CardDescription>
      </CardHeader>
    </Card>
  )
);
WalletCard.displayName = "WalletCard";
