import { Link } from "@tanstack/react-router";
import { WalletIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Wallet } from "../data/wallets.schemas";
import { WalletListItem } from "./wallet-list-item";

export function WalletListLoader() {
  return ["a", "b", "c", "d", "e"].map(id => (
    <Skeleton key={id} className="h-[5.5rem] w-full rounded-lg" />
  ));
}

export interface WalletListProps {
  data: Wallet[];
  emptyMessageTitle?: string;
  emptyMessageDescription?: string;
}

export function WalletList({
  data,
  emptyMessageTitle = "No wallets yet",
  emptyMessageDescription = "Add a wallet on this device to hold cash, bank, or e-wallet balances.",
}: WalletListProps) {
  if (data.length > 0) {
    return data.map(wallet => <WalletListItem key={wallet.id} {...wallet} />);
  }

  return (
    <EmptyState
      className="w-full p-4 sm:col-span-2 xl:col-span-4"
      title={emptyMessageTitle}
      description={emptyMessageDescription}
      icon={WalletIcon}
      actions={
        <Button asChild className="no-underline" size="sm">
          <Link to="/wallets/create">Create a wallet</Link>
        </Button>
      }
    />
  );
}
