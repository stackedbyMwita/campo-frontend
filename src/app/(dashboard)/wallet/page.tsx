"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/context/auth-context";
import { formatMoney } from "@/lib/utils";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { Transaction } from "@/types/api";
import { DepositDialog, WithdrawDialog } from "@/components/wallet/wallet-actions";
import { AppTable } from "@/components/tables/app-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard, 
  History, 
  RefreshCw,
  Lock,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/payment.service";

// --- Types ---
type WalletSectionProps = {
  title: string;
  balanceAmount: number;
  user: any;
  transactions: Transaction[];
  isLoadingTx: boolean;
  page: number;
  setPage: (p: number) => void;
  totalPages?: number;
  // Action props
  onDeposit: (amount: number, phone: string) => Promise<any>;
  onConfirmDeposit: (id: string, receipt: string) => Promise<any>;
  onWithdraw: (amount: number, phone: string) => Promise<any>;
  isDepositing: boolean;
  isWithdrawing: boolean;
  // Logic switches
  canWithdraw: boolean;
  disclaimer?: string;
  gradientFrom?: string;
  gradientTo?: string;
};

// --- Table Columns ---
const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "type",
    header: "Transaction",
    cell: ({ row }) => {
      const type = row.original.type;
      const isCredit = row.original.direction === "CREDIT";
      return (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full shrink-0 ${isCredit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
             {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
          </div>
          <div className="flex flex-col">
            <span className="font-medium capitalize text-sm truncate">{type.replace("_", " ").toLowerCase()}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{row.original.reference}</span>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "COMPLETED" || row.original.status === "APPROVED" ? "default" : "secondary"} className="text-[10px]">
        {row.original.status}
      </Badge>
    )
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(row.original.createdAt), "MMM dd")}</span>
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className={`text-right font-bold whitespace-nowrap ${row.original.direction === "CREDIT" ? "text-green-600" : "text-foreground"}`}>
        {row.original.direction === "CREDIT" ? "+" : "-"} {formatMoney(row.original.amount)}
      </div>
    )
  }
];

