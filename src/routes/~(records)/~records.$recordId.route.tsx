import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(records)/records/$recordId")({
  component: () => <div>Hello /(records)/records/$recordId!</div>,
});
