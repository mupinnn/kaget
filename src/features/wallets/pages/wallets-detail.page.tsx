import { match } from "ts-pattern";
import { Link, getRouteApi } from "@tanstack/react-router";
import { formatCurrency } from "@/utils/common.util";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLayout } from "@/components/page-layout";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useRecordsQuery } from "@/features/records/data/records.queries";
import { useTransfersQuery } from "@/features/transfers/data/transfers.queries";
import { TransferList, TransferListLoader } from "@/features/transfers/components/transfer-list";
import { RecordList, RecordListLoader } from "@/features/records/components/record-list";
import { useDeleteWalletMutation } from "../data/wallets.mutations";
import { useWalletDetailQuery } from "../data/wallets.queries";

const route = getRouteApi("/wallets/$walletId");

export function WalletsDetailPage() {
  const { walletId } = route.useParams();
  const walletDetailQuery = useWalletDetailQuery(walletId);
  const recordsQuery = useRecordsQuery({ source_id: walletId });
  const transfersQuery = useTransfersQuery({ source_id: walletId });
  const deleteWalletMutation = useDeleteWalletMutation();

  if (walletDetailQuery.isPending) return <p>Loading . . .</p>;
  if (walletDetailQuery.isError) return <p>An error occured: {walletDetailQuery.error.message}</p>;

  return (
    <PageLayout
      title={walletDetailQuery.data.data.name}
      subtitle={formatCurrency(walletDetailQuery.data.data.balance)}
      subtitleClassName="text-lg"
    >
      <div className="flex items-center gap-2">
        <Button asChild className="no-underline" size="sm">
          <Link to="/wallets/$walletId/edit" params={{ walletId }}>
            Edit
          </Link>
        </Button>
        <ConfirmationDialog
          title={<>Are you sure want to delete {walletDetailQuery.data.data.name} wallet?</>}
          description="This action cannot be undone. This will permanently delete your wallet and remove others associated data (records, budget, etc)"
          trigger={
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          }
          actionLabel="Yes, delete"
          onClickAction={() => deleteWalletMutation.mutate(walletId)}
        />
      </div>

      <Tabs defaultValue="records">
        <TabsList className="grid w-full grid-cols-2 sm:w-96">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>
        <TabsContent value="records">
          {match(recordsQuery)
            .with({ isPending: true }, () => <RecordListLoader />)
            .with({ isError: true }, () => <p>An error occured</p>)
            .otherwise(recordsQuery => (
              <RecordList
                data={recordsQuery.data.data}
                emptyMessageDescription="You have not record any transactions for this wallet"
              />
            ))}
        </TabsContent>
        <TabsContent value="transfers">
          {match(transfersQuery)
            .with({ isPending: true }, () => <TransferListLoader />)
            .with({ isError: true }, () => <p>An error occured</p>)
            .otherwise(transfersQuery => (
              <TransferList
                data={transfersQuery.data.data}
                emptyMessageDescription="You have no transfers for this wallet"
              />
            ))}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
