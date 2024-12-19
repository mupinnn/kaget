import { Link } from "@tanstack/react-router";
import { BanknoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { HomeSection } from "./home-section";

const data = [];

export const HomeBudgetsSection = () => {
  return (
    <HomeSection title="Budgets" to="/budgets" linkText="See all budgets">
      {data.length === 0 ? (
        <EmptyState
          title="No budget created"
          description="Allocate your money for a specific occasion"
          icon={BanknoteIcon}
          actions={
            <Button asChild className="no-underline">
              <Link to="/">Allocate money</Link>
            </Button>
          }
        />
      ) : (
        <p>Hoop la!</p>
      )}
    </HomeSection>
  );
};
