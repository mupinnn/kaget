import path from "node:path";
import { execSync } from "node:child_process";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

/** @see https://github.com/vitejs/vite/issues/16719#issuecomment-2308170706 */
function workerChunkPlugin(): Plugin {
  return {
    name: workerChunkPlugin.name,
    apply: "build",
    enforce: "pre",
    async resolveId(source, importer) {
      if (source.endsWith("?worker")) {
        const resolved = await this.resolve(source.split("?")[0], importer);
        return "\0" + resolved?.id + "?worker-chunk";
      }
    },
    load(id) {
      if (id.startsWith("\0") && id.endsWith("?worker-chunk")) {
        const referenceId = this.emitFile({
          type: "chunk",
          id: id.slice(1).split("?")[0],
        });

        return `
          export default function WorkerWrapper() {
            return new Worker(import.meta.ROLLUP_FILE_URL_${referenceId}, { type: "module" })
          }
        `;
      }
    },
  };
}

// to test the workflow variables. will be removed.
const isProduction =
  typeof process.env.IS_PRODUCTION === "string"
    ? process.env.IS_PRODUCTION === "true"
    : process.env.IS_PRODUCTION;
const lastRevisionSHA = execSync("git rev-parse --short HEAD").toString().trim();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
    }),
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["**/*"],
      manifest: {
        name: "KaGet: Kawan Budget",
        short_name: "KaGet",
        description: "A fully offline web-based budgeting app that meets your needs",
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
        globPatterns: ["**/*.{js,css,html,icon,png,svg,woff,woff2,ttf,otf}"],
      },
    }),
    workerChunkPlugin(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  worker: {
    format: "es",
  },

  define: {
    __APP_VERSION__: JSON.stringify(
      "v" + process.env.npm_package_version + (isProduction ? "" : `-${lastRevisionSHA}`)
    ),
  },
});
