import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WalletIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletListItem } from "./wallet-list-item";
import { type Wallet } from "../data/wallets.schemas";

export const WalletListLoader = () => {
  return Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />);
};

export interface WalletListProps {
  data: Wallet[];
  emptyMessageTitle?: string;
  emptyMessageDescription?: string;
}

export const WalletList = ({
  data,
  emptyMessageTitle = "No wallet created",
  emptyMessageDescription = "Create your first wallet to start tracking your cashflow!",
}: WalletListProps) => {
  if (data.length > 0) {
    return data.map(wallet => <WalletListItem key={wallet.id} {...wallet} />);
  }

  return (
    <EmptyState
      className="w-full sm:col-span-2 xl:col-span-4"
      title={emptyMessageTitle}
      description={emptyMessageDescription}
      icon={WalletIcon}
      actions={
        <Button asChild className="no-underline">
          <Link to="/wallets/create">Create a wallet</Link>
        </Button>
      }
    />
  );
};
