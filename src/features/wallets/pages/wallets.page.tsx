import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletCard } from "../components/wallet-card";

const wallets = Array.from({ length: 10 }).map((_, i) => ({
  id: i.toString(),
  name: `Wallet ${i}`,
  balance: 950808000,
}));

export function WalletsIndexPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Wallets</h1>
        <p className="text-sm text-muted-foreground">Manage your wallets. Hassle-free.</p>
      </div>

      <Button asChild className="no-underline">
        <Link to="/wallets/create">
          <PlusIcon />
          Create new wallet
        </Link>
      </Button>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {wallets.map(wallet => (
          <Link
            to="/wallets/$walletId"
            params={{ walletId: wallet.id }}
            key={wallet.id}
            className="no-underline"
          >
            <WalletCard name={wallet.name} balance={wallet.balance} />
          </Link>
        ))}
      </div>
    </div>
  );
}
