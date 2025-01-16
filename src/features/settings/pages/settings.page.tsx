import { useState, useEffect } from "react";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ImportExportWorker from "@/workers/import-export.worker?worker";
import { formatDate } from "@/utils/date.util";

const importExportWorker = new ImportExportWorker();

export function SettingsIndexPage() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerStatus, setWorkerStatus] = useState<ImportExportWorkerData["status"]>("idle");
  const [runningWorkerType, setRunningWorkerType] = useState<ImportExportWorkerData["type"]>();
  const [workerExportResult, setWorkerExportResult] = useState<{
    exportedFile: string;
    exportedAt: string;
  }>();

  const isExportRunning = runningWorkerType === "export" && workerStatus === "loading";
  const isImportRunning = runningWorkerType === "import" && workerStatus === "loading";

  useEffect(() => {
    importExportWorker.onmessage = (event: MessageEvent<ImportExportWorkerData>) => {
      const { status, type } = event.data;

      setWorkerStatus(status);

      if (status === "done") {
        setRunningWorkerType(undefined);

        if (type === "export") {
          setWorkerExportResult({
            exportedFile: event.data.exportedFile,
            exportedAt: new Date().toISOString(),
          });
        }
      }
    };

    setWorker(importExportWorker);

    return () => {
      if (workerExportResult) {
        URL.revokeObjectURL(workerExportResult.exportedFile);
      }
    };
  }, [workerExportResult]);

  const handleExport = () => {
    if (worker) {
      setRunningWorkerType("export");
      worker.postMessage({ type: "export", status: "start" });
    }
  };

  return (
    <PageLayout title="Settings">
      <div className="flex flex-col items-start gap-1">
        <h2 className="text-lg font-semibold">Export data</h2>
        <p className="text-sm text-muted-foreground">Export and backup your data</p>
        <Button
          variant="outline"
          onClick={handleExport}
          isLoading={isExportRunning}
          disabled={runningWorkerType === "import"}
        >
          <DownloadIcon />
          Export
        </Button>

        {workerExportResult && (
          <a
            href={workerExportResult.exportedFile}
            download={`kaget-export_${workerExportResult.exportedAt}.json`}
          >
            Click here to download the exported file (
            {formatDate(workerExportResult.exportedAt, { timeStyle: "short" })})
          </a>
        )}
      </div>

      <Separator />

      <div className="flex flex-col items-start gap-1">
        <h2 className="text-lg font-semibold">Import data</h2>
        <p className="text-sm text-muted-foreground">Import your backup data</p>
        <Button
          variant="outline"
          isLoading={isImportRunning}
          disabled={runningWorkerType === "export"}
        >
          <UploadIcon />
          Import
        </Button>
      </div>
    </PageLayout>
  );
}