// --- Reusable Wallet Section Component ---
const WalletSection = ({
  title,
  balanceAmount,
  user,
  transactions,
  isLoadingTx,
  page,
  setPage,
  totalPages,
  onDeposit,
  onConfirmDeposit,
  onWithdraw,
  isDepositing,
  isWithdrawing,
  canWithdraw,
  disclaimer,
  gradientFrom = "from-slate-900",
  gradientTo = "to-slate-800"
}: WalletSectionProps) => {
  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-3 mt-6">
      {/* --- LEFT: VIRTUAL CARD & ACTIONS --- */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* The "Credit Card" Visual */}
        <div className={`relative w-full aspect-[1.586] overflow-hidden rounded-2xl bg-linear-to-br ${gradientFrom} ${gradientTo} text-white shadow-xl transition-all duration-300`}>
          {/* Abstract Background Shapes */}
          <div className="absolute -top-1/2 -right-1/2 h-full w-full rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-white/5 blur-2xl" />
          
          <div className="relative p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
              <span className="font-mono text-[10px] sm:text-xs opacity-50 tracking-widest uppercase">{title}</span>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs sm:text-sm opacity-70">Available Balance</p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                {formatMoney(balanceAmount)}
              </h2>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] sm:text-[10px] opacity-50 uppercase tracking-wider">Account Holder</p>
                <p className="text-sm sm:text-base font-medium tracking-wide truncate max-w-[120px]">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] sm:text-[10px] opacity-50 uppercase tracking-wider">Phone</p>
                <p className="font-mono text-xs sm:text-sm opacity-90">
                    **** {user?.phoneNumber?.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
             {/* Deposit is typically global, but we include it here for access */}
             <DepositDialog 
               onInitiate={onDeposit}
               onConfirm={onConfirmDeposit}
               isLoading={isDepositing}
               defaultPhone={user?.phoneNumber}
             />

             {canWithdraw ? (
               <WithdrawDialog 
                 onWithdraw={onWithdraw}
                 isLoading={isWithdrawing}
                 maxAmount={balanceAmount}
                 defaultPhone={user?.phoneNumber}
               />
             ) : (
               <Button variant="secondary" disabled className="w-full sm:w-auto opacity-70 cursor-not-allowed">
                 <Lock className="mr-2 h-4 w-4" /> Withdraw
               </Button>
             )}
          </div>

          {/* Disclaimer for Locked Wallets */}
          {!canWithdraw && disclaimer && (
            <Alert variant="default" className="bg-amber-50 text-amber-900 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs">
                {disclaimer}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* --- RIGHT: TRANSACTION HISTORY --- */}
      <div className="lg:col-span-2 min-w-0">
        <Card className="h-full border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" /> {title} History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AppTable 
              columns={columns}
              data={transactions}
              isLoading={isLoadingTx}
              pageCount={totalPages}
              pageIndex={page}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function WalletPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("referrals");
  
  const { 
    balance, 
    useTransactions, 
    initiateDeposit, 
    isDepositing, 
    requestWithdrawal, 
    isWithdrawing 
  } = useWallet();

  const { data: txData, isLoading: txLoading, refetch } = useTransactions(page);

  // Helper to handle deposits (shared logic)
  const handleDeposit = async (amount: number, phone: string) => {
    return await paymentService.initiateSTK({ amount, phoneNumber: phone });
  };

  const handleConfirmDeposit = async (checkoutID: string, receipt: string) => {
    return await paymentService.confirmPayment({
      CheckoutRequestID: checkoutID,
      MpesaReceiptNumber: receipt,
      Status: "Success"
    });
  };

  const handleWithdraw = async (amount: number, phone: string) => {
    return await requestWithdrawal({ 
      amount: amount, 
      phoneNumber: phone 
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500 w-full">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">Manage your earnings, deposits and withdrawals.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* --- TABS --- */}
      <Tabs defaultValue="referrals" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="referrals">Referrals Wallet</TabsTrigger>
          <TabsTrigger value="tasks">Tasks Wallet</TabsTrigger>
        </TabsList>

        {/* 1. REFERRALS TAB */}
        <TabsContent value="referrals">
          <WalletSection 
            title="Referral Earnings"
            balanceAmount={balance?.referralEarnings || 0}
            user={user}
            // Ideally, you would filter txData based on type here if the API supported it
            transactions={txData?.data || []} 
            isLoadingTx={txLoading}
            page={page}
            setPage={setPage}
            totalPages={txData?.pagination.totalPages}
            onDeposit={handleDeposit}
            onConfirmDeposit={handleConfirmDeposit}
            onWithdraw={handleWithdraw}
            isDepositing={isDepositing}
            isWithdrawing={isWithdrawing}
            canWithdraw={true} // Active for referrals
            gradientFrom="from-emerald-900"
            gradientTo="to-emerald-800"
          />
        </TabsContent>

        {/* 2. TASKS TAB */}
        <TabsContent value="tasks">
          <WalletSection 
            title="Task Earnings"
            balanceAmount={balance?.taskEarnings || 0}
            user={user}
            transactions={txData?.data || []}
            isLoadingTx={txLoading}
            page={page}
            setPage={setPage}
            totalPages={txData?.pagination.totalPages}
            onDeposit={handleDeposit}
            onConfirmDeposit={handleConfirmDeposit}
            onWithdraw={handleWithdraw}
            isDepositing={isDepositing}
            isWithdrawing={isWithdrawing}
            canWithdraw={false} // Inactive for tasks
            disclaimer="Withdrawals for task earnings are currently locked. Tasks await admin approval for the wallet to be unlocked."
            gradientFrom="from-blue-900"
            gradientTo="to-blue-800"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}