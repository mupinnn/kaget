import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/page-layout";
import { useRecordsQuery } from "../data/records.queries";
import { RecordList, RecordListLoader } from "../components/record-list";

export function RecordsIndexPage() {
  const recordsQuery = useRecordsQuery();

  return (
    <PageLayout
      title="Records"
      subtitle="Adulting is not about spending, but tracking and controlling what you spend"
    >
      <Button asChild className="no-underline">
        <Link to="/records/create">
          <PlusIcon />
          New record
        </Link>
      </Button>

      {match(recordsQuery)
        .with({ isPending: true }, () => <RecordListLoader />)
        .with({ isError: true }, () => <p>An error occured</p>)
        .otherwise(() => (
          <RecordList data={recordsQuery.data?.data} />
        ))}
    </PageLayout>
  );
}
