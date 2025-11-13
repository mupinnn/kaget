import { useRef, useState, useEffect } from "react";
import { DownloadIcon, UploadIcon, FileTextIcon } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ImportExportWorker from "@/workers/import-export.worker?worker";
import { formatDate } from "@/utils/date.util";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { StoragePersistenceNotice } from "@/components/storage-persistence-notice";
import { toast } from "@/hooks/use-toast";
import { preloadSettings } from "../data/settings.services";

const importExportWorker = new ImportExportWorker();

export function SettingsIndexPage() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerStatus, setWorkerStatus] = useState<ImportExportWorkerData["status"]>("idle");
  const [runningWorkerType, setRunningWorkerType] = useState<ImportExportWorkerData["type"]>();
  const [workerExportResult, setWorkerExportResult] = useState<{
    exportedFile: string;
    exportedAt: string;
  }>();
  const [importSelectedFile, setImportSelectedFile] = useState<File>();

  const importFileRef = useRef<HTMLInputElement>(null);

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

        if (type === "import") {
          void preloadSettings();
          toast({
            title: "Successfully imported",
            description: "Your data successfully imported. Go around to see the results.",
          });
          setImportSelectedFile(undefined);
        }
      }

      if (status === "error") {
        toast({
          title: "Error when importing",
          description: event.data.message,
          variant: "destructive",
        });
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

  const handleSelectFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!importFileRef || !importFileRef.current) return;

    importFileRef.current.click();
  };

  const handleImport = () => {
    if (worker) {
      setRunningWorkerType("import");
      worker.postMessage({ type: "import", status: "start", importedFile: importSelectedFile });
    }
  };

  return (
    <PageLayout title="Settings">
      <StoragePersistenceNotice />

      <Separator />

      <div className="flex flex-col items-start gap-1">
        <h2 className="text-lg font-semibold">Export data</h2>
        <p className="text-muted-foreground text-sm">Export and backup your data</p>
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
        <p className="text-muted-foreground text-sm">Import your backup data</p>
        <input
          type="file"
          ref={importFileRef}
          hidden
          onChange={e => setImportSelectedFile(e.target?.files?.[0])}
        />
        <Button variant="outline" isLoading={isImportRunning} onClick={handleSelectFile}>
          <FileTextIcon />
          Select file {importSelectedFile && `: ${importSelectedFile.name}`}
        </Button>
        <ConfirmationDialog
          title="Restore Backup"
          description="Please note that importing a backup will overwrite your existing data. The system will replace all current data with the contents of the imported file. Ensure you import the latest backup file. This action cannot be undone."
          trigger={
            <Button variant="outline" isLoading={isImportRunning}>
              <UploadIcon />
              Import
            </Button>
          }
          onClickAction={handleImport}
        />
      </div>
    </PageLayout>
  );
}
