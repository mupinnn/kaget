import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/common.util";

export interface WalletCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  balance: number;
}

export const WalletCard = React.forwardRef<HTMLDivElement, WalletCardProps>(
  ({ name, balance, ...props }, ref) => (
    <Card ref={ref} {...props}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
      </CardContent>
    </Card>
  )
);
WalletCard.displayName = "WalletCard";
