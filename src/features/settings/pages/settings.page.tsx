import { useRef } from "react";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function SettingsIndexPage() {
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {};

  const handlePickFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!importFileRef || !importFileRef.current) return;

    importFileRef.current.click();
  };

  return (
    <PageLayout title="Settings">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Export data</h2>
        <p className="text-sm text-muted-foreground">Export and backup your data</p>
        <Button variant="outline" onClick={handleExport}>
          <DownloadIcon />
          Download
        </Button>
      </div>

      <Separator />

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Import data</h2>
        <p className="text-sm text-muted-foreground">Import your backup data</p>
        <input type="file" ref={importFileRef} hidden />
        <Button variant="outline" onClick={handlePickFile}>
          <UploadIcon />
          Import
        </Button>
      </div>
    </PageLayout>
  );
}
