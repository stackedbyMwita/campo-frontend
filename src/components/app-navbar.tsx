"use client"

import { Separator } from "@radix-ui/react-separator";
import { ThemeToggle } from "./theme-toggle";
import { SidebarTrigger } from "./ui/sidebar";
import { NotificationsSheet } from "./notifications-sheet";
import { UserNav } from "./user-nav";
import { useAuth } from "@/context/auth-context";

export default function Navbar() {
  const { user } = useAuth();
  return (
    <div className="flex items-center gap-2 px-4 w-full justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-heading text-sm font-medium text-foreground/80">
          Welcome Back, <span className="font-bold text-primary">{user?.lastName}</span>
        </h1>
      </div>
      
      {/* Right Side of Navbar */}
      <div className="flex items-center gap-2">
        <NotificationsSheet />
        <ThemeToggle />
        <UserNav />
      </div>
    </div>
  )
}