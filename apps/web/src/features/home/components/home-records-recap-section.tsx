import { match } from "ts-pattern";
import { RecordList, RecordListLoader } from "@/features/records/components/record-list";
import { useRecordsQuery } from "@/features/records/data/records.queries";
import { getISODate } from "@/utils/date.util";
import { HomeSection } from "./home-section";
import { HomeSectionError } from "./home-section-status";

export function HomeRecordsRecapSection() {
  const recordsQuery = useRecordsQuery({
    start: getISODate(new Date()),
    end: getISODate(new Date()),
  });

  return (
    <HomeSection
      title="Today's recap"
      description="Cash flow recorded today"
      to="/records"
      linkText="See all"
    >
      {match(recordsQuery)
        .with({ isPending: true }, () => <RecordListLoader />)
        .with({ isError: true }, () => (
          <HomeSectionError onRetry={() => void recordsQuery.refetch()} />
        ))
        .otherwise(query => (
          <RecordList
            data={query.data}
            emptyMessageTitle="Nothing today yet"
            emptyMessageDescription="Record spending or income as it happens on this device."
          />
        ))}
    </HomeSection>
  );
}
