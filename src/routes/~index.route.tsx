import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className="-m-4">
        <div className="flex w-max gap-4 p-4">
          {[...Array(10).keys()].map(i => (
            <Card key={i} className="max-w-72">
              <CardHeader>
                <CardTitle>Wallet {i + 1}</CardTitle>
                <CardDescription>Rp 5.000.000</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p>Latest Records</p>
          <Link to="/records">See All Records</Link>
        </div>
      </div>
    </div>
  );
}
