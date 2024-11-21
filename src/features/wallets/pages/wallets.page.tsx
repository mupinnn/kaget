import { Link } from "@tanstack/react-router";
import { PlusIcon, WalletIcon } from "lucide-react";
import { P, match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { WalletCard } from "../components/wallet-card";
import { useWallets } from "../data/wallets.queries";

const loaders = Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} className="h-24 w-full" />
));

export function WalletsIndexPage() {
  const walletsQuery = useWallets();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Wallets</h1>
        <p className="text-sm text-muted-foreground">Manage your wallets. Hassle-free.</p>
      </div>

      <Button asChild className="no-underline">
        <Link to="/wallets/create">
          <PlusIcon />
          Create new wallet
        </Link>
      </Button>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {match(walletsQuery)
          .with({ isPending: true }, () => loaders)
          .with({ isError: true }, () => <p>An error occured</p>)
          .with({ data: P.select(P.when(data => data.data.length === 0)) }, () => (
            <EmptyState
              title="No wallet created"
              description="You have not added any wallets. Add one above."
              icon={WalletIcon}
            />
          ))
          .otherwise(() =>
            walletsQuery.data?.data.map(wallet => (
              <WalletCard key={wallet.id} name={wallet.name} balance={wallet.balance} />
            ))
          )}
      </div>
    </div>
  );
}
