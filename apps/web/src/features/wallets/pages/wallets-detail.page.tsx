import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { match } from "ts-pattern";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { HidableBalance } from "@/components/hidable-balance";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecordList, RecordListLoader } from "@/features/records/components/record-list";
import { useRecordsQuery } from "@/features/records/data/records.queries";
import { TransferList, TransferListLoader } from "@/features/transfers/components/transfer-list";
import { useTransfersQuery } from "@/features/transfers/data/transfers.queries";
import { useDeleteWalletMutation } from "../data/wallets.mutations";
import { useWalletDetailQuery } from "../data/wallets.queries";
import { WALLET_TYPE_LABEL } from "../data/wallets.schemas";

const route = getRouteApi("/_app/(wallets)/wallets/$walletId");

function WalletDetailLoader() {
  return (
    <div className="space-y-3">
      <Skeleton className="size-8 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-full max-w-sm" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function WalletQueryError({
  message = "Couldn't load this section.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm">
      {message}{" "}
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

export function WalletsDetailPage() {
  const { walletId } = route.useParams();
  const navigate = useNavigate();
  const walletDetailQuery = useWalletDetailQuery(walletId);
  const recordsQuery = useRecordsQuery({ source_id: walletId, source_type: "WALLET" });
  const transfersQuery = useTransfersQuery({ source_id: walletId, source_type: "WALLET" });
  const deleteWalletMutation = useDeleteWalletMutation();

  if (walletDetailQuery.isPending) return <WalletDetailLoader />;
  if (walletDetailQuery.isError) {
    return (
      <WalletQueryError
        message="Couldn't load this wallet."
        onRetry={() => void walletDetailQuery.refetch()}
      />
    );
  }

  const handleDeleteWallet = () => {
    deleteWalletMutation.mutate(walletId, {
      async onSuccess() {
        await navigate({ to: "/wallets" });
      },
    });
  };

  const wallet = walletDetailQuery.data;

  return (
    <PageLayout
      title={wallet.name}
      badge={WALLET_TYPE_LABEL[wallet.type]}
      subtitle={
        <p className="font-semibold text-foreground text-xl tabular-nums tracking-tight">
          <HidableBalance value={wallet.balance} />
        </p>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild className="no-underline" size="sm" variant="outline">
          <Link to="/wallets/$walletId/edit" params={{ walletId }}>
            <PencilIcon />
            Edit
          </Link>
        </Button>
        <ConfirmationDialog
          title={<>Delete {wallet.name}?</>}
          description="This cannot be undone. Records, budgets, and transfers tied to this wallet will be removed."
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
        <TabsList className="grid h-9 w-full grid-cols-2 sm:w-80">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>
        <TabsContent value="records" className="mt-3">
          {match(recordsQuery)
            .with({ isPending: true }, () => <RecordListLoader />)
            .with({ isError: true }, () => (
              <WalletQueryError
                message="Couldn't load records."
                onRetry={() => void recordsQuery.refetch()}
              />
            ))
            .otherwise(query => (
              <RecordList
                data={query.data}
                emptyMessageTitle="No records yet"
                emptyMessageDescription="Record spending or income against this wallet when it happens."
              />
            ))}
        </TabsContent>
        <TabsContent value="transfers" className="mt-3">
          {match(transfersQuery)
            .with({ isPending: true }, () => <TransferListLoader />)
            .with({ isError: true }, () => (
              <WalletQueryError
                message="Couldn't load transfers."
                onRetry={() => void transfersQuery.refetch()}
              />
            ))
            .otherwise(query => (
              <TransferList
                data={query.data}
                emptyMessageTitle="No transfers yet"
                emptyMessageDescription="Move money between wallets or into budgets from Transfers."
              />
            ))}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
