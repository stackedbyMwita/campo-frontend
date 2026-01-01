"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { AdminUser } from "@/types/admin";
import { formatMoney } from "@/lib/utils";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { 
  MoreHorizontal, 
  Search, 
  Shield, 
  ShieldCheck, 
  Ban, 
  CheckCircle2,
  Eye
} from "lucide-react";

// Components
import { AppTable } from "@/components/tables/app-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- 1. DEFINE COLUMNS ---
const userColumns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground">
        {row.original.phoneNumber}
      </span>
    )
  },
  {
    accessorKey: "tier",
    header: "Tier",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono text-[10px]">
        Tier {row.original.tier}
      </Badge>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { isActive, isVerified } = row.original;
      return (
        <div className="flex gap-1">
          {isActive ? (
             <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5">
               Active
             </Badge>
          ) : (
             <Badge variant="destructive" className="text-[10px] px-1.5">
               Banned
             </Badge>
          )}
          {isVerified && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-[10px] px-1.5 border-blue-200">
               Verified
            </Badge>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: "balance",
    header: () => <div className="text-right">Balance</div>,
    cell: ({ row }) => {
      // Assuming 'walletBalance' is the withdrawable amount
      const balance = row.original.wallet?.walletBalance || 0;
      return (
        <div className="text-right font-medium">
          {formatMoney(balance)}
        </div>
      );
    }
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {format(new Date(row.original.createdAt), "MMM d, yyyy")}
      </span>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user._id}`} className="flex items-center cursor-pointer">
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
               <Ban className="mr-2 h-4 w-4" /> Ban User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// --- 2. PAGE COMPONENT ---
export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Debounce search could be added here, 
  // but for simplicity, we pass it directly (fetching on every keystroke usually fine for small admin panels)
  // or use a separate "debouncedSearch" state.
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page, search],
    queryFn: () => adminApi.getUsers(page, 10, { 
      // We assume your backend supports simple fuzzy search on these fields
      // If your backend expects specific fields, you might need to change this logic
      firstName: search || undefined
    }),
    placeholderData: (prev) => prev // Keep previous data while fetching new
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, tiers, and permissions.
          </p>
        </div>
        <Button>
           <ShieldCheck className="mr-2 h-4 w-4" /> Add Admin
        </Button>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border shadow-sm max-w-md">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search by name..." 
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset to page 1 on search
          }}
        />
      </div>

      {/* TABLE */}
      <Card className="h-full bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
        <CardContent>
          <AppTable 
            columns={userColumns}
            data={data?.data || []}
            isLoading={isLoading}
            pageCount={data?.pagination.totalPages || 1}
            pageIndex={page}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );

}