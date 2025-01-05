/// <reference types="vite/client" />

import { Settings } from "./features/settings/data/settings.schemas";

declare global {
  interface Window {
    settings?: Settings;
  }
}
