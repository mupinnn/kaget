/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from "./../routes/~__root";
import { Route as IndexRouteImport } from "./../routes/~index.route";
import { Route as walletsWalletsIndexRouteImport } from "./../routes/~(wallets)/~wallets.index.route";
import { Route as settingsSettingsIndexRouteImport } from "./../routes/~(settings)/~settings.index.route";
import { Route as recordsRecordsIndexRouteImport } from "./../routes/~(records)/~records.index.route";
import { Route as dashboardDashboardIndexRouteImport } from "./../routes/~(dashboard)/~dashboard.index.route";
import { Route as budgetsBudgetsIndexRouteImport } from "./../routes/~(budgets)/~budgets.index.route";
import { Route as walletsWalletsCreateRouteImport } from "./../routes/~(wallets)/~wallets.create.route";
import { Route as walletsWalletsWalletIdRouteImport } from "./../routes/~(wallets)/~wallets.$walletId.route";
import { Route as recordsRecordsRecordIdRouteImport } from "./../routes/~(records)/~records.$recordId.route";
import { Route as budgetsBudgetsBudgetIdRouteImport } from "./../routes/~(budgets)/~budgets.$budgetId.route";

// Create/Update Routes

const IndexRouteRoute = IndexRouteImport.update({
  path: "/",
  getParentRoute: () => rootRoute,
} as any);

const walletsWalletsIndexRouteRoute = walletsWalletsIndexRouteImport.update({
  path: "/wallets/",
  getParentRoute: () => rootRoute,
} as any);

const settingsSettingsIndexRouteRoute = settingsSettingsIndexRouteImport.update(
  {
    path: "/settings/",
    getParentRoute: () => rootRoute,
  } as any,
);

const recordsRecordsIndexRouteRoute = recordsRecordsIndexRouteImport.update({
  path: "/records/",
  getParentRoute: () => rootRoute,
} as any);

const dashboardDashboardIndexRouteRoute =
  dashboardDashboardIndexRouteImport.update({
    path: "/dashboard/",
    getParentRoute: () => rootRoute,
  } as any);

const budgetsBudgetsIndexRouteRoute = budgetsBudgetsIndexRouteImport.update({
  path: "/budgets/",
  getParentRoute: () => rootRoute,
} as any);

const walletsWalletsCreateRouteRoute = walletsWalletsCreateRouteImport.update({
  path: "/wallets/create",
  getParentRoute: () => rootRoute,
} as any);

const walletsWalletsWalletIdRouteRoute =
  walletsWalletsWalletIdRouteImport.update({
    path: "/wallets/$walletId",
    getParentRoute: () => rootRoute,
  } as any);

const recordsRecordsRecordIdRouteRoute =
  recordsRecordsRecordIdRouteImport.update({
    path: "/records/$recordId",
    getParentRoute: () => rootRoute,
  } as any);

const budgetsBudgetsBudgetIdRouteRoute =
  budgetsBudgetsBudgetIdRouteImport.update({
    path: "/budgets/$budgetId",
    getParentRoute: () => rootRoute,
  } as any);

