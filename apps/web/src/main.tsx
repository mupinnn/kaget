import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

import "./index.css";

Sentry.init({
  dsn: "https://df7ed22435a9e42616c5c2a58ada6307@o4508653484769280.ingest.de.sentry.io/4508653487259728",
  integrations: [],
});

createRoot(document.getElementById("root")!).render(<App />);
