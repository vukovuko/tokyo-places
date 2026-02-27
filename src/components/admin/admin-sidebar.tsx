"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Tag, LogOut, ChevronsUpDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminSidebarProps {
  user: { email: string };
}

const navItems = [
  { href: "/admin/places", label: "Places", icon: MapPin },
  { href: "/admin/categories", label: "Categories", icon: Tag },
];

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/places" onClick={() => setOpenMobile(false)}>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Places Manager</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link href={item.href} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-xs font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <form
                    action="/api/auth/signout"
                    method="POST"
                    className="w-full"
                  >
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
