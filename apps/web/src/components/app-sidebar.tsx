import { Link } from "@tanstack/react-router";
import {
  ArrowRightLeftIcon,
  BanknoteIcon,
  HandCoinsIcon,
  HomeIcon,
  ReceiptTextIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "./ui/sidebar";

type MenuItem = {
  title: string;
  url: "/" | "/wallets" | "/records" | "/budgets" | "/transfers" | "/debts-loans" | "/settings";
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const menuItems: MenuItem[] = [
  {
    title: "Home",
    url: "/",
    icon: HomeIcon,
  },
  {
    title: "Wallets",
    url: "/wallets",
    icon: WalletIcon,
  },
  {
    title: "Records",
    url: "/records",
    icon: ReceiptTextIcon,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: BanknoteIcon,
  },
  {
    title: "Transfers",
    url: "/transfers",
    icon: ArrowRightLeftIcon,
  },
  {
    title: "Debts & Loans",
    url: "/debts-loans",
    icon: HandCoinsIcon,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: SettingsIcon,
  },
];

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12 justify-center border-sidebar-border border-b px-2">
        <div className="flex items-center gap-2 overflow-hidden px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span
            aria-hidden
            className="hidden size-7 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground text-xs group-data-[collapsible=icon]:flex"
          >
            K
          </span>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-sm tracking-tight">KaGet</span>
            <span className="truncate text-sidebar-foreground/60 text-xs">v{__APP_VERSION__}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(menuItem => (
                <SidebarMenuItem key={menuItem.title}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    tooltip={menuItem.title}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link
                      to={menuItem.url}
                      className="no-underline"
                      activeProps={{ "data-active": "true" }}
                    >
                      <menuItem.icon />
                      <span>{menuItem.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
