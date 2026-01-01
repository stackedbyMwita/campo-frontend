"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
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
  Settings,
  ShieldAlert,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock
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

// --- COLUMNS FOR MINI TABLES ---

const pendingWithdrawalColumns: ColumnDef<AdminTransaction>[] = [
  {
    accessorKey: "userId",
    header: "User",
    cell: ({ row }) => {
      const user = row.original.userId as any; // Populated or ID
      return <span className="font-medium">{user?.firstName || "Unknown"} {user?.lastName || ""}</span>
    }
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="font-bold text-orange-600">{formatMoney(row.original.amount)}</span>
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => <span className="text-xs font-mono">{row.original.phoneNumber}</span>
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
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <Badge variant="outline" className="text-[10px]">{row.original.category}</Badge>
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'OPEN' ? 'default' : 'secondary'} className="text-[10px]">
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
  // 1. FETCH ALL DATA PARALLEL
  const { data: analytics } = useQuery({ queryKey: ["admin", "analytics"], queryFn: adminApi.getAnalytics });
  const { data: riskReport } = useQuery({ queryKey: ["admin", "risk"], queryFn: adminApi.getRiskReport });
  const { data: config } = useQuery({ queryKey: ["admin", "config"], queryFn: adminApi.getConfig });
  
  // Lists (Limit 5)
  const { data: pendingWithdrawals } = useQuery({ queryKey: ["admin", "withdrawals", "pending"], queryFn: () => adminApi.getPendingWithdrawals(1, 5) });
  const { data: recentTransactions } = useQuery({ queryKey: ["admin", "transactions", "recent"], queryFn: () => adminApi.getAllTransactions(1, 5) });
  const { data: recentTickets } = useQuery({ queryKey: ["admin", "tickets", "recent"], queryFn: () => adminApi.getAllTickets() }); // Assuming API supports limit or we slice

  // Prepare Chart Data
  const financialData = analytics ? [
    { name: 'Deposits', amount: analytics.data.financials.totalDeposits / 100, color: '#16a34a' },
    { name: 'Withdrawals', amount: analytics.data.financials.totalWithdrawals / 100, color: '#ea580c' },
    { name: 'Profit', amount: analytics.data.financials.realProfit / 100, color: '#2563eb' },
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- HEADER & RISK ALERT --- */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        
        {/* Risk Banner - Only show if issues exist */}
        {riskReport?.data && (Object.keys(riskReport.data.multiAccounting || {}).length > 0 || riskReport.data.botActivity.length > 0) && (
          <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Risk Activity Detected</AlertTitle>
            <AlertDescription>
              Potential multi-accounting or bot activity detected. Check the Risk Report tab immediately.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financial Activity</TabsTrigger>
          <TabsTrigger value="support">Support & Config</TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: OVERVIEW ==================== */}
        <TabsContent value="overview" className="space-y-4">
          
          {/* STATS GRID */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.data.users.total || 0}</div>
                <p className="text-xs text-muted-foreground">Registered accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash on Hand</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatMoney(analytics?.data.financials.cashOnHand || 0)}</div>
                <p className="text-xs text-muted-foreground">Available liquidity</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Real Profit</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatMoney(analytics?.data.financials.realProfit || 0)}</div>
                <p className="text-xs text-muted-foreground">Net earnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatMoney(analytics?.data.financials.pendingWithdrawals || 0)}</div>
                <p className="text-xs text-muted-foreground">Requires approval</p>
              </CardContent>
            </Card>
          </div>

          {/* GRAPHS & CONFIG ROW */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            
            {/* CHART */}
            <Card className="col-span-4">
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
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Current operational settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Maintenance Mode</span>
                  <Badge variant={config?.data.isMaintenanceMode ? "destructive" : "outline"}>
                    {config?.data.isMaintenanceMode ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Activation Fee</span>
                  <span className="font-medium">{formatMoney(config?.data.activationFee || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Min Withdrawal</span>
                  <span className="font-medium">{formatMoney(config?.data.minWithdrawalAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-sm text-muted-foreground">Referral Bonus</span>
                   <span className="font-medium">{formatMoney(config?.data.referralBonus || 0)}</span>
                </div>
                <div className="pt-4">
                   <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Current Announcement</p>
                   <div className="p-3 bg-muted/50 rounded-md text-sm italic">
                     "{config?.data.announcement || "No active announcements"}"
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
                  <CardDescription>Latest 5 requests needing approval</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  View All <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <AppTable 
                  columns={pendingWithdrawalColumns}
                  data={pendingWithdrawals?.data || []}
                  isLoading={!pendingWithdrawals}
                  pageCount={1}
                  pageIndex={1}
                  onPageChange={() => {}}
                />
              </CardContent>
            </Card>

            {/* RECENT TRANSACTIONS */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest 5 financial movements</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                   View All <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTransactions?.data.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.direction === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.direction === 'CREDIT' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{tx.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={`font-bold ${tx.direction === 'CREDIT' ? 'text-green-600' : 'text-slate-900'}`}>
                         {tx.direction === 'CREDIT' ? '+' : '-'}{formatMoney(tx.amount)}
                       </span>
                       <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(tx.createdAt))} ago</p>
                    </div>
                  </div>
                ))}
                {!recentTransactions && <div className="p-4 text-center text-muted-foreground">Loading transactions...</div>}
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
              <Button variant="outline" size="sm" className="h-8 gap-1">
                 View All <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Slice to ensure we only show 5 if API returns all */}
              <AppTable 
                 columns={ticketColumns}
                 data={recentTickets?.data?.slice(0, 5) || []}
                 isLoading={!recentTickets}
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
