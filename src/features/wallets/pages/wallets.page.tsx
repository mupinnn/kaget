import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/page-layout";
import { useWalletsQuery } from "../data/wallets.queries";
import { WalletList, WalletListLoader } from "../components/wallet-list";

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
          .with({ isPending: true }, () => <WalletListLoader />)
          .with({ isError: true }, () => <p>An error occured</p>)
          .otherwise(walletsQuery => (
            <WalletList data={walletsQuery.data.data} />
          ))}
      </div>
    </PageLayout>
  );
}
