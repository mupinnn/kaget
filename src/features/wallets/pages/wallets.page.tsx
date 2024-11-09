import { Link } from "@tanstack/react-router";
import { WalletCard } from "../components/wallet-card";

const wallets = Array.from({ length: 10 }).map((_, i) => ({
  id: i,
  name: `Wallet ${i}`,
  cash_balance: 1000,
  digital_balance: 95001000,
  total_balance: 95002000,
}));

export function WalletsIndexPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Wallets</h1>
        <p className="text-sm text-muted-foreground">Manage your wallets. Hassle-free.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {wallets.map(wallet => (
          <Link to="/wallets" key={wallet.id} className="no-underline">
            <WalletCard
              name={wallet.name}
              totalBalance={wallet.total_balance}
              cashBalance={wallet.cash_balance}
              digitalBalance={wallet.digital_balance}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
