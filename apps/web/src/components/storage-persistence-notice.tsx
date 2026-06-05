import { DatabaseIcon } from "lucide-react";
import { usePersistentStorage } from "@/hooks/use-persistent-storage";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function StoragePersistenceNotice() {
  const { isStoragePersisted, requestPersistedStorage } = usePersistentStorage();

  return (
    <Alert>
      <DatabaseIcon className="size-4" />
      <AlertTitle>Allow data to be stored in persistent storage.</AlertTitle>
      <AlertDescription className="space-y-2 [&_p]:leading-normal">
        <p>
          For better experience and to ensure your data is stored reliably, please allow storage
          persistence. This helps prevent data loss and keeps your experience seamless.
        </p>
        <Badge variant={isStoragePersisted ? "default" : "destructive"} className="flex w-fit">
          {isStoragePersisted ? "Already persisted" : "Not persisted"}
        </Badge>
        {!isStoragePersisted && (
          <Button size="sm" variant="outline" onClick={requestPersistedStorage}>
            Request persisted storage
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
