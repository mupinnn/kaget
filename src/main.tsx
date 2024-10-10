import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "./index.css";

import { routeTree } from "@/__generated__/routeTree";

const router = createRouter({ routeTree });
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 60 * 1000,
    },
  },
});

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
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <TanStackRouterDevtools router={router} />
          <ReactQueryDevtools buttonPosition="bottom-right" />
        </QueryClientProvider>
      </StrictMode>
    );
  })
  .catch(error => {
    console.error("Error while booting the app: ", error);
  });
