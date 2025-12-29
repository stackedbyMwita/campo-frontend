import { api, setAccessToken } from "@/lib/axios";
import { User, DepositResponse, Task, Withdrawal } from "@/types/api";
import { LoginCredentials, RegisterCredentials } from "@/types/auth";
import { InitiatePaymentRequest } from "@/types/payment";

// 1. AUTHENTICATION
export const authAPI = {
  register: async (data: RegisterCredentials) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginCredentials) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
  },

  getProfile: async () => {
    const response = await api.get<{ data: User }>("/users/me");
    return response.data.data;
  },

  refreshToken: async () => {
    try {
      // Calls the backend to get a new Access Token using the HttpOnly cookie
      const response = await api.post<{ data: { accessToken: string } }>("/auth/refresh");
      const newToken = response.data.data.accessToken;
      
      // Update Axios Memory immediately
      setAccessToken(newToken);
      return newToken;
    } catch (error) {
      return null;
    }
  }
};


// 2. PAYMENTS (Deposits)
export const paymentAPI = {
  initiateDeposit: async (data: InitiatePaymentRequest) => {
    const response = await api.post("/payments/deposit", data);
    return response.data.data as DepositResponse;
  },

  confirmDeposit: async (data: { CheckoutRequestID: string; MpesaReceiptNumber: string; Status: string }) => {
    const response = await api.post("/payments/callback", data);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get<{ data: any[] }>("/payments/history");
    return response.data.data;
  },
};

// 3. TASKS
export const taskAPI = {
  getAvailable: async () => {
    const response = await api.get<{ data: Task[] }>("/tasks/available");
    return response.data.data;
  },

  submit: async (taskId: string, proof: string) => {
    const response = await api.post(`/tasks/${taskId}/submit`, { proof });
    return response.data;
  },

  getMyTasks: async () => {
    const response = await api.get<{ data: Task[] }>("/tasks/history");
    return response.data.data;
  },
};

// 4. WALLET & WITHDRAWALS
export const walletAPI = {
  getBalance: async () => {
    const response = await api.get<{ data: { balance: number } }>("/wallet/balance");
    return response.data.data;
  },

  requestWithdrawal: async (amount: number) => {
    const response = await api.post<{ data: Withdrawal }>("/withdrawals/request", { amount });
    return response.data.data;
  },

  getWithdrawals: async () => {
    const response = await api.get<{ data: Withdrawal[] }>("/withdrawals/history");
    return response.data.data;
  },
};
