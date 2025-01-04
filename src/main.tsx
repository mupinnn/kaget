import { createRoot } from "react-dom/client";
import { App } from "./app";

import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
