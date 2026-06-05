import { useRegisterSW } from "virtual:pwa-register/react";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { StrictMode } from "react";
import { toast } from "sonner";
import { ZodError } from "zod";
import { routeTree } from "@/__generated__/routeTree";
import { HidableBalanceProvider } from "./components/providers/hidable-balance-provider";
import { ThemeProvider } from "./components/providers/theme-provider";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { BaseServiceResponseSchema } from "./schemas/service.schema";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryAndMutationErrorHandler = (error: Error) => {
  if (error instanceof ZodError) {
    toast.error("Invalid payload", {
      description: (
        <ul className="list-inside list-disc">
          {error.issues.map(issue => (
            <li key={issue.path.join(".")}>{issue.message}</li>
          ))}
        </ul>
      ),
    });
    return;
  }

  toast.error(error.message);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: response => {
      const parsedResponse = BaseServiceResponseSchema.parse(response);
      toast(parsedResponse.message);
    },
    onError: queryAndMutationErrorHandler,
  }),
  queryCache: new QueryCache({
    onError: queryAndMutationErrorHandler,
  }),
});

export function App() {
  const {
    offlineReady: [, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      toast("New version available", {
        description: "Click on reload button to update",
        action: <Button onClick={() => updateServiceWorker(true)}>Reload</Button>,
      });
    },
    onOfflineReady() {
      toast("App ready to work offline", {
        description: "Now you can use KaGet without internet connection",
        action: <Button onClick={() => setOfflineReady(false)}>Close</Button>,
      });
    },
  });

  return (
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <HidableBalanceProvider>
            <RouterProvider router={router} />
            <TanStackRouterDevtools router={router} />
            <ReactQueryDevtools buttonPosition="bottom-right" />
            <Toaster />
          </HidableBalanceProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
