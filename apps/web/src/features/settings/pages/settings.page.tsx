import { useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, FileTextIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/date.util";
import {
  GoogleDriveSyncSection,
  SETTINGS_EXPORT_SECTION_ID,
} from "../components/google-drive-sync-section";
import { exportData, importData } from "../data/ledger-ie.services";
import { useSettingsQuery } from "../data/settings.queries";

function CurrencySection() {
  const settingsQuery = useSettingsQuery();

  return (
    <section className="space-y-2">
      <div className="space-y-0.5">
        <h2 className="font-semibold text-base tracking-tight">Currency</h2>
        <p className="text-muted-foreground text-sm">
          Display preference for amounts on this device.
        </p>
      </div>

      {settingsQuery.isPending ? (
        <Skeleton className="h-5 w-16" />
      ) : settingsQuery.isError ? (
        <div className="rounded-lg border border-dashed px-3 py-4 text-muted-foreground text-sm">
          Couldn&apos;t load currency.{" "}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => void settingsQuery.refetch()}
          >
            Try again
          </button>
        </div>
      ) : (
        <p className="font-medium tabular-nums tracking-tight">
          {settingsQuery.data?.currencyCode}
        </p>
      )}
    </section>
  );
}

function BackupSection() {
  const queryClient = useQueryClient();
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
    <section id={SETTINGS_EXPORT_SECTION_ID} className="scroll-mt-4 space-y-3">
      <div className="space-y-0.5">
        <h2 className="font-semibold text-base tracking-tight">Backup</h2>
        <p className="text-muted-foreground text-sm">
          Export or restore a ledger document on this device — independent of Drive.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">Export</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting || isImporting}
        >
          <DownloadIcon />
          {isExporting ? "Exporting…" : "Export"}
        </Button>
        {exportResult ? (
          <a
            href={exportResult.url}
            download={`kaget-export_${exportResult.exportedAt}.json`}
            className="block text-sm underline-offset-4 hover:underline"
          >
            Download exported file ({formatDate(exportResult.exportedAt, { timeStyle: "short" })})
          </a>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">Import</p>
        <input
          type="file"
          accept="application/json,.json"
          ref={importFileRef}
          hidden
          onChange={e => setImportSelectedFile(e.target?.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={isImporting} onClick={handleSelectFile}>
            <FileTextIcon />
            {importSelectedFile ? importSelectedFile.name : "Select file"}
          </Button>
          <ConfirmationDialog
            title="Restore backup?"
            description="Importing replaces all local ledger data with this file. Export a backup first if you are unsure. This cannot be undone."
            trigger={
              <Button variant="outline" size="sm" disabled={isImporting || !importSelectedFile}>
                <UploadIcon />
                {isImporting ? "Importing…" : "Import"}
              </Button>
            }
            onClickAction={handleImport}
          />
        </div>
      </div>
    </section>
  );
}

export function SettingsIndexPage() {
  return (
    <PageLayout
      title="Settings"
      subtitle="Preferences and optional Drive backup — your ledger stays on this device."
    >
      <div className="max-w-lg space-y-6">
        <GoogleDriveSyncSection />
        <CurrencySection />
        <BackupSection />
      </div>
    </PageLayout>
  );
}
