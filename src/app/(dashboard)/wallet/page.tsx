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
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard, 
  History, 
  RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/payment.service";

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

export default function WalletPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  
  const { 
    balance, 
    useTransactions, 
    initiateDeposit, 
    isDepositing, 
    requestWithdrawal, 
    isWithdrawing 
  } = useWallet();

  const { data: txData, isLoading: txLoading, refetch } = useTransactions(page);
  const totalBalance = (balance?.walletBalance || 0) +(balance?.referralEarnings || 0);

  return (
    // 1. Removed 'max-w-6xl mx-auto' to match Dashboard consistency
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500 w-full">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">Manage your earnings and deposits.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        
        {/* --- LEFT: VIRTUAL CARD & ACTIONS --- */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* The "Credit Card" Visual */}
          <div className="relative w-full aspect-[1.586] overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-xl">
            {/* Abstract Background Shapes */}
            <div className="absolute -top-1/2 -right-1/2 h-full w-full rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-blue-500/10 blur-2xl" />
            
            <div className="relative p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                <span className="font-mono text-[10px] sm:text-xs opacity-50 tracking-widest">VIRTUAL WALLET</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs sm:text-sm opacity-70">Available Balance</p>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                  {formatMoney(totalBalance)}
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                 <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Task Earnings</p>
                 <p className="font-bold text-base sm:text-lg text-blue-600 truncate w-full">
                    {formatMoney(balance?.taskEarnings)}
                 </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                 <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Referral Bonus</p>
                 <p className="font-bold text-base sm:text-lg text-green-600 truncate w-full">
                    {formatMoney(balance?.referralEarnings)}
                 </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons: Stack on mobile, Row on Tablet+ */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
             <DepositDialog 
              // Step 1: Trigger STK Push
              onInitiate={async (amount, phone) => {
                // We assume initiateDeposit returns the API response containing 'checkoutRequestID'
                // If your hook doesn't return it, you might need to use paymentService.initiateSTK directly
                return await paymentService.initiateSTK({ amount, phoneNumber: phone });
              }}
              
              // Step 2: Confirm the Receipt
              onConfirm={async (checkoutID, receipt) => {
                return await paymentService.confirmPayment({
                  CheckoutRequestID: checkoutID,
                  MpesaReceiptNumber: receipt,
                  Status: "Success"
                });
              }}
              
              isLoading={isDepositing} // You might need separate loading states if you want to be precise
              defaultPhone={user?.phoneNumber}
            />
             <WithdrawDialog 
                // Update: Accepts (amount, phone) directly from the dialog
                onWithdraw={async (amountInCents, phone) => {
                  return await requestWithdrawal({ 
                    amount: amountInCents, 
                    phoneNumber: phone 
                  });
                }}
                
                isLoading={isWithdrawing}
                maxAmount={totalBalance} // Ensure this is the balance in CENTS
                defaultPhone={user?.phoneNumber}
              />
          </div>
        </div>

        {/* --- RIGHT: TRANSACTION HISTORY --- */}
        <div className="lg:col-span-2 min-w-0"> {/* min-w-0 prevents table overflow causing layout break */}
          <Card className="h-full border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5" /> Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AppTable 
                columns={columns}
                data={txData?.data || []}
                isLoading={txLoading}
                pageCount={txData?.pagination.totalPages}
                pageIndex={page}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
