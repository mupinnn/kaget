import { StrictMode, useState } from "react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { routeTree } from "@/__generated__/routeTree";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";
import { BaseAPIResponseSchema } from "./schemas/api.schema";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
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
        queryCache: new QueryCache({
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
