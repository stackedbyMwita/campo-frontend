import { api, setAccessToken } from "@/lib/axios";
import { 
  AdminPaginatedResponse, 
  AdminSingleResponse, 
  DashboardAnalytics, 
  AdminUser, 
  AdminUserDetails, 
  AdminTask, 
  CreateTaskDTO, 
  AdminTransaction, 
  SystemConfig, 
  RiskReport,
  SupportTicket 
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

  getUserDetails: async (userId: string) => {
    const response = await api.get<AdminSingleResponse<AdminUserDetails>>(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserBalance: async (userId: string, data: { amountInCents: number; type: string; description: string; targetWallet: string }) => {
    const response = await api.patch<{ success: true, message: string }>(`/admin/users/${userId}/balance`, data);
    return response.data;
  },

  updateUserTier: async (userId: string, tier: number) => {
    const response = await api.patch<{ success: true, message: string }>(`/admin/users/${userId}/segment`, { tier });
    return response.data;
  },

  // ----------------------------------------------------------------
  // ✅ TASKS
  // ----------------------------------------------------------------
  getTasks: async (page = 1, limit = 10) => {
    const response = await api.get<AdminPaginatedResponse<AdminTask>>(`/admin/tasks`, {
      params: { page, limit }
    });
    return response.data;
  },

  getTask: async (taskId: string) => {
    const response = await api.get(`/admin/tasks${taskId}`)
    return response.data;
  },

  createTask: async (data: CreateTaskDTO) => {
    const response = await api.post<AdminSingleResponse<AdminTask>>("/admin/tasks", data);
    return response.data;
  },

  updateTask: async (taskId: string, data: Partial<CreateTaskDTO>) => {
    const response = await api.patch<AdminSingleResponse<AdminTask>>(`/admin/tasks/${taskId}`, data);
    return response.data;
  },

  deleteTask: async (taskId: string) => {
    const response = await api.delete<{ success: true, message: string }>(`/admin/tasks/${taskId}`);
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