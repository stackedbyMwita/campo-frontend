"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Wallet,
  ListTodo,
  LifeBuoy,
  Settings,
  LogIn,
  DoorOpen,
  Users2Icon,
  BirdIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar, // 👈 1. We use this hook
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"
import { Separator } from "./ui/separator"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"

// Menu Configuration (Kept same as yours)
const data = {
  navMain: [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
    { title: "Tasks", url: "/tasks", icon: ListTodo },
    { title: "Wallet", url: "/wallet", icon: Wallet },
    { title: "Referrals", url: "/referrals", icon: Users2Icon }
  ],
  navAccount: [
    { title: "Support", url: "/support", icon: LifeBuoy },
    { title: "Settings", url: "/settings", icon: Settings },
    // You might want to hide Login/Signup if user is logged in
    { title: "Login", url: "/login", icon: LogIn },
    { title: "Sign Up", url: "/signup", icon: DoorOpen },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // 2. 👇 Get the mobile controls
  const { isMobile, setOpenMobile } = useSidebar(); 

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            <BirdIcon />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Campo Crowd</span>
            <span className="truncate text-xs text-muted-foreground">Earner Pro</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* PLATFORM GROUP */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      // 3. 👇 Add the Click Handler here
                      onClick={() => isMobile && setOpenMobile(false)}
                      className="px-4 py-6 relative data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:bg-primary/10"
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/50" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>

          {/* ACCOUNT GROUP */}
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navAccount.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      // 3. 👇 Add the Click Handler here too
                      onClick={() => isMobile && setOpenMobile(false)}
                      className="px-4 py-6 relative data-[active=true]:text-primary data-[active=true]:border-l-2"
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/50" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Separator orientation="horizontal" className="mr-2 h-4" />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground "
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                    {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.firstName} {user?.lastName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
