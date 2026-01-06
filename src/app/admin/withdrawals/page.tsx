"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { formatMoney } from "@/lib/utils";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft,
  FileText,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

// Components
import { AppTable } from "@/components/tables/app-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Types
import { AdminTransaction } from "@/types/admin";

export default function WithdrawalsPage() {
  const queryClient = useQueryClient();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("pending");
  
  // Pagination State for each tab
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [txPage, setTxPage] = useState(1);

  // Modal State
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [proof, setProof] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // --- QUERIES ---

  // 1. Pending Withdrawals
  const { data: pendingData, isLoading: isPendingLoading } = useQuery({
    queryKey: ["admin", "withdrawals", "pending", pendingPage],
    queryFn: () => adminApi.getPendingWithdrawals(pendingPage, 20),
    placeholderData: (prev) => prev,
  });

  // 2. Withdrawal History (Completed/Failed)
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["admin", "withdrawals", "history", historyPage],
    queryFn: () => adminApi.getWithdrawals(historyPage, 20),
    placeholderData: (prev) => prev,
  });

  // 3. All Transactions (Deposits + Withdrawals + Bonuses)
  const { data: txData, isLoading: isTxLoading } = useQuery({
    queryKey: ["admin", "transactions", txPage],
    queryFn: () => adminApi.getAllTransactions(txPage, 20),
    placeholderData: (prev) => prev,
  });

  // --- MUTATIONS ---

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!selectedTx || !proof) throw new Error("Transaction code required");
      return adminApi.approveWithdrawal(selectedTx._id, proof);
    },
    onSuccess: () => {
      toast.success("Withdrawal approved successfully");
      resetModals();
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] }); // Update dashboard stats
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Approval failed")
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!selectedTx || !rejectReason) throw new Error("Rejection reason required");
      return adminApi.rejectWithdrawal(selectedTx._id, rejectReason);
    },
    onSuccess: () => {
      toast.success("Withdrawal rejected");
      resetModals();
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Rejection failed")
  });

  // --- HELPERS ---
  const resetModals = () => {
    setSelectedTx(null);
    setActionType(null);
    setProof("");
    setRejectReason("");
  };

  const openActionModal = (tx: AdminTransaction, type: 'approve' | 'reject') => {
    setSelectedTx(tx);
    setActionType(type);
  };

  // --- COLUMNS ---

  const pendingColumns: ColumnDef<AdminTransaction>[] = useMemo(() => [
    {
      accessorKey: "userId",
      header: "User Details",
      cell: ({ row }) => {
        const user = row.original.userId as any;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{user?.firstName} {user?.lastName}</span>
            <span className="text-xs text-muted-foreground">{row.original.phoneNumber}</span>
          </div>
        )
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
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, HH:mm")
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            onClick={() => openActionModal(row.original, 'approve')}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => openActionModal(row.original, 'reject')}
          >
            <XCircle className="w-4 h-4 mr-1" /> Reject
          </Button>
        </div>
      )
    }
  ], []);

  const historyColumns: ColumnDef<AdminTransaction>[] = useMemo(() => [
    {
      accessorKey: "userId",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.userId as any;
        return <span className="font-medium">{user?.firstName || "Unknown"} {user?.lastName}</span>
      }
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="font-mono">{formatMoney(row.original.amount)}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'COMPLETED' ? 'default' : 'destructive'} className={status === 'COMPLETED' ? 'bg-green-600' : ''}>
            {status}
          </Badge>
        )
      }
    },
    {
      accessorKey: "updatedAt", // Show when it was processed
      header: "Processed Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{format(new Date(row.original.createdAt), "MMM d, yyyy HH:mm")}</span>
    },
  ], []);

  const txColumns: ColumnDef<AdminTransaction>[] = useMemo(() => [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.direction === 'CREDIT' 
            ? <ArrowDownLeft className="h-4 w-4 text-green-500" /> 
            : <ArrowUpRight className="h-4 w-4 text-red-500" />
          }
          <span className="capitalize">{row.original.type.replace(/_/g, " ").toLowerCase()}</span>
        </div>
      )
    },
    {
      accessorKey: "userId",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.userId as any;
        return <span className="text-sm">{user?.firstName || "System"} {user?.lastName}</span>
      }
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className={`font-mono font-medium ${row.original.direction === 'CREDIT' ? 'text-green-600' : 'text-slate-900'}`}>
           {row.original.direction === 'CREDIT' ? '+' : '-'}{formatMoney(row.original.amount)}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] h-5">
          {row.original.status}
        </Badge>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{format(new Date(row.original.createdAt), "MMM d, HH:mm")}</span>
    }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
        <p className="text-muted-foreground">Manage withdrawals, deposits, and view transaction history.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" /> Pending Requests
            {pendingData?.pagination?.totalItems > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 rounded-full text-[10px]">
                {pendingData.pagination.totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" /> Withdrawal History
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <Search className="h-4 w-4" /> All Transactions
          </TabsTrigger>
        </TabsList>

        {/* 1. PENDING TAB */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Withdrawals</CardTitle>
              <CardDescription>Review and approve payout requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingData?.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="bg-green-50 p-4 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-muted-foreground">No pending withdrawal requests at the moment.</p>
                </div>
              ) : (
                <AppTable 
                  columns={pendingColumns}
                  data={pendingData?.data || []}
                  isLoading={isPendingLoading}
                  pageCount={pendingData?.pagination?.totalPages || 1}
                  pageIndex={pendingPage}
                  onPageChange={setPendingPage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. HISTORY TAB */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>Past processed withdrawals.</CardDescription>
            </CardHeader>
            <CardContent>
              <AppTable 
                columns={historyColumns}
                data={historyData?.data || []}
                isLoading={isHistoryLoading}
                pageCount={historyData?.pagination?.totalPages || 1}
                pageIndex={historyPage}
                onPageChange={setHistoryPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. ALL TRANSACTIONS TAB */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Global Ledger</CardTitle>
              <CardDescription>All system financial movements.</CardDescription>
            </CardHeader>
            <CardContent>
              <AppTable 
                columns={txColumns}
                data={txData?.data || []}
                isLoading={isTxLoading}
                pageCount={txData?.pagination?.totalPages || 1}
                pageIndex={txPage}
                onPageChange={setTxPage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODALS --- */}

      {/* APPROVE MODAL */}
      <Dialog open={!!selectedTx && actionType === 'approve'} onOpenChange={(open) => !open && resetModals()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>
              Enter the transaction code (e.g., M-Pesa ID) to confirm payment of <span className="font-bold text-foreground">{selectedTx && formatMoney(selectedTx.amount)}</span> to <span className="font-bold text-foreground">{selectedTx?.phoneNumber}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="proof">Transaction Code / Proof</Label>
              <Input 
                id="proof" 
                placeholder="e.g. QWE123TYU" 
                value={proof} 
                onChange={(e) => setProof(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetModals}>Cancel</Button>
            <Button 
              onClick={() => approveMutation.mutate()} 
              disabled={approveMutation.isPending || !proof}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT MODAL */}
      <Dialog open={!!selectedTx && actionType === 'reject'} onOpenChange={(open) => !open && resetModals()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Reject Withdrawal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this request for {selectedTx && formatMoney(selectedTx.amount)}? The funds will be returned to the user's wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea 
                id="reason" 
                placeholder="e.g. Invalid phone number, Suspected fraud..." 
                value={rejectReason} 
                onChange={(e) => setRejectReason(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetModals}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => rejectMutation.mutate()} 
              disabled={rejectMutation.isPending || !rejectReason}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}