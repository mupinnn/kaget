import { Link } from "@tanstack/react-router";
import { PlusIcon, WalletIcon } from "lucide-react";
import { P, match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageLayout } from "@/components/page-layout";
import { WalletCard } from "../components/wallet-card";
import { useWalletsQuery } from "../data/wallets.queries";

const loaders = Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} className="h-24 w-full" />
));

export function WalletsIndexPage() {
  const walletsQuery = useWalletsQuery();

  return (
    <PageLayout title="Wallets" subtitle="Manage your wallets. Hassle-free">
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
              <Link
                to="/wallets/$walletId"
                params={{ walletId: wallet.id }}
                key={wallet.id}
                className="no-underline"
              >
                <WalletCard name={wallet.name} balance={wallet.balance} />
              </Link>
            ))
          )}
      </div>
    </PageLayout>
  );
}
