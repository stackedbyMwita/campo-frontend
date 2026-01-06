"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { useAdmin } from "@/context/admin-context";
import { formatMoney } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  AlertTriangle, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity,
  ShieldAlert,
  List,
  FileText
} from "lucide-react";

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppTable } from "@/components/tables/app-table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { AdminTransaction, SupportTicket } from "@/types/admin";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// --- COLUMN DEFINITIONS ---

const pendingWithdrawalColumns: ColumnDef<AdminTransaction>[] = [
  {
    accessorKey: "userId",
    header: "User",
    cell: ({ row }) => {
      const user = row.original.userId as any; 
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{user?.firstName} {user?.lastName}</span>
          <span className="text-[10px] text-muted-foreground">{row.original.phoneNumber}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="font-bold text-orange-600">{formatMoney(row.original.amount)}</span>
  },
  {
    accessorKey: "createdAt",
    header: "Requested",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(row.original.createdAt))} ago</span>
  }
];

const ticketColumns: ColumnDef<SupportTicket>[] = [
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => <span className="font-medium line-clamp-1">{row.original.subject}</span>
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'OPEN' ? 'default' : 'secondary'} className="text-[10px] px-1 py-0 h-5">
        {row.original.status}
      </Badge>
    )
  },
  {
    accessorKey: "createdAt",
    header: "Opened",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(row.original.createdAt))} ago</span>
  }
];

