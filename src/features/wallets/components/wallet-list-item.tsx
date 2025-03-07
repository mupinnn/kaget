import { Link } from "@tanstack/react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HidableBalance } from "@/components/hidable-balance";
import { type Wallet } from "../data/wallets.schemas";

export type WalletListItemProps = Wallet;

export const WalletListItem = (props: WalletListItemProps) => {
  return (
    <Link to="/wallets/$walletId" params={{ walletId: props.id }} className="no-underline">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal">{props.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            <HidableBalance value={props.balance} />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
