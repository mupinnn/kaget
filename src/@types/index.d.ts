declare global {
  type ExportWorkerData = {
    type: "export";
    status: "idle" | "start" | "loading" | "done";
    progress: number;
    exportedFile: string;
  };

  type ImportWorkerData = {
    type: "import";
    status: "idle" | "start" | "loading" | "done" | "error";
    progress: number;
    importedFile: Blob;
    message: string;
  };

  type ImportExportWorkerData = ExportWorkerData | ImportWorkerData;
}

export {};
