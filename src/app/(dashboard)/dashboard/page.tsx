"use client"

import React from "react";
import Link from "next/link";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Users, 
  ListTodo, 
  TrendingUp, 
  CreditCard,
  DollarSign,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardWidget } from "@/components/dashboard/dashboard-widget";

// Hooks & API
import { useAuth } from "@/context/auth-context";
import { useWallet } from "@/hooks/use-wallet";
import { userAPI } from "@/services/api";
import { formatMoney } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // 1. Fetch Wallet & Transactions
  const { balance, useTransactions } = useWallet();
  const { data: txData, isLoading: loadingTx } = useTransactions(1); // Page 1

  // 3. Fetch Referrals (Inline Query for Dashboard)
  const { data: refData, isLoading: loadingRef } = useQuery({
    queryKey: ["referrals", "recent"],
    queryFn: () => userAPI.getReferrals(1),
  });

  // Derived Metrics
  const totalEarnings = (balance?.taskEarnings || 0) + (balance?.referralEarnings || 0);
  const totalBalance = 
    (balance?.taskEarnings || 0) +
    (balance?.referralEarnings || 0) +
    (balance?.totalDeposits || 0)
  ;
  const availableBalance = (balance?.walletBalance || 0) + (balance?.referralEarnings || 0);
  const recentTransactions = txData?.data.slice(0, 5) || [];
  const recentReferrals = refData?.data.slice(0, 5) || [];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 ">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between ">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
             <Link href="/wallet">
               <ArrowDownLeft className="mr-2 h-4 w-4" /> Deposit
             </Link>
          </Button>
          <Button asChild size="sm">
             <Link href="/tasks">
               <ListTodo className="mr-2 h-4 w-4" /> Start Earning
             </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* --- METRICS GRID --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Wallet Balance */}
        <Card className="bg-primary text-primary-foreground shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Wallet className="h-24 w-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90">
              Total Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalBalance)}</div>
            <p className="text-xs text-primary-foreground/70 mt-1">
              Total Earnings plus Deposits
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(balance?.taskEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime gross income
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Tasks Available */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals Earnings</CardTitle>
            <ListTodo className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
               {formatMoney(balance?.referralEarnings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fresh tasks for today
            </p>
          </CardContent>
        </Card>
        {/* Card 3: Tasks Available */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total tasks completed</CardTitle>
            <ListTodo className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
               20
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fresh tasks for today
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Referral Tier */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Tier</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {user?.tier || 1}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Refer more to upgrade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- WIDGETS SECTION --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Left: Recent Transactions (Span 4) */}
        <div className="col-span-4">
          <DashboardWidget 
            title="Recent Transactions"
            description="Your latest financial movements."
            icon={CreditCard}
            viewAllLink="/wallet"
            data={recentTransactions}
            isLoading={loadingTx}
            columns={[
              {
                header: "Reference",
                accessorKey: "reference",
                className: "hidden sm:table-cell text-xs text-muted-foreground font-mono"
              },
              {
                header: "Type",
                cell: (tx) => (
                  <div className="flex flex-col">
                    <span className="font-medium text-sm capitalize">
                      {tx.type.replace("_", " ").toLowerCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(tx.createdAt), "MMM dd, HH:mm")}
                    </span>
                  </div>
                )
              },
              {
                header: "Status",
                cell: (tx) => (
                  <Badge 
                    variant={tx.status === "COMPLETED" || tx.status === "APPROVED" ? "default" : "secondary"} 
                    className={
                      tx.status === "FAILED" ? "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" :
                      tx.status === "PENDING" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                    }
                  >
                    {tx.status}
                  </Badge>
                )
              },
              {
                header: "Amount",
                className: "text-right font-medium",
                cell: (tx) => (
                  <span className={tx.direction === "CREDIT" ? "text-green-600 dark:text-green-400" : "text-foreground"}>
                    {tx.direction === "CREDIT" ? "+" : "-"} {formatMoney(tx.amount)}
                  </span>
                )
              }
            ]}
          />
        </div>

        {/* Right: Recent Referrals (Span 3) */}
        <div className="col-span-3">
          <DashboardWidget 
             title="Recent Referrals"
             description="People who joined using your link."
             icon={Users}
             viewAllLink="/referrals"
             data={recentReferrals}
             isLoading={loadingRef}
             columns={[
               {
                 header: "User",
                 cell: (ref) => (
                   <div className="flex items-center gap-3">
                     <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-primary/10 text-primary text-xs">
                         {ref.firstName.charAt(0)}
                       </AvatarFallback>
                     </Avatar>
                     <div className="flex flex-col">
                       <span className="text-sm font-medium">{ref.firstName} {ref.lastName}</span>
                       <span className="text-xs text-muted-foreground">{ref.email}</span>
                     </div>
                   </div>
                 )
               },
               {
                 header: "Status",
                 className: "text-right",
                 cell: (ref) => (
                    <div className="flex justify-end">
                      {ref.isActive ? (
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px] shadow-green-500/50" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                      )}
                    </div>
                 )
               }
             ]}
          />
        </div>

      </div>
    </div>
  );
}