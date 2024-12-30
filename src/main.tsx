import { createRoot } from "react-dom/client";
import { App } from "./app";
import { preloadSettings } from "./features/settings/data/settings.queries";

import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "./index.css";

async function boot() {
  const { worker } = await import("./mocks/browser");
  await worker.start();

  await preloadSettings();
}

boot()
  .then(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch(error => {
    console.error("Error while booting the app: ", error);
  });
