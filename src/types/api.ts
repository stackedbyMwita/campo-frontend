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
    
    // 👈 ADD THESE NEW FIELDS
    totalActive?: number;   
    totalInactive?: number;
  };
}

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
  tier: number,
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
  sessionId: number;
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

// 1. Transaction Statuses
// Based on your JSON: "PENDING", "COMPLETED", "FAILED"
export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED' // Good to have just in case
}

// 2. Transaction Types
// Based on your JSON: "DEPOSIT", "WITHDRAWAL", "BONUS"
// Plus standard types needed for wallet history
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',              // User topping up
  WITHDRAWAL = 'WITHDRAWAL',        // User cashing out
  TASK_EARNING = 'TASK_EARNING',    // Money earned from doing a task
  REFERRAL_REWARD = 'REFERRAL_REWARD', // Money earned from inviting a friend
  ADMIN_CORRECTION = 'ADMIN_CORRECTION', // Admin manually changing balance
  BONUS = 'BONUS'                   // System bonuses
}

export interface Question {
  _id: string;
  text: string;
  type: 'mcq' | 'text';
  options: string[];
}

export interface TaskSession {
  sessionId: string;
  questions: Question[];
  reward: number;
  expiresAt: string;
}

export interface TaskHistoryItem {
  _id: string;
  status: 'COMPLETED' | 'EXPIRED';
  rewardAmount: number;
  createdAt: string;
  completedAt: string;
  questions: any[]; // Populated or IDs
}


export interface Task {
  id: string;
  title: string;
  rewardAmount: number;
  description?: string;
  status: "OPEN" | "COMPLETED";
}

export interface HistoryItem {
  id: string;
  taskId: string;
  taskTitle: string;
  completedAt: string;
  amountEarned: number;
}

export interface TaskSubmitRequest {
  proof?: string; // or whatever your submit data is
}

export interface TaskSubmitResponse {
  success: boolean;
  data: {
    success: boolean;
    reward: number;
  };
}
// 1. The Single Task Session (since getDailyTask returns this)
export interface TaskSession {
  taskId: string;
  title: string;
  description?: string;
  rewardAmount: number;
  status: "OPEN" | "COMPLETED";
}

// 2. The History Item
export interface TaskHistoryItem {
  id: string;
  taskTitle: string;
  amountEarned: number;
  completedAt: string;
}

// 3. Pagination Wrapper (since getHistory returns this)

// 4. Submit Response (The nested structure you requested)
export interface TaskSubmitResponse {
  success: boolean;
  data: {
    success: boolean;
    reward: number;
  };
}