import { Link } from "@tanstack/react-router";
import {
  ArrowRightLeftIcon,
  BanknoteIcon,
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

type MenuItem = {
  title: string;
  url: "/" | "/wallets" | "/records" | "/budgets" | "/transfers" | "/settings";
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
    title: "Settings",
    url: "/settings",
    icon: SettingsIcon,
  },
];

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            KaGet<sup>{__APP_VERSION__}</sup>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(menuItem => (
                <SidebarMenuItem key={menuItem.title}>
                  <SidebarMenuButton asChild onClick={() => setOpenMobile(false)}>
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
    </Sidebar>
  );
}
