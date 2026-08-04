import { useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, FileTextIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/utils/date.util";
import {
  GoogleDriveSyncSection,
  SETTINGS_EXPORT_SECTION_ID,
} from "../components/google-drive-sync-section";
import { exportData, importData } from "../data/ledger-ie.services";
import { useSettingsQuery } from "../data/settings.queries";

export function SettingsIndexPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useSettingsQuery();
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSelectedFile, setImportSelectedFile] = useState<File>();
  const [exportResult, setExportResult] = useState<{
    url: string;
    exportedAt: string;
  }>();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      if (exportResult) {
        URL.revokeObjectURL(exportResult.url);
      }
      setExportResult({ url, exportedAt: new Date().toISOString() });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    importFileRef.current?.click();
  };

  const handleImport = async () => {
    if (!importSelectedFile) {
      toast.error("Select a backup file first");
      return;
    }

    setIsImporting(true);
    try {
      await importData(importSelectedFile);
      await queryClient.invalidateQueries();
      toast("Successfully imported", {
        description: "Your data was restored from the backup file.",
      });
      setImportSelectedFile(undefined);
    } catch (error) {
      toast.error("Error when importing", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <PageLayout title="Settings">
      <div className="space-y-6">
        <GoogleDriveSyncSection />

        <Separator />

        <div className="space-y-2">
          <h2 className="font-semibold text-lg">Currency</h2>
          {settingsQuery.isPending ? (
            <p>Loading . . .</p>
          ) : settingsQuery.isError ? (
            <p>An error occured: {settingsQuery.error.message}</p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                Your currency preference is stored on this device.
              </p>
              <p className="font-medium">{settingsQuery.data?.currencyCode}</p>
            </>
          )}
        </div>

        <Separator />

        <div id={SETTINGS_EXPORT_SECTION_ID} className="flex flex-col items-start gap-1">
          <h2 className="font-semibold text-lg">Export data</h2>
          <p className="text-muted-foreground text-sm">Export and backup your local ledger</p>
          <Button variant="outline" onClick={handleExport} disabled={isExporting || isImporting}>
            <DownloadIcon />
            {isExporting ? "Exporting…" : "Export"}
          </Button>

          {exportResult && (
            <a href={exportResult.url} download={`kaget-export_${exportResult.exportedAt}.json`}>
              Click here to download the exported file (
              {formatDate(exportResult.exportedAt, { timeStyle: "short" })})
            </a>
          )}
        </div>

        <Separator />

        <div className="flex flex-col items-start gap-1">
          <h2 className="font-semibold text-lg">Import data</h2>
          <p className="text-muted-foreground text-sm">Import a ledger-document backup</p>
          <input
            type="file"
            accept="application/json,.json"
            ref={importFileRef}
            hidden
            onChange={e => setImportSelectedFile(e.target?.files?.[0])}
          />
          <Button variant="outline" disabled={isImporting} onClick={handleSelectFile}>
            <FileTextIcon />
            Select file {importSelectedFile && `: ${importSelectedFile.name}`}
          </Button>
          <ConfirmationDialog
            title="Restore Backup"
            description="Please note that importing a backup will overwrite your existing data. The system will replace all current data with the contents of the imported file. Ensure you import the latest backup file. This action cannot be undone."
            trigger={
              <Button variant="outline" disabled={isImporting || !importSelectedFile}>
                <UploadIcon />
                {isImporting ? "Importing…" : "Import"}
              </Button>
            }
            onClickAction={handleImport}
          />
        </div>
      </div>
    </PageLayout>
  );
}
