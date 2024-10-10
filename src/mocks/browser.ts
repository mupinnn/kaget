import { setupWorker } from "msw/browser";

import { walletsHandler } from "./handlers/wallets.handler";

export const worker = setupWorker(...walletsHandler);
