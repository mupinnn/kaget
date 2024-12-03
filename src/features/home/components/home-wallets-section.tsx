import { match } from "ts-pattern";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import { WalletList, WalletListLoader } from "@/features/wallets/components/wallet-list";
import { HomeSection } from "./home-section";

export const HomeWalletsSection = () => {
  const walletsQuery = useWalletsQuery({ limit: 5 });

  return (
    <HomeSection title="Wallets" to="/wallets" linkText="See all wallets">
      <ScrollArea className="-mb-0.5 -ml-0.5">
        <div className="flex w-max space-x-4 pb-0.5 pl-0.5">
          {match(walletsQuery)
            .with({ isPending: true }, () => <WalletListLoader />)
            .with({ isError: true }, () => <p>An error occured</p>)
            .otherwise(walletsQuery => (
              <WalletList data={walletsQuery.data.data} />
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </HomeSection>
  );
};
