import { match } from "ts-pattern";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { Trash2Icon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLayout } from "@/components/page-layout";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useRecordsQuery } from "@/features/records/data/records.queries";
import { useTransfersQuery } from "@/features/transfers/data/transfers.queries";
import { TransferList, TransferListLoader } from "@/features/transfers/components/transfer-list";
import { RecordList, RecordListLoader } from "@/features/records/components/record-list";
import { HidableBalance } from "@/components/hidable-balance";
import { useDeleteWalletMutation } from "../data/wallets.mutations";
import { useWalletDetailQuery } from "../data/wallets.queries";

const route = getRouteApi("/_app/wallets/$walletId");

export function WalletsDetailPage() {
  const { walletId } = route.useParams();
  const navigate = useNavigate();
  const walletDetailQuery = useWalletDetailQuery(walletId);
  const recordsQuery = useRecordsQuery({ source_id: walletId });
  const transfersQuery = useTransfersQuery({ source_id: walletId });
  const deleteWalletMutation = useDeleteWalletMutation();

  if (walletDetailQuery.isPending) return <p>Loading . . .</p>;
  if (walletDetailQuery.isError) return <p>An error occured: {walletDetailQuery.error.message}</p>;

  const handleDeleteWallet = () => {
    deleteWalletMutation.mutate(walletId, {
      async onSuccess() {
        await navigate({ to: "/wallets" });
      },
    });
  };

  return (
    <PageLayout
      title={walletDetailQuery.data.data.name}
      subtitle={
        <p className="text-lg text-muted-foreground">
          <HidableBalance value={walletDetailQuery.data.data.balance} />
        </p>
      }
    >
      <div className="flex items-center gap-2">
        <Button asChild className="no-underline" size="sm">
          <Link to="/wallets/$walletId/edit" params={{ walletId }}>
            <PencilIcon />
            Edit
          </Link>
        </Button>
        <ConfirmationDialog
          title={<>Are you sure want to delete {walletDetailQuery.data.data.name} wallet?</>}
          description="This action cannot be undone. This will permanently delete your wallet and remove others associated data (records, budget, etc)"
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2Icon />
              Delete
            </Button>
          }
          actionLabel="Yes, delete"
          onClickAction={handleDeleteWallet}
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