// Populate the FileRoutesByPath interface

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": {
      id: "/";
      path: "/";
      fullPath: "/";
      preLoaderRoute: typeof IndexRouteImport;
      parentRoute: typeof rootRoute;
    };
    "/(budgets)/budgets/$budgetId": {
      id: "/budgets/$budgetId";
      path: "/budgets/$budgetId";
      fullPath: "/budgets/$budgetId";
      preLoaderRoute: typeof budgetsBudgetsBudgetIdRouteImport;
      parentRoute: typeof rootRoute;
    };
    "/(records)/records/$recordId": {
      id: "/records/$recordId";
      path: "/records/$recordId";
      fullPath: "/records/$recordId";
      preLoaderRoute: typeof recordsRecordsRecordIdRouteImport;
      parentRoute: typeof rootRoute;
    };
    "/(wallets)/wallets/$walletId": {
      id: "/wallets/$walletId";
      path: "/wallets/$walletId";
      fullPath: "/wallets/$walletId";
      preLoaderRoute: typeof walletsWalletsWalletIdRouteImport;
      parentRoute: typeof rootRoute;
    };
    "/(wallets)/wallets/create": {
      id: "/wallets/create";
      path: "/wallets/create";
      fullPath: "/wallets/create";
      preLoaderRoute: typeof walletsWalletsCreateRouteImport;
      parentRoute: typeof rootRoute;
    };
    "/(budgets)/budgets/": {
      id: "/budgets/";
      path: "/budgets";
      fullPath: "/budgets";
      preLoaderRoute: typeof budgetsBudgetsIndexRouteImport;
      parentRoute: typeof rootRoute;
    };
    "/(dashboard)/dashboard/": {
      id: "/dashboard/";
      path: "/dashboard";
      fullPath: "/dashboard";
      preLoaderRoute: typeof dashboardDashboardIndexRouteImport;
      parentRoute: typeof rootRoute;
    };
    "/(records)/records/": {
      id: "/records/";
      path: "/records";
      fullPath: "/records";
      preLoaderRoute: typeof recordsRecordsIndexRouteImport;
      parentRoute: typeof rootRoute;
    };
    "/(settings)/settings/": {
      id: "/settings/";
      path: "/settings";
      fullPath: "/settings";
      preLoaderRoute: typeof settingsSettingsIndexRouteImport;
      parentRoute: typeof rootRoute;
    };
    "/(wallets)/wallets/": {
      id: "/wallets/";
      path: "/wallets";
      fullPath: "/wallets";
      preLoaderRoute: typeof walletsWalletsIndexRouteImport;
      parentRoute: typeof rootRoute;
    };
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  "/": typeof IndexRouteRoute;
  "/budgets/$budgetId": typeof budgetsBudgetsBudgetIdRouteRoute;
  "/records/$recordId": typeof recordsRecordsRecordIdRouteRoute;
  "/wallets/$walletId": typeof walletsWalletsWalletIdRouteRoute;
  "/wallets/create": typeof walletsWalletsCreateRouteRoute;
  "/budgets": typeof budgetsBudgetsIndexRouteRoute;
  "/dashboard": typeof dashboardDashboardIndexRouteRoute;
  "/records": typeof recordsRecordsIndexRouteRoute;
  "/settings": typeof settingsSettingsIndexRouteRoute;
  "/wallets": typeof walletsWalletsIndexRouteRoute;
}

export interface FileRoutesByTo {
  "/": typeof IndexRouteRoute;
  "/budgets/$budgetId": typeof budgetsBudgetsBudgetIdRouteRoute;
  "/records/$recordId": typeof recordsRecordsRecordIdRouteRoute;
  "/wallets/$walletId": typeof walletsWalletsWalletIdRouteRoute;
  "/wallets/create": typeof walletsWalletsCreateRouteRoute;
  "/budgets": typeof budgetsBudgetsIndexRouteRoute;
  "/dashboard": typeof dashboardDashboardIndexRouteRoute;
  "/records": typeof recordsRecordsIndexRouteRoute;
  "/settings": typeof settingsSettingsIndexRouteRoute;
  "/wallets": typeof walletsWalletsIndexRouteRoute;
}

export interface FileRoutesById {
  __root__: typeof rootRoute;
  "/": typeof IndexRouteRoute;
  "/budgets/$budgetId": typeof budgetsBudgetsBudgetIdRouteRoute;
  "/records/$recordId": typeof recordsRecordsRecordIdRouteRoute;
  "/wallets/$walletId": typeof walletsWalletsWalletIdRouteRoute;
  "/wallets/create": typeof walletsWalletsCreateRouteRoute;
  "/budgets/": typeof budgetsBudgetsIndexRouteRoute;
  "/dashboard/": typeof dashboardDashboardIndexRouteRoute;
  "/records/": typeof recordsRecordsIndexRouteRoute;
  "/settings/": typeof settingsSettingsIndexRouteRoute;
  "/wallets/": typeof walletsWalletsIndexRouteRoute;
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths:
    | "/"
    | "/budgets/$budgetId"
    | "/records/$recordId"
    | "/wallets/$walletId"
    | "/wallets/create"
    | "/budgets"
    | "/dashboard"
    | "/records"
    | "/settings"
    | "/wallets";
  fileRoutesByTo: FileRoutesByTo;
  to:
    | "/"
    | "/budgets/$budgetId"
    | "/records/$recordId"
    | "/wallets/$walletId"
    | "/wallets/create"
    | "/budgets"
    | "/dashboard"
    | "/records"
    | "/settings"
    | "/wallets";
  id:
    | "__root__"
    | "/"
    | "/budgets/$budgetId"
    | "/records/$recordId"
    | "/wallets/$walletId"
    | "/wallets/create"
    | "/budgets/"
    | "/dashboard/"
    | "/records/"
    | "/settings/"
    | "/wallets/";
  fileRoutesById: FileRoutesById;
}

