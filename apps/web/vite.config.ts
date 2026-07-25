import { execSync } from "node:child_process";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// to test the workflow variables. will be removed.
const isProduction =
  typeof process.env.IS_PRODUCTION === "string"
    ? process.env.IS_PRODUCTION === "true"
    : process.env.IS_PRODUCTION;
const lastRevisionSHA = execSync("git rev-parse --short HEAD").toString().trim();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
    }),
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["pwa-64x64.png", "pwa-192x192.png", "pwa-512x512.png", "kaget-logo.svg"],
      manifest: {
        name: "KaGet: Kawan Budget",
        short_name: "KaGet",
        description: "A web-based budgeting app synced with your KaGet account",
        theme_color: "#facc15",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["index.html", "pwa-*.png", "kaget-logo.svg"],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: "es2022",
  },

  define: {
    __APP_VERSION__: JSON.stringify(
      `v${process.env.npm_package_version}${isProduction ? "" : `-${lastRevisionSHA}`}`
    ),
  },
});
