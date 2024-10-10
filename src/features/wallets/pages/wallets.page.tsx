import { useWallets } from "../data/wallets.queries";

export function WalletsIndexPage() {
  const walletsQuery = useWallets();

  if (walletsQuery.isPending) return <p>Loading . . .</p>;
  if (walletsQuery.isError) return <p>An error ocurred.</p>;

  return (
    <p>
      <pre>{JSON.stringify(walletsQuery.data, null, 2)}</pre>
    </p>
  );
}
