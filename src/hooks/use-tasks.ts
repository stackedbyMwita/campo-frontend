"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskAPI } from "@/services/api";
import { toast } from "sonner";
import { 
  TaskSession, 
  TaskHistoryItem, 
  TaskSubmitResponse,
  PaginatedResponse 
} from "@/types/api"; 
import { WALLET_KEYS } from "./use-wallet";
import { formatMoney } from "@/lib/utils";

export const TASK_KEYS = {
  all: ["tasks"] as const,
  available: () => [...TASK_KEYS.all, "available"] as const,
  history: (page: number) => [...TASK_KEYS.all, "history", page] as const,
};

// 1. Hook for Available Tasks
// FIX: Changed <Task[]> to <TaskSession | null>
export function useAvailableTasks() {
  return useQuery<TaskSession | null>({ 
    queryKey: TASK_KEYS.available(),
    queryFn: async () => {
       const res = await taskAPI.getDailyTask();
       return res; 
    },
    staleTime: 60 * 1000,
  });
}

// 2. Hook for History
// FIX: Changed <HistoryItem[]> to <PaginatedResponse<TaskHistoryItem>>
// If you only want the list, you can select it using the `select` option, 
// but it is safer to type the whole response.
export function useTaskHistory(page: number) {
  return useQuery<PaginatedResponse<TaskHistoryItem>>({
    queryKey: TASK_KEYS.history(page),
    queryFn: async () => {
      const res = await taskAPI.getHistory(page);
      return res; 
    },
    placeholderData: (previousData) => previousData,
  });
}

// 3. Hook for Submission
// src/hooks/use-tasks.ts

export function useSubmitTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      // 1. Remove the 'as unknown' casting. It blinds us to the real data.
      // We await the result to ensure any network errors are caught here.
      const response = await taskAPI.submitTask(sessionId);
      return response;
    },

    onSuccess: (response: any) => {
      // 2. Safely extract the reward. 
      // It handles if the backend returns { data: { reward: 100 } } OR just { reward: 100 }
      const rewardAmount = response?.data?.reward ?? response?.reward ?? 0;

      toast.success("Task Completed!", {
        description: `You earned ${formatMoney(rewardAmount)}. Awaiting for admin approval before withdrawing.`,
      });

      // 3. Refresh Data
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: WALLET_KEYS.all });
    },

    onError: (error: any) => {
      const msg = error?.response?.data?.message 
        || error?.message 
        || "Submission failed.";
        
      toast.error("Error", { description: msg });
    }
  });
}