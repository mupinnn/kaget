import {
  BanknoteIcon,
  HomeIcon,
  WalletIcon,
  ArrowRightLeftIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { Link, RoutePaths, RegisteredRouter } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

type MenuItem = {
  title: string;
  url: RoutePaths<RegisteredRouter["routeTree"]>;
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
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            KaGet<sup>v0.1.0</sup>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(menuItem => (
                <SidebarMenuItem key={menuItem.title}>
                  <SidebarMenuButton asChild>
                    <Link to={menuItem.url} className="no-underline">
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
