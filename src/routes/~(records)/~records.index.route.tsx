import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(records)/records/")({
  component: () => <div>Hello /(records)/records/!</div>,
});
