import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/page-layout";

export function TransfersIndexPage() {
  return (
    <PageLayout title="Transfers" subtitle="Move fund between your wallet.">
      <Button asChild className="no-underline">
        <Link to="/transfers/create">
          <PlusIcon />
          Transfer balance
        </Link>
      </Button>
    </PageLayout>
  );
}
