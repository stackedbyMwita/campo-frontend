import { User, TransactionStatus, TransactionType, TaskQuestionType } from "./api";

// --- GENERIC RESPONSES ---
export interface AdminPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface AdminSingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// --- 1. ANALYTICS ---
export interface DashboardAnalytics {
  users: { total: number };
  financials: {
    totalDeposits: number;
    totalWithdrawals: number;
    cashOnHand: number;
    pendingWithdrawals: number;
    walletLiabilities: number;
    realProfit: number;
  };
  engagement: { totalTasksCompleted: number };
}

// --- 2. USERS ---
export interface AdminUser extends User {
  wallet: {
    referralEarnings: number;
    taskEarnings: number;
    totalDeposits: number;
    totalWithdrawals: number;
    walletBalance: number;
  };
  tier: number;
  referralCode: string;
  referredBy?: string;
  isVerified: boolean;
  role: "user" | "admin";
  createdAt: string;
}

export interface AdminUserDetails {
  profile: AdminUser;
  recentActivity: {
    transactions: any[]; // Reusing Transaction Type generally
    taskLogs: {
      _id: string;
      taskId: { _id: string; title: string };
      earnedAmount: number;
      proof: string;
      durationSeconds: number;
      status: string;
      completedAt: string;
    }[];
    referrals: any[];
  };
}

// --- 3. TASKS ---
export interface AdminTask {
  _id: string;
  title: string;
  description: string;
  type: TaskQuestionType | "mixed";
  rewardMultiplier: number; // Note: Response shows multiplier, not fixed reward
  isActive: boolean;
  questions: {
    text: string;
    options?: string[];
    expectedAnswer: string;
    _id?: string;
  }[];
  expiresAt: string;
  createdAt: string;
}

export interface CreateTaskDTO {
  title: string;
  description: string;
  type: string;
  rewardMultiplier?: number;
  expiresAt: string; // ISO Date string
  isActive: boolean;
  questions: {
    text: string;
    options?: string[]; // Optional for Text tasks
    expectedAnswer: string;
  }[];
}

// --- 4. TRANSACTIONS / WITHDRAWALS ---
export interface AdminTransaction {
  _id: string;
  userId: AdminUser | string; // Sometimes populated, sometimes ID
  phoneNumber: string;
  type: TransactionType;
  status: TransactionStatus;
  direction: "CREDIT" | "DEBIT";
  amount: number; // In Cents
  reference: string;
  description: string;
  createdAt: string;
}

// --- 5. SYSTEM CONFIG ---
export interface SystemConfig {
  _id: string;
  minWithdrawalAmount: number;
  referralBonus: number;
  activationFee: number;
  isMaintenanceMode: boolean;
  announcement: string;
  tier1Price: number;
  tier2Price: number;
  tier3Price: number;
}

// --- 6. RISK REPORT ---
export interface RiskReport {
  multiAccounting: any; // Flexible object based on response
  botActivity: any[];
}

// --- 7. SUPPORT ---
export interface SupportTicket {
  _id: string;
  userId: string;
  subject: string;
  status: "OPEN" | "CLOSED" | "RESOLVED";
  category: string;
  messages: {
    sender: "USER" | "ADMIN";
    message: string;
    createdAt: string;
    _id: string;
  }[];
  createdAt: string;
  updatedAt: string;
}
