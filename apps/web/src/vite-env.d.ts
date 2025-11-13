/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

import { Settings } from "./features/settings/data/settings.schemas";

declare global {
  interface Window {
    settings?: Settings;
  }

  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  const __APP_VERSION__: string;
}
