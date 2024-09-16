import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "./index.css";

import { routeTree } from "@/__generated__/routeTree";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

async function boot() {
  const { worker } = await import("./mocks/browser");
  await worker.start();
}

boot()
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );
  })
  .catch(error => {
    console.error("Error while booting the app: ", error);
  });
