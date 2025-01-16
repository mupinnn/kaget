import { exportDB } from "@/libs/db.lib";

self.onmessage = async (event: MessageEvent<ImportExportWorkerData>) => {
  const { type, status } = event.data;

  switch (type) {
    case "export":
      if (status === "start") {
        self.postMessage({ status: "loading", type });

        const allData = await exportDB();
        const allDataSerialized = JSON.stringify(allData);
        const allDataBlob = new Blob([allDataSerialized], { type: "text/json" });
        const downloadURL = URL.createObjectURL(allDataBlob);

        self.postMessage({ status: "done", exportedFile: downloadURL, type });
      }
      break;

    case "import":
      break;

    default:
      break;
  }
};
