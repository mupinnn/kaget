import { Link } from "@tanstack/react-router";
import { HidableBalance } from "@/components/hidable-balance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Wallet } from "../data/wallets.schemas";

export type WalletListItemProps = Wallet;

export const WalletListItem = (props: WalletListItemProps) => {
  return (
    <Link to="/wallets/$walletId" params={{ walletId: props.id }} className="no-underline">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-normal text-sm">{props.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-2xl">
            <HidableBalance value={props.balance} />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
