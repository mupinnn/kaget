import { Fragment } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const Route = createRootRoute({
  component: RootRoute,
});

function RootRoute() {
  return (
    <Fragment>
      <Navbar />
      <main className="container w-full flex-1 p-4">
        <Outlet />
      </main>
      <Footer />
    </Fragment>
  );
}