export default function AdminDashboardPage() {
  // 1. GET GLOBAL DATA FROM CONTEXT (No Re-fetch)
  const { analytics, config, isLoading: ctxLoading } = useAdmin();

  // 2. FETCH PAGE-SPECIFIC LISTS (Parallel)
  const { data: riskReport, isLoading: riskLoading } = useQuery({ 
    queryKey: ["admin", "risk"], 
    queryFn: adminApi.getRiskReport 
  });
  
  const { data: pendingWithdrawals, isLoading: pwLoading } = useQuery({ 
    queryKey: ["admin", "withdrawals", "pending"], 
    queryFn: () => adminApi.getPendingWithdrawals(1, 5) 
  });
  
  const { data: recentTransactions, isLoading: txLoading } = useQuery({ 
    queryKey: ["admin", "transactions", "recent"], 
    queryFn: () => adminApi.getAllTransactions(1, 5) 
  });
  
  const { data: recentTickets, isLoading: ticketLoading } = useQuery({ 
    queryKey: ["admin", "tickets", "recent"], 
    queryFn: () => adminApi.getAllTickets() 
  });

  // 3. PREPARE CHART DATA (Memoized)
  const financialData = useMemo(() => {
    if (!analytics?.financials) return [];
    return [
      { name: 'Deposits', amount: analytics.financials.totalDeposits / 100, color: '#16a34a' },
      { name: 'Withdrawals', amount: analytics.financials.totalWithdrawals / 100, color: '#ea580c' },
      { name: 'Profit', amount: analytics.financials.realProfit / 100, color: '#2563eb' },
    ];
  }, [analytics]);

  const hasRiskIssues = riskReport?.data && (
    Object.keys(riskReport.data.multiAccounting || {}).length > 0 || 
    riskReport.data.botActivity.length > 0
  );

  if (ctxLoading) {
    return <div className="p-8 space-y-4">
      <Skeleton className="h-12 w-1/3" />
      <div className="grid grid-cols-4 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
    </div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        
        {/* Risk Banner */}
        {hasRiskIssues && (
          <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Risk Activity Detected</AlertTitle>
            <AlertDescription>
              Potential multi-accounting or bot activity detected. 
              <Link href="/admin/risk" className="underline font-bold ml-1">View Report</Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financial Activity</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: OVERVIEW ==================== */}
        <TabsContent value="overview" className="space-y-4">
          
          {/* STATS GRID */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard 
              title="Total Deposits" 
              value={formatMoney(analytics?.financials.totalDeposits || 0)} 
              sub="Registered accounts" 
              icon={Users} 
            />
            <StatsCard 
              title="Total Users" 
              value={analytics?.users.total || 0} 
              sub="Registered accounts" 
              icon={Users} 
            />
            <StatsCard 
              title="Cash on Hand" 
              value={formatMoney(analytics?.financials.cashOnHand || 0)} 
              sub="Available liquidity" 
              icon={Wallet} 
              valueColor="text-green-600" 
            />
            <StatsCard 
              title="Real Profit" 
              value={formatMoney(analytics?.financials.realProfit || 0)} 
              sub="Net earnings" 
              icon={Activity} 
              valueColor="text-blue-600" 
            />
            <StatsCard 
              title="Pending Payouts" 
              value={formatMoney(analytics?.financials.pendingWithdrawals || 0)} 
              sub="Requires approval" 
              icon={AlertTriangle} 
              valueColor="text-orange-600" 
            />
          </div>

          {/* GRAPHS & CONFIG ROW */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            
            {/* CHART */}
            <Card className="col-span-4 ">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Deposits vs Withdrawals vs Profit</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `KSh ${value}`} 
                      />
                      <Tooltip 
                         formatter={(value: any) => [formatMoney(Number(value || 0)), 'Amount']}
                         cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {financialData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* SYSTEM CONFIG SUMMARY */}
            <Card className="col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                   <CardTitle>System Config</CardTitle>
                   <CardDescription>Operational settings</CardDescription>
                </div>
                <Link href="/admin/settings">
                  <Button variant="ghost" size="icon"><List className="h-4 w-4" /></Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <ConfigRow label="Maintenance Mode">
                   <Badge variant={config?.isMaintenanceMode ? "destructive" : "outline"}>
                    {config?.isMaintenanceMode ? "Enabled" : "Disabled"}
                  </Badge>
                </ConfigRow>
                <ConfigRow label="Activation Fee" value={config?.activationFee || 0} />
                <ConfigRow label="Min Withdrawal" value={config?.minWithdrawalAmount || 0} />
                <ConfigRow label="Referral Bonus" value={config?.referralBonus || 0} />
                
                <div className="pt-4">
                   <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Current Announcement</p>
                   <div className="p-3 bg-muted/50 rounded-md text-xs italic flex items-start gap-2">
                     <FileText className="h-3 w-3 mt-1 shrink-0" />
                     "{config?.announcement || "No active announcements"}"
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== TAB 2: FINANCIALS ==================== */}
        <TabsContent value="financials" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            
            {/* PENDING WITHDRAWALS */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Pending Withdrawals</CardTitle>
                  <CardDescription>Latest requests</CardDescription>
                </div>
                <Link href="/admin/withdrawals">
                  <Button variant="outline" size="sm" className="h-8 gap-1">View All <ArrowUpRight className="h-4 w-4" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                <AppTable 
                  columns={pendingWithdrawalColumns}
                  data={pendingWithdrawals?.data || []}
                  isLoading={pwLoading}
                  pageCount={1}
                  pageIndex={1}
                  onPageChange={() => {}} // No pagination for dashboard widget
                />
              </CardContent>
            </Card>

            {/* RECENT TRANSACTIONS */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest financial movements</CardDescription>
                </div>
                <Link href="/admin/transactions">
                  <Button variant="outline" size="sm" className="h-8 gap-1">View All <ArrowUpRight className="h-4 w-4" /></Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-0">
                {txLoading ? <div className="p-4 text-center">Loading...</div> : recentTransactions?.data.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.direction === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.direction === 'CREDIT' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{tx.type.replace(/_/g, ' ').toLowerCase()}</p>
                        <p className="text-xs text-muted-foreground">{tx.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                        <span className={`font-bold text-sm ${tx.direction === 'CREDIT' ? 'text-green-600' : 'text-slate-900 dark:text-slate-100'}`}>
                          {tx.direction === 'CREDIT' ? '+' : '-'}{formatMoney(tx.amount)}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(tx.createdAt))} ago</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== TAB 3: SUPPORT ==================== */}
        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Latest Support Tickets</CardTitle>
                <CardDescription>Recently opened inquiries</CardDescription>
              </div>
              <Link href="/admin/support">
                <Button variant="outline" size="sm" className="h-8 gap-1">View All <ArrowUpRight className="h-4 w-4" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              <AppTable 
                 columns={ticketColumns}
                 data={recentTickets?.data?.slice(0, 5) || []}
                 isLoading={ticketLoading}
                 pageCount={1}
                 pageIndex={1}
                 onPageChange={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

// --- SUB-COMPONENTS FOR CLEANER JSX ---

function StatsCard({ title, value, sub, icon: Icon, valueColor = "" }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

function ConfigRow({ label, value, children }: any) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children || <span className="font-medium text-sm">{value}</span>}
    </div>
  )
}
