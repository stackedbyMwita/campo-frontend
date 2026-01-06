import { api, setAccessToken } from "@/lib/axios";
import { 
  AdminPaginatedResponse, 
  AdminSingleResponse, 
  DashboardAnalytics, 
  AdminUser, 
  AdminUserDetails, 
  AdminTask,
  AdminTransaction, 
  SystemConfig, 
  RiskReport,
  SupportTicket, 
  AdminQuestion,
  CreateQuestionDTO
} from "@/types/admin";

export const adminApi = {
  
  // ----------------------------------------------------------------
  // 📊 ANALYTICS
  // ----------------------------------------------------------------
  getAnalytics: async () => {
    const response = await api.get<AdminSingleResponse<DashboardAnalytics>>("/admin/analytics");
    return response.data;
  },

  // ----------------------------------------------------------------
  // 👥 USERS
  // ----------------------------------------------------------------
  getUsers: async (page = 1, limit = 20, filters?: any) => {
    // Note: MD specified a Body for GET, but in Axios we send params.
    // We map the filters object to query params for standard REST compliance.
    const response = await api.get<AdminPaginatedResponse<AdminUser>>(`/admin/users`, {
      params: { page, limit, ...filters }
    });
    return response.data;
  },

  // ✅ Matches backend: { tier: number }
  updateUserTier: async (userId: string, tier: number) => {
    const response = await api.patch<{ success: true, message: string }>(
      `/admin/users/${userId}/segment`, 
      { tier }
    );
    return response.data;
  },

  // ✅ Matches backend DTO exactly
  updateUserBalance: async (userId: string, data: { 
    amountInCents: number; 
    type: 'BONUS' | 'PENALTY'; 
    description: string; 
    targetWallet: 'TASK_EARNINGS' | 'REFERRAL_WALLET';
  }) => {
    const response = await api.patch<{ success: true, message: string }>(
      `/admin/users/${userId}/balance`, 
      data
    );
    return response.data;
  },

  getUserDetails: async (userId: string) => {
    console.log(`This is the userId: ${userId}`)
    const response = await api.get<AdminSingleResponse<AdminUserDetails>>(`/admin/users/${userId}`);
    return response.data;
  },

  // updateUserBalance: async (userId: string, data: { amountInCents: number; type: string; description: string; targetWallet: string }) => {
  //   const response = await api.patch<{ success: true, message: string }>(`/admin/users/${userId}/balance`, data);
  //   return response.data;
  // },

  // updateUserTier: async (userId: string, tier: number) => {
  //   const response = await api.patch<{ success: true, message: string }>(`/admin/users/${userId}/segment`, { tier });
  //   return response.data;
  // },

  // ----------------------------------------------------------------
  // ✅ QUESTIONS (Refactored from Tasks)
  // ----------------------------------------------------------------
  getQuestions: async (page = 1, limit = 20) => {
    // Matches GET /questions
    const response = await api.get<AdminPaginatedResponse<AdminQuestion>>(`/admin/questions`, {
      params: { page, limit }
    });
    return response.data;
  },

  getQuestion: async (questionId: string) => {
    // Matches GET /questions/:questionId
    const response = await api.get(`/admin/questions/${questionId}`);
    return response.data;
  },

  createQuestion: async (data: CreateQuestionDTO) => {
    // Matches POST /questions
    const response = await api.post<AdminSingleResponse<AdminTask>>("/admin/questions", data);
    return response.data;
  },

  updateQuestion: async (questionId: string, data: Partial<CreateQuestionDTO>) => {
    // Matches PATCH /questions/:questionId
    const response = await api.patch<AdminSingleResponse<AdminTask>>(`/admin/questions/${questionId}`, data);
    return response.data;
  },

  deleteQuestion: async (questionId: string) => {
    // Matches DELETE /questions/:questionId
    const response = await api.delete<{ success: true, message: string }>(`/admin/questions/${questionId}`);
    return response.data;
  },

  // ----------------------------------------------------------------
  // 💰 TRANSACTIONS & WITHDRAWALS
  // ----------------------------------------------------------------
  getWithdrawals: async (page = 1, limit = 20) => {
    const response = await api.get<AdminPaginatedResponse<AdminTransaction>>(`/admin/withdrawals`, {
      params: { page, limit }
    });
    return response.data;
  },

  getPendingWithdrawals: async (page = 1, limit = 20) => {
    const response = await api.get<AdminPaginatedResponse<AdminTransaction>>(`/admin/withdrawals/pending`, {
      params: { page, limit }
    });
    return response.data;
  },

  getAllTransactions: async (page = 1, limit = 20, type?: string) => {
    const response = await api.get<AdminPaginatedResponse<AdminTransaction>>(`/admin/transactions`, {
      params: { page, limit, type }
    });
    return response.data;
  },

  approveWithdrawal: async (transactionId: string, proofOfPayment: string) => {
    const response = await api.patch<AdminSingleResponse<AdminTransaction>>(
      `/admin/withdrawals/${transactionId}/approve`, 
      { proofOfPayment }
    );
    return response.data;
  },

  rejectWithdrawal: async (transactionId: string, reason: string) => {
    const response = await api.post<{ success: true, message: string }>(
      `/admin/withdrawals/${transactionId}/reject`, 
      { reason }
    );
    return response.data;
  },

  // ----------------------------------------------------------------
  // 🌍 GLOBAL & CONFIG
  // ----------------------------------------------------------------
  getRiskReport: async () => {
    const response = await api.get<AdminSingleResponse<RiskReport>>("/admin/risk-report");
    return response.data;
  },

  getConfig: async () => {
    const response = await api.get<AdminSingleResponse<SystemConfig>>("/admin/config");
    return response.data;
  },

  updateConfig: async (data: Partial<SystemConfig>) => {
    const response = await api.put<AdminSingleResponse<SystemConfig>>("/admin/config", data);
    return response.data;
  },

  postAnnouncement: async (message: string) => {
    const response = await api.post("/admin/announcements", { message });
    return response.data;
  },

  // ----------------------------------------------------------------
  // 🎫 SUPPORT
  // ----------------------------------------------------------------
  getAllTickets: async () => {
    // Note: MD URL is /support/admin/all (Different base path)
    const response = await api.get<{ success: boolean; count: number; data: SupportTicket[] }>(
      "/support/admin/all"
    );
    return response.data;
  },

  replyToTicket: async (ticketId: string, message: string) => {
    // Note: MD URL is admin/support/:id/reply
    const response = await api.post<AdminSingleResponse<SupportTicket>>(
      `/admin/support/${ticketId}/reply`, 
      { message }
    );
    return response.data;
  }
};