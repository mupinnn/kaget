import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";

import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "./index.css";

import { routeTree } from "@/__generated__/routeTree";
import { BaseAPIResponseSchema } from "./schemas/api.schema";

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

function Root() {
  const { toast } = useToast();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
            staleTime: 60 * 1000,
          },
        },
        mutationCache: new MutationCache({
          onSuccess: response => {
            const parsedResponse = BaseAPIResponseSchema.parse(response);
            toast({ title: parsedResponse.message });
          },
          onError: error => {
            toast({ variant: "destructive", title: error.message });
          },
        }),
      })
  );

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <TanStackRouterDevtools router={router} />
        <ReactQueryDevtools buttonPosition="bottom-right" />
        <Toaster />
      </QueryClientProvider>
    </StrictMode>
  );
}

boot()
  .then(() => {
    createRoot(document.getElementById("root")!).render(<Root />);
  })
  .catch(error => {
    console.error("Error while booting the app: ", error);
  });
