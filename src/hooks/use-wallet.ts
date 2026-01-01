"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentAPI, walletAPI } from "@/services/api";
import { toast } from "sonner";
import { DepositRequest, WithdrawRequest } from "@/types/api";

// Query Keys (Tags for our cache)
export const WALLET_KEYS = {
  all: ["wallet"] as const,
  balance: () => [...WALLET_KEYS.all, "balance"] as const,
  history: (page: number) => [...WALLET_KEYS.all, "history", page] as const,
};

export function useWallet() {
  const queryClient = useQueryClient();

  // --- 1. READ DATA (Queries) ---

  // A. Get Wallet Balance (Auto-refetches/caches)
  const balanceQuery = useQuery({
    queryKey: WALLET_KEYS.balance(),
    queryFn: async () => {
       // Since your backend returns the whole User object on /users/me, 
       // we might actually want to read from there or use a dedicated endpoint if you have one.
       // Based on your API list, we used 'walletAPI.getBalance' which maps to /wallet/balance 
       // (Ensure this endpoint exists, otherwise we fetch profile).
       return walletAPI.getBalance();
    },
    // Don't refetch too aggressively, money doesn't change every second
    staleTime: 30 * 1000, 
  });

  // B. Get Transactions History
  const useTransactions = (page = 1) => useQuery({
    queryKey: WALLET_KEYS.history(page),
    queryFn: () => paymentAPI.getTransactions(page),
    placeholderData: (previousData) => previousData, // Keep old data while fetching new page
  });

  // --- 2. WRITE DATA (Mutations) ---

  // C. Initiate Deposit (STK Push)
  const depositMutation = useMutation({
    mutationFn: (data: DepositRequest) => paymentAPI.initiateDeposit(data),
    onSuccess: () => {
      // Note: We don't refill balance here yet, because user hasn't paid.
      // The socket or manual refresh will handle that later.
    },
    onError: (error: any) => {
      toast.error("Deposit Failed", {
        description: error?.response?.data?.message || "Could not send STK Push",
      });
    }
  });

  // D. Request Withdrawal
  const withdrawMutation = useMutation({
    mutationFn: (data: WithdrawRequest) => paymentAPI.requestWithdrawal(data),
    onSuccess: () => {
      toast.success("Withdrawal Requested", {
        description: "We are processing your request.",
      });
      // CRITICAL: Tell React Query that 'balance' and 'history' are old now.
      // It will automatically refetch them in the background!
      queryClient.invalidateQueries({ queryKey: WALLET_KEYS.all });
    },
    onError: (error: any) => {
      toast.error("Withdrawal Failed", {
        description: error?.response?.data?.message || "Insufficient funds or invalid request.",
      });
    }
  });

  // Return everything in a neat package
  return {
    // Data
    balance: balanceQuery.data,
    isLoadingBalance: balanceQuery.isLoading,
    useTransactions, // This is a function we call in the component with page number

    // Actions
    initiateDeposit: depositMutation.mutateAsync,
    isDepositing: depositMutation.isPending,
    
    requestWithdrawal: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,
  };
}
