declare global {
  type ExportWorkerData = {
    type: "export";
    status: "idle" | "start" | "loading" | "done";
    progress: number;
    exportedFile: string;
  };

  type ImportWorkerData = {
    type: "import";
    status: "idle" | "start" | "loading" | "done";
    progress: number;
    importedFile: Blob;
  };

  type ImportExportWorkerData = ExportWorkerData | ImportWorkerData;
}

export {};
