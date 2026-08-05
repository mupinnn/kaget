import { Link } from "@tanstack/react-router";
import { HidableBalance } from "@/components/hidable-balance";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WALLET_TYPE_LABEL, type Wallet } from "../data/wallets.schemas";

export type WalletListItemProps = Wallet;

export function WalletListItem(props: WalletListItemProps) {
  return (
    <Link to="/wallets/$walletId" params={{ walletId: props.id }} className="no-underline">
      <Card className="h-full gap-0 py-3 transition-colors hover:bg-muted/40">
        <CardHeader className="gap-1.5 px-3 pb-1.5">
          <Badge variant="secondary" className="rounded-md font-normal">
            {WALLET_TYPE_LABEL[props.type]}
          </Badge>
          <CardTitle className="truncate font-medium text-sm leading-tight">{props.name}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pt-0">
          <p className="font-semibold text-xl tabular-nums tracking-tight">
            <HidableBalance value={props.balance} />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
