import { Link } from "@tanstack/react-router";
import { WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { HomeSection } from "./home-section";

const data = [];

export const HomeWalletsSection = () => {
  return (
    <HomeSection title="Wallets" to="/wallets" linkText="See all wallets">
      {data.length === 0 ? (
        <EmptyState
          title="No wallet created"
          description="Create your first wallet to start tracking your cashflow!"
          icon={WalletIcon}
          actions={
            <Button asChild className="no-underline">
              <Link to="/wallets">Create wallet</Link>
            </Button>
          }
        />
      ) : (
        <p>Hoop la!</p>
      )}
    </HomeSection>
  );
};
