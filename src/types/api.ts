// User Data (Based on your backend response)
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  role: "user" | "admin";
  isActive: boolean;
  isVerified: boolean;
  referralCode: string;
  wallet: {
    referralEarnings: number;
    taskEarnings: number;
    totalDeposits: number;
    totalWithdrawals: number;
    walletBalance: number;
  };
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

// Task Types (Placeholder - Update based on actual backend)
export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: "YOUTUBE_WATCH" | "TIKTOK_LIKE" | "SURVEY"; // Example types
  status: "PENDING" | "COMPLETED";
  link: string;
}

// Withdrawal Types
export interface Withdrawal {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  phoneNumber: string;
  createdAt: string;
}