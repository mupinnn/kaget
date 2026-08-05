import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { WalletList, WalletListLoader } from "../components/wallet-list";
import { useWalletsQuery } from "../data/wallets.queries";

function WalletsQueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm sm:col-span-2 xl:col-span-4">
      Couldn&apos;t load wallets.{" "}
      <button
        type="button"
        className="font-medium text-foreground underline-offset-4 hover:underline"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  );
}

export function WalletsIndexPage() {
  const walletsQuery = useWalletsQuery();
  const hasWallets = (walletsQuery.data?.length ?? 0) > 0;

  return (
    <PageLayout title="Wallets" subtitle="Money holders on this device — cash, bank, or e-wallet.">
      {hasWallets ? (
        <Button asChild className="no-underline" size="sm">
          <Link to="/wallets/create">
            <PlusIcon />
            Create new wallet
          </Link>
        </Button>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="wallet-list">
        {match(walletsQuery)
          .with({ isPending: true }, () => <WalletListLoader />)
          .with({ isError: true }, () => (
            <WalletsQueryError onRetry={() => void walletsQuery.refetch()} />
          ))
          .otherwise(query => (
            <WalletList data={query.data} />
          ))}
      </div>
    </PageLayout>
  );
}
