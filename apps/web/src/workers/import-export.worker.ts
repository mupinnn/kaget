import { ImportSchema } from "@/features/settings/data/settings.schemas";
import { exportDB, importDB } from "@/libs/db.lib";

self.onmessage = async (event: MessageEvent<ImportExportWorkerData>) => {
  const type = event.data.type;
  const status = event.data.status;

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
      if (status === "start") {
        self.postMessage({ status: "loading", type });

        const dataToImport = JSON.parse(await event.data.importedFile.text()) as Array<{
          table: string;

          // biome-ignore lint/suspicious/noExplicitAny: currently don't know the type
          rows: any[];
        }>;
        const parsingResult = ImportSchema.safeParse(dataToImport);

        if (parsingResult.success) {
          await importDB(dataToImport);
          self.postMessage({ status: "done", type });
        } else {
          self.postMessage({
            status: "error",
            message: "Invalid file content. Make sure you never modify the expored file.",
            type,
          });
        }
      }
      break;

    default:
      break;
  }
};
