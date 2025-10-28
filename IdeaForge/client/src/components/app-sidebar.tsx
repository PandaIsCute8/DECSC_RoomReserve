import { Home, Calendar, History, Settings, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  user?: { name: string; email: string; isAdmin: boolean };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    {
      title: "Browse Rooms",
      url: "/dashboard",
      icon: Home,
      testId: "link-browse-rooms",
    },
    {
      title: "My Bookings",
      url: "/bookings",
      icon: Calendar,
      testId: "link-my-bookings",
    },
  ];

  const adminItems = user?.isAdmin
    ? [
        {
          title: "Admin Panel",
          url: "/admin",
          icon: LayoutDashboard,
          testId: "link-admin-panel",
        },
      ]
    : [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">RR</span>
          </div>
          <div>
            <h2 className="font-semibold text-base">RoomReserve</h2>
            <p className="text-xs text-muted-foreground">JGSOM Booking</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {user && (
        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
