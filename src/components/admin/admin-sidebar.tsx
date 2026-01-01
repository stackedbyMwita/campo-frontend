"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ListChecks,
  Settings,
  ShieldAlert,
  MessageSquare,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { ThemeToggle } from "../theme-toggle";

const adminRoutes = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    color: "text-sky-500",
  },
  {
    label: "User Management",
    icon: Users,
    href: "/admin/users",
    color: "text-violet-500",
  },
  {
    label: "Task Center",
    icon: ListChecks,
    href: "/admin/tasks",
    color: "text-pink-500",
  },
  {
    label: "Withdrawals",
    icon: CreditCard,
    href: "/admin/withdrawals",
    color: "text-orange-500",
  },
  {
    label: "Support Tickets",
    icon: MessageSquare,
    href: "/admin/support",
    color: "text-emerald-500",
  },
  {
    label: "Risk & Security",
    icon: ShieldAlert,
    href: "/admin/risk",
    color: "text-red-500",
  },
  {
    label: "System Config",
    icon: Settings,
    href: "/admin/settings",
    color: "text-gray-500",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Reusable Nav Content
  const NavContent = () => (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
      <div className="px-6 py-2">
        <h1 className="text-2xl font-bold bg-linear-to-r from-sky-400 to-blue-500 text-transparent bg-clip-text">
          AdminPanel
        </h1>
        <p className="text-xs text-slate-400 mt-1">System Administration</p>
      </div>
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {adminRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2 border flex items-center gap-2">
        <Button 
          onClick={logout}
          variant="ghost" 
          className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <NavContent />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <div className="md:hidden flex items-center p-4 border-b bg-slate-900 text-white sticky top-0 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-slate-900 border-r-slate-800 text-white w-72">
            <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
            <NavContent />
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-bold text-lg">Admin Panel</span>
      </div>
    </>
  );
}
