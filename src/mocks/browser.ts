import { setupWorker } from "msw/browser";

import { walletsHandler } from "./handlers/wallets.handler";
import { budgetsHandler } from "./handlers/budgets.handler";
import { recordsHandler } from "./handlers/records.handler";

export const worker = setupWorker(...walletsHandler, ...budgetsHandler, ...recordsHandler);
