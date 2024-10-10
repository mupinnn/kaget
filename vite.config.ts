import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import Environment from "unplugin-environment/vite";
import { z } from "zod";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    Environment({
      match: "VITE_",
      schema: {
        VITE_API_URL: z.string().url(),
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
