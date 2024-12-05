import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/page-layout";
import { useTransfersQuery } from "../data/transfers.queries";
import { TransferList, TransferListLoader } from "../components/transfer-list";

export function TransfersIndexPage() {
  const transfersQuery = useTransfersQuery();

  return (
    <PageLayout title="Transfers" subtitle="Move fund between your wallet.">
      <Button asChild className="no-underline">
        <Link to="/transfers/create">
          <PlusIcon />
          Transfer balance
        </Link>
      </Button>

      {match(transfersQuery)
        .with({ isPending: true }, () => <TransferListLoader />)
        .with({ isError: true }, () => <p>An error occured</p>)
        .otherwise(transfersQuery => (
          <TransferList data={transfersQuery.data.data} />
        ))}
    </PageLayout>
  );
}
