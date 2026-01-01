"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userAPI } from "@/services/api";
import { ReferralUser } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

// Components
import { AppTable } from "@/components/tables/app-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, Link as LinkIcon, Copy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { formatMoney } from "@/lib/utils";

// 1. Define Columns Definition
const columns: ColumnDef<ReferralUser>[] = [
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
             <span className="font-medium">{user.firstName} {user.lastName}</span>
             <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "tier",
    header: "Tier",
    cell: ({ row }) => <Badge variant="outline">Level {row.original.tier}</Badge>
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Active" : "Pending"}
      </Badge>
    )
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => <span className="text-muted-foreground text-sm">
      {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
    </span>
  },
];

export default function ReferralsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  // 2. Fetch Data (Paginated)
  const { data, isLoading } = useQuery({
    queryKey: ["referrals", page],
    queryFn: () => userAPI.getReferrals(page),
    placeholderData: (prev) => prev, // Keep data while fetching new page
  });

  // Helper to copy referral link
  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  const totalReferrals = data?.pagination.totalItems || 0
  const activeReferrals = data?.pagination.totalActive || 0;
  const totalReferralsEarnings = activeReferrals * 3000;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Referrals</h1>
        <p className="text-muted-foreground">Invite friends and earn commissions.</p>
      </div>

      {/* Stats / Link Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-3 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" /> Your Referral Link
            </CardTitle>
            <CardDescription>Share this link to earn bonuses when users activate.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <div className="flex-1 bg-background border rounded-md px-3 py-2 text-sm font-mono text-muted-foreground truncate">
               {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${user?.referralCode}` : "Loading..."}
            </div>
            <Button size="icon" variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-4xl font-bold flex items-center gap-2">
               <Users className="h-8 w-8 text-primary" />
               {totalReferrals}
             </div>
           </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Active Referrals</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-4xl font-bold flex items-center gap-2">
               <Users className="h-8 w-8 text-primary" />
               {activeReferrals}
             </div>
           </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total Referral Earnings</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="font-bold flex items-center gap-2">
               <Wallet className="h-4 w-4 text-primary" />
               {formatMoney(totalReferralsEarnings)}
             </div>
           </CardContent>
        </Card>
      </div>

      {/* The App Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <AppTable 
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            // Pagination Props
            pageCount={data?.pagination.totalPages || 1}
            pageIndex={page}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
