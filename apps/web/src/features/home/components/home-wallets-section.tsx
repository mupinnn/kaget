import { match } from "ts-pattern";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { WalletList } from "@/features/wallets/components/wallet-list";
import { useWalletsQuery } from "@/features/wallets/data/wallets.queries";
import { HomeSection } from "./home-section";
import { HomePeekLoader, HomeSectionError } from "./home-section-status";

export function HomeWalletsSection() {
  const walletsQuery = useWalletsQuery({ limit: 5 });

  return (
    <HomeSection
      title="Wallets"
      description="Money you hold on this device"
      to="/wallets"
      linkText="See all"
    >
      {match(walletsQuery)
        .with({ isPending: true }, () => <HomePeekLoader />)
        .with({ isError: true }, () => (
          <HomeSectionError onRetry={() => void walletsQuery.refetch()} />
        ))
        .otherwise(query =>
          query.data.length === 0 ? (
            <WalletList
              data={query.data}
              emptyMessageTitle="No wallets yet"
              emptyMessageDescription="Add a wallet on this device to hold cash, bank, or e-wallet balances."
            />
          ) : (
            <ScrollArea className="-mb-0.5 -ml-0.5">
              <div className="flex w-max min-w-full gap-3 pb-0.5 pl-0.5 [&>*]:w-56 [&>*]:shrink-0">
                <WalletList data={query.data} />
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )
        )}
    </HomeSection>
  );
}
