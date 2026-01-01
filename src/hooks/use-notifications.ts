"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationAPI } from "@/services/api";
import { toast } from "sonner";

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
};

export function useNotifications() {
  const queryClient = useQueryClient();

  // 1. READ: Poll for Notifications
  const { data, isLoading } = useQuery({
    queryKey: NOTIFICATION_KEYS.all,
    queryFn: () => notificationAPI.getAll(),
    
    // ✨ Polling: Check server every 30 seconds
    refetchInterval: 300 * 1000, 
    // Even if user clicks away to another tab, fetch when they return
    refetchOnWindowFocus: true,
  });

  // 2. WRITE: Mark Single as Read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationAPI.markRead(id),
    onSuccess: () => {
      // Refresh the list to update unread count
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });

  // 3. WRITE: Mark All as Read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => {
      toast.success("All caught up!");
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });

  return {
    // Data
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,

    // Actions
    markRead: markReadMutation.mutate, // Use .mutate for fire-and-forget
    markAllRead: markAllReadMutation.mutate,
  };
}