import { setupWorker } from "msw/browser";

import { budgetsHandler } from "./handlers/budgets.handler";

export const worker = setupWorker(...budgetsHandler);