export interface RootRouteChildren {
  IndexRouteRoute: typeof IndexRouteRoute;
  budgetsBudgetsBudgetIdRouteRoute: typeof budgetsBudgetsBudgetIdRouteRoute;
  recordsRecordsRecordIdRouteRoute: typeof recordsRecordsRecordIdRouteRoute;
  walletsWalletsWalletIdRouteRoute: typeof walletsWalletsWalletIdRouteRoute;
  walletsWalletsCreateRouteRoute: typeof walletsWalletsCreateRouteRoute;
  budgetsBudgetsIndexRouteRoute: typeof budgetsBudgetsIndexRouteRoute;
  dashboardDashboardIndexRouteRoute: typeof dashboardDashboardIndexRouteRoute;
  recordsRecordsIndexRouteRoute: typeof recordsRecordsIndexRouteRoute;
  settingsSettingsIndexRouteRoute: typeof settingsSettingsIndexRouteRoute;
  walletsWalletsIndexRouteRoute: typeof walletsWalletsIndexRouteRoute;
}

const rootRouteChildren: RootRouteChildren = {
  IndexRouteRoute: IndexRouteRoute,
  budgetsBudgetsBudgetIdRouteRoute: budgetsBudgetsBudgetIdRouteRoute,
  recordsRecordsRecordIdRouteRoute: recordsRecordsRecordIdRouteRoute,
  walletsWalletsWalletIdRouteRoute: walletsWalletsWalletIdRouteRoute,
  walletsWalletsCreateRouteRoute: walletsWalletsCreateRouteRoute,
  budgetsBudgetsIndexRouteRoute: budgetsBudgetsIndexRouteRoute,
  dashboardDashboardIndexRouteRoute: dashboardDashboardIndexRouteRoute,
  recordsRecordsIndexRouteRoute: recordsRecordsIndexRouteRoute,
  settingsSettingsIndexRouteRoute: settingsSettingsIndexRouteRoute,
  walletsWalletsIndexRouteRoute: walletsWalletsIndexRouteRoute,
};

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "~__root.tsx",
      "children": [
        "/",
        "/budgets/$budgetId",
        "/records/$recordId",
        "/wallets/$walletId",
        "/wallets/create",
        "/budgets/",
        "/dashboard/",
        "/records/",
        "/settings/",
        "/wallets/"
      ]
    },
    "/": {
      "filePath": "~index.route.tsx"
    },
    "/budgets/$budgetId": {
      "filePath": "~(budgets)/~budgets.$budgetId.route.tsx"
    },
    "/records/$recordId": {
      "filePath": "~(records)/~records.$recordId.route.tsx"
    },
    "/wallets/$walletId": {
      "filePath": "~(wallets)/~wallets.$walletId.route.tsx"
    },
    "/wallets/create": {
      "filePath": "~(wallets)/~wallets.create.route.tsx"
    },
    "/budgets/": {
      "filePath": "~(budgets)/~budgets.index.route.tsx"
    },
    "/dashboard/": {
      "filePath": "~(dashboard)/~dashboard.index.route.tsx"
    },
    "/records/": {
      "filePath": "~(records)/~records.index.route.tsx"
    },
    "/settings/": {
      "filePath": "~(settings)/~settings.index.route.tsx"
    },
    "/wallets/": {
      "filePath": "~(wallets)/~wallets.index.route.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
