import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppFooter } from "@/components/app-footer";
import { AppNavbar } from "@/components/app-navbar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-h-svh w-full flex-1 flex-col overflow-auto">
        <AppNavbar />
        <div className="flex flex-1 flex-col gap-3 p-3 md:gap-4 md:px-4 md:py-3">
          <Outlet />
        </div>
        <AppFooter />
      </main>
    </SidebarProvider>
  );
}
