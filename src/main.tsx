import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { App } from "./app";
import { preloadSettings } from "./features/settings/data/settings.services";

import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "./index.css";

Sentry.init({
  dsn: "https://df7ed22435a9e42616c5c2a58ada6307@o4508653484769280.ingest.de.sentry.io/4508653487259728",
  integrations: [],
});

async function boot() {
  await preloadSettings();
}

boot()
  .then(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch(error => {
    console.error("Error while booting the app: ", error);
  });
