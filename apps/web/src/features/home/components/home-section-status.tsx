import { Skeleton } from "@/components/ui/skeleton";

export function HomeSectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm">
      Couldn&apos;t load this section.{" "}
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

/** Horizontal peek skeletons for wallets / budgets on home. */
export function HomePeekLoader() {
  return (
    <div className="flex gap-3">
      {["a", "b", "c", "d"].map(id => (
        <Skeleton key={id} className="h-24 w-56 shrink-0" />
      ))}
    </div>
  );
}
