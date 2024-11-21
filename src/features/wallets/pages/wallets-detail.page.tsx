import { Link, getRouteApi } from "@tanstack/react-router";
import { ReceiptTextIcon } from "lucide-react";
import { formatCurrency } from "@/utils/common.util";
import { Button } from "@/components/ui/button";
import { useWalletDetailQuery } from "../data/wallets.queries";
import { EmptyState } from "@/components/empty-state";

const route = getRouteApi("/wallets/$walletId");

export function WalletsDetailPage() {
  const { walletId } = route.useParams();
  const walletDetailQuery = useWalletDetailQuery(walletId);

  if (walletDetailQuery.isPending) return <p>Loading . . .</p>;
  if (walletDetailQuery.isError) return <p>An error occured.</p>;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{walletDetailQuery.data.data.name}</h1>
        <p className="text-lg text-muted-foreground">
          {formatCurrency(walletDetailQuery.data.data.balance)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild className="no-underline" size="sm">
          <Link to="/wallets/$walletId" params={{ walletId }}>
            Edit
          </Link>
        </Button>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{walletDetailQuery.data.data.name}&apos;s records</h3>
        <EmptyState
          title="No records found"
          description="You have not record any transactions for this wallet"
          icon={ReceiptTextIcon}
        />
      </section>
    </div>
  );
}
