import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(records)/records/$recordId/edit")({
  component: () => <div>Hello /(records)/records/$recordId/edit!</div>,
});
