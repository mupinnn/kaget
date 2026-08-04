/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  const __APP_VERSION__: string;
}

export {};
