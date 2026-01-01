"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supportAPI } from "@/services/api";
import { toast } from "sonner";
import { TicketRequest } from "@/types/api";

export const SUPPORT_KEYS = {
  all: ["support"] as const,
  list: () => [...SUPPORT_KEYS.all, "list"] as const,
};

export function useSupport() {
  const queryClient = useQueryClient();

  // 1. READ: Get My Tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: SUPPORT_KEYS.list(),
    queryFn: () => supportAPI.getMyTickets(),
    // Data stays fresh for 1 minute, but we can manually refresh via button
    staleTime: 60 * 1000, 
  });

  // 2. WRITE: Create New Ticket
  const createTicketMutation = useMutation({
    mutationFn: (data: TicketRequest) => supportAPI.createTicket(data),
    onSuccess: () => {
      toast.success("Ticket Created", {
        description: "Support team will review it shortly.",
      });
      // Refresh the list so the new ticket appears immediately
      queryClient.invalidateQueries({ queryKey: SUPPORT_KEYS.all });
    },
    onError: (error: any) => {
      toast.error("Failed to create ticket", {
        description: error?.response?.data?.message || "Please try again.",
      });
    }
  });

  // 3. WRITE: Reply to Ticket
  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => 
      supportAPI.replyTicket(id, message),
      
    onSuccess: () => {
      toast.success("Reply Sent");
      // Refresh list to show the new message in the chat thread
      queryClient.invalidateQueries({ queryKey: SUPPORT_KEYS.all });
    },
    onError: (error: any) => {
      toast.error("Message failed", {
        description: error?.response?.data?.message,
      });
    }
  });

  return {
    // Data
    tickets: tickets || [], // Always return array to avoid undefined errors
    isLoading,

    // Actions
    createTicket: createTicketMutation.mutateAsync,
    isCreating: createTicketMutation.isPending,

    replyTicket: replyMutation.mutateAsync,
    isReplying: replyMutation.isPending,
  };
}
