// --- GLOBAL WRAPPERS ---
// 1. Standard Success Wrapper (Most endpoints)
// matches: { success: true, message?: string, data: T }
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// 2. Paginated Wrapper (Referrals, Transactions, etc)
// matches: { success: true, data: T[], pagination: ... }
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}// User Data (Based on your backend response)

export interface Wallet {
  referralEarnings: number;
  taskEarnings: number;
  totalDeposits: number;
  walletBalance: number;
  totalWithdrawals: number;
}

export enum TaskQuestionType {
  MCQ = 'mcq',
  TEXT = 'text',
  MIXED = 'mixed'
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: "user" | "admin";
  isActive: boolean;
  isVerified: boolean;
  referralCode: string;
  wallet: Wallet;
  createdAt: string;
}

// Payment/Deposit Types
export interface DepositResponse {
  userId: string;
  phoneNumber: string;
  amount: number;
  checkoutRequestID: string;
  status: string;
  reference: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  type: TaskQuestionType // Add other types if needed
  isActive: boolean;
  questions: TaskQuestion[];
  reward: number;
  expiresAt: string;
}

// Withdrawal Types
export interface Withdrawal {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  phoneNumber: string;
  createdAt: string;
}

export interface DepositData {
  userId: string;
  phoneNumber: string;
  amount: number;
  checkoutRequestID: string; // CamelCase as per your JSON
  status: "PENDING" | "COMPLETED" | "FAILED";
  reference: string;
  description: string;
}

export interface WithdrawalData {
  _id: string;
  userId: string;
  phoneNumber: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reference: string;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "REFERRAL_BONUS";
  status: "PENDING" | "COMPLETED" | "FAILED" | "APPROVED";
  direction: "CREDIT" | "DEBIT";
  amount: number;
  reference: string;
  description?: string;
  createdAt: string;
}

export interface TaskQuestion {
  _id: string;
  text: string;
  options: string[];
  expectedAnswer?: string; // Hidden in frontend usually, but in your JSON it's there
}


export interface TaskHistoryItem {
  _id: string;
  taskId?: string; 
  status: "PENDING" | "APPROVED" | "REJECTED";
  proof?: string;
  durationSeconds: number;
  createdAt: string;
  // Some history items in your JSON (aggregated ones) have 'tasksCompletedCount' instead of taskId
  tasksCompletedCount?: number; 
  completedTaskIds?: string[];
}

export interface ReferralUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  tier: number;
  createdAt: string;
}

export interface Notification {
  _id: string;
  // Add fields based on actual notification object if available later
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface SupportMessage {
  _id: string;
  sender: "USER" | "ADMIN";
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  _id: string;
  subject: string;
  status: "OPEN" | "CLOSED" | "PENDING";
  category: string;
  messages: SupportMessage[];
  createdAt: string;
}

// --- PAYLOADS (REQUEST BODIES) ---

export interface DepositRequest {
  amount: number;
  phoneNumber: string;
}

export interface CallbackRequest {
  CheckoutRequestID: string;
  Status: "Success" | "Failed";
  MpesaReceiptNumber?: string;
}

export interface WithdrawRequest {
  amount: number;
  phoneNumber: string;
}

export interface TaskSubmitRequest {
  proof: string;
  durationSeconds: number;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface TicketRequest {
  subject: string;
  category: string;
  message: string;
}
