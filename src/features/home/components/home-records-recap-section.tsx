import { match } from "ts-pattern";
import { RecordList, RecordListLoader } from "@/features/records/components/record-list";
import { useRecordsQuery } from "@/features/records/data/records.queries";
import { getISODate } from "@/utils/date.util";
import { HomeSection } from "./home-section";

export const HomeRecordsRecapSection = () => {
  const recordsQuery = useRecordsQuery({
    start: getISODate(new Date()),
    end: getISODate(new Date()),
  });

  return (
    <HomeSection title="Today's recap" to="/records" linkText="See all records">
      {match(recordsQuery)
        .with({ isPending: true }, () => <RecordListLoader />)
        .with({ isError: true }, () => <p>An error occured</p>)
        .otherwise(recordsQuery => (
          <RecordList data={recordsQuery.data.data} />
        ))}
    </HomeSection>
  );
};
