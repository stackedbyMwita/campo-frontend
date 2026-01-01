"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { formatMoney } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Wallet, 
  Shield, 
  CreditCard, 
  History, 
  CheckCircle2, 
  XCircle,
  Clock,
  Ban,
  Upload
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Helper for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
    case "COMPLETED": return "text-green-600 bg-green-100";
    case "PENDING": return "text-yellow-600 bg-yellow-100";
    case "REJECTED":
    case "FAILED": return "text-red-600 bg-red-100";
    default: return "text-slate-600 bg-slate-100";
  }
};

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => adminApi.getUserDetails(id),
  });

  // Example Mutation: Update Tier
  const updateTierMutation = useMutation({
    mutationFn: (newTier: number) => adminApi.updateUserTier(id, newTier),
    onSuccess: () => {
      toast.success("User tier updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "user", id] });
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading user profile...</div>;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <p className="text-red-500 font-medium">User not found or error loading data.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const { profile, recentActivity } = data.data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. TOP NAV & HEADER */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/admin/users" 
          className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-slate-100">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {profile.firstName[0]}{profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{profile.email}</span>
                <span>•</span>
                <span className="font-mono">{profile.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                 <Badge variant="outline">Tier {profile.tier}</Badge>
                 {profile.isActive ? (
                   <Badge className="bg-green-600">Active</Badge>
                 ) : (
                   <Badge variant="destructive">Suspended</Badge>
                 )}
                 <span className="text-xs text-muted-foreground ml-2">
                   Joined {format(new Date(profile.createdAt), "PPP")}
                 </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => updateTierMutation.mutate(profile.tier === 1 ? 2 : 1)}>
               <Shield className="mr-2 h-4 w-4" />
               {profile.tier === 1 ? "Upgrade Tier" : "Change Tier"}
            </Button>
            <Button variant="destructive" size="sm">
               <Ban className="mr-2 h-4 w-4" /> Suspend
            </Button>
          </div>
        </div>
      </div>

      {/* 2. WALLET STATS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatMoney(profile.wallet.walletBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Available to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Earnings</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(profile.wallet.taskEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total lifetime work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposits</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(profile.wallet.totalDeposits)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime top-ups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withdrawals</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(profile.wallet.totalWithdrawals)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total paid out</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. ACTIVITY TABS */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* TAB: TASKS */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Log</CardTitle>
            </CardHeader>
            <CardContent>
              {!recentActivity.taskLogs.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No tasks completed yet.</div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.taskLogs.map((log) => (
                    <div key={log._id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-full border shadow-sm">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{log.taskId?.title || "Deleted Task"}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.completedAt), "MMM d, h:mm a")} • {log.durationSeconds}s duration
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="block font-bold text-green-600">+{formatMoney(log.earnedAmount)}</span>
                         <Badge variant="outline" className={`mt-1 text-[10px] ${getStatusColor(log.status)} border-0`}>
                           {log.status}
                         </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: TRANSACTIONS */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {!recentActivity.transactions.length ? (
                 <div className="text-center py-8 text-muted-foreground text-sm">No transactions found.</div>
              ) : (
                <div className="space-y-0 divide-y">
                  {recentActivity.transactions.map((tx) => (
                    <div key={tx._id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                         {tx.type === 'DEPOSIT' ? (
                           <div className="bg-green-100 p-2 rounded-full"><Upload className="h-4 w-4 text-green-600" /></div>
                         ) : (
                           <div className="bg-orange-100 p-2 rounded-full"><ArrowLeft className="h-4 w-4 text-orange-600 rotate-45" /></div>
                         )}
                         <div>
                           <p className="font-medium text-sm capitalize">{tx.type.toLowerCase().replace('_', ' ')}</p>
                           <p className="text-xs text-muted-foreground">{tx.description || tx.reference}</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <span className={`block font-bold ${tx.direction === 'CREDIT' ? 'text-green-600' : 'text-slate-900'}`}>
                          {tx.direction === 'CREDIT' ? '+' : '-'}{formatMoney(tx.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(tx.createdAt), "MMM d")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
