import { StrictMode, lazy, Suspense } from "react";
import { ZodError } from "zod";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { routeTree } from "@/__generated__/routeTree";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Toaster } from "./components/ui/toaster";
import { ToastAction } from "./components/ui/toast";
import { toast } from "./hooks/use-toast";
import { BaseServiceResponseSchema } from "./schemas/service.schema";
import { ThemeProvider } from "./components/providers/theme-provider";
import { HidableBalanceProvider } from "./components/providers/hidable-balance-provider";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/router-devtools").then(res => ({ default: res.TanStackRouterDevtools }))
      );

const queryAndMutationErrorHandler = (error: Error) => {
  if (error instanceof ZodError) {
    toast({
      variant: "destructive",
      title: "Invalid payload",
      description: (
        <ul className="list-inside list-disc">
          {error.issues.map((issue, index) => (
            <li key={index}>{issue.message}</li>
          ))}
        </ul>
      ),
    });
    return;
  }

  toast({ variant: "destructive", title: error.message });
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
      toast({ title: parsedResponse.message });
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
      toast({
        title: "New version available",
        description: "Click on reload button to update",
        action: (
          <ToastAction altText="Reload" onClick={() => updateServiceWorker(true)}>
            Reload
          </ToastAction>
        ),
      });
    },
    onOfflineReady() {
      toast({
        title: "App ready to work offline",
        description: "Now you can use KaGet without internet connection",
        action: (
          <ToastAction altText="Close" onClick={() => setOfflineReady(false)}>
            Close
          </ToastAction>
        ),
      });
    },
  });

  return (
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <HidableBalanceProvider>
            <RouterProvider router={router} />
            <Suspense>
              <TanStackRouterDevtools router={router} />
            </Suspense>
            <ReactQueryDevtools buttonPosition="bottom-right" />
            <Toaster />
          </HidableBalanceProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
