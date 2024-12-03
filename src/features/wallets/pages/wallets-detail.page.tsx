import { match } from "ts-pattern";
import { Link, getRouteApi } from "@tanstack/react-router";
import { formatCurrency } from "@/utils/common.util";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/page-layout";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useRecordsQuery } from "@/features/records/data/records.queries";
import { RecordList, RecordListLoader } from "@/features/records/components/record-list";
import { useDeleteWalletMutation } from "../data/wallets.mutations";
import { useWalletDetailQuery } from "../data/wallets.queries";

const route = getRouteApi("/wallets/$walletId");

export function WalletsDetailPage() {
  const { walletId } = route.useParams();
  const walletDetailQuery = useWalletDetailQuery(walletId);
  const recordsQuery = useRecordsQuery({ source_id: walletId });
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

      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{walletDetailQuery.data.data.name}&apos;s records</h3>
        {match(recordsQuery)
          .with({ isPending: true }, () => <RecordListLoader />)
          .with({ isError: true }, () => <p>An error occured</p>)
          .otherwise(recordsQuery => (
            <RecordList
              data={recordsQuery.data.data}
              emptyMessageDescription="You have not record any transactions for this wallet"
            />
          ))}
      </section>
    </PageLayout>
  );
}
