import { api, setAccessToken } from "@/lib/axios";
import { 
  // Types
  ApiResponse, PaginatedResponse, 
  User, DepositData, WithdrawalData, Transaction, 
  Task, TaskHistoryItem, ReferralUser, Notification, SupportTicket,
  // Payloads
  DepositRequest, CallbackRequest, WithdrawRequest, 
  TaskSubmitRequest, ChangePasswordRequest, TicketRequest 
} from "@/types/api";

import { RegisterCredentials, LoginCredentials } from "@/types/auth"; // Keep these from auth types if they exist, or move them to api.ts

// 1. AUTHENTICATION
export const authAPI = {
  register: async (data: RegisterCredentials) => {
    const response = await api.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/register", data);
    if (response.data.data.accessToken) setAccessToken(response.data.data.accessToken);
    return response.data; 
  },

  login: async (data: LoginCredentials) => {
    const response = await api.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/login", data);
    if (response.data.data.accessToken) setAccessToken(response.data.data.accessToken);
    return response.data; 
  },

  logout: async () => {
    await api.post("/auth/logout");
    setAccessToken(null);
  },

  // Route: GET /users/me
  // JSON: { success: true, data: { ...User... } }
  getProfile: async () => {
    const response = await api.get<ApiResponse<User>>("/users/me");
    return response.data.data; // 👈 Returns just the User object
  },

  refreshToken: async () => {
    try {
      const response = await api.post<ApiResponse<{ accessToken: string }>>("/auth/refresh");
      const newToken = response.data.data.accessToken;
      setAccessToken(newToken);
      return newToken;
    } catch (error) {
      return null;
    }
  },
  
  // Route: POST /users/change-password
  // JSON: { success: true, message: "..." }
  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.post<ApiResponse<null>>("/users/change-password", data);
    return response.data;
  },

  // Route: PATCH /users/profile
  updateProfile: async (data: Partial<User>) => {
    const response = await api.patch<ApiResponse<User>>("/users/profile", data);
    return response.data.data;
  }
};

// 2. PAYMENTS
export const paymentAPI = {
  // Route: POST /payments/deposit
  // JSON: { success: true, data: { ...DepositData... } }
  initiateDeposit: async (data: DepositRequest) => {
    const response = await api.post<ApiResponse<DepositData>>("/payments/deposit", data);
    return response.data.data; 
  },

  // Route: POST /payments/callback
  confirmDeposit: async (data: CallbackRequest) => {
    const response = await api.post("/payments/callback", data);
    return response.data;
  },

  // Route: POST /payments/withdraw
  requestWithdrawal: async (data: WithdrawRequest) => {
    const response = await api.post<ApiResponse<WithdrawalData>>("/payments/withdraw", data);
    return response.data.data;
  },

  // Route: GET /users/transactions
  // JSON: { success: true, data: [...], pagination: {...} }
  getTransactions: async (page = 1, limit = 5) => {
    const response = await api.get<PaginatedResponse<Transaction>>(`/users/transactions?page=${page}&limit=${limit}`);
    return response.data; // 👈 Returns { data: [], pagination: {} }
  }
};

// 3. TASKS
export const taskAPI = {
  // Route: GET /tasks/daily
  // JSON: { success: true, count: n, data: [ ...Task... ] }
  getDailyTasks: async () => {
    // Note: The JSON has a 'count' field at root, so we define a custom wrapper
    const response = await api.get<{ success: boolean; count: number; data: Task[] }>("/tasks/daily");
    return response.data.data;
  },

  // Route: POST /tasks/:id/submit
  // JSON: { success: true, data: { newBalance, rewardAmount } }
  submitTask: async (taskId: string, data: TaskSubmitRequest) => {
    const response = await api.post<ApiResponse<{ newBalance: number; rewardAmount: number }>>(`/tasks/${taskId}/submit`, data);
    return response.data.data;
  },

  // Route: GET /users/tasks/history
  getHistory: async (page = 1) => {
    const response = await api.get<PaginatedResponse<TaskHistoryItem>>(`/users/tasks/history?page=${page}`);
    return response.data; // Returns full object with pagination
  }
};

// 4. USERS & REFERRALS
export const userAPI = {
  // Route: GET /users/referrals
  getReferrals: async (page = 1) => {
    const response = await api.get<PaginatedResponse<ReferralUser>>(`/users/referrals?page=${page}`);
    return response.data; 
  }
};

// 5. NOTIFICATIONS
export const notificationAPI = {
  // Route: GET /notifications
  // JSON: { success: true, data: { notifications: [], unreadCount: 0 } }
  getAll: async () => {
    const response = await api.get<ApiResponse<{ notifications: Notification[], unreadCount: number }>>("/notifications");
    return response.data.data;
  },

  markRead: async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    await api.patch("/notifications/read-all");
  }
};

// 6. SUPPORT
export const supportAPI = {
  // Route: POST /support
  createTicket: async (data: TicketRequest) => {
    const response = await api.post<ApiResponse<SupportTicket>>("/support", data);
    return response.data.data;
  },

  // Route: GET /support
  getMyTickets: async () => {
    // Assuming this returns a list of tickets inside data
    const response = await api.get<ApiResponse<SupportTicket[]>>("/support");
    return response.data.data;
  },

  // Route: POST /support/:id/reply
  replyTicket: async (id: string, message: string) => {
    const response = await api.post<ApiResponse<SupportTicket>>(`/support/${id}/reply`, { message });
    return response.data.data;
  }
};
