/// <reference types="vite/client" />

import { Settings } from "./features/settings/data/settings.schema";

declare global {
  interface Window {
    settings?: Settings;
  }
}
