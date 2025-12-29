// src/types/auth.ts

import { User } from "./api";

// 2. Login Payload (What we send to /auth/login)
export interface LoginCredentials {
  email: string;
  password: string;
}

// 3. Register Payload (What we send to /auth/register)
export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string; // e.g. "712345678"
  countryCode: "254" | "255" | "256"; // Strictly limited to these 3 for now
  referralCode?: string; // Optional
}

// 4. Auth Response (What the backend returns on login/refresh)
export interface AuthResponse {
  user: User;
  accessToken: string;
  // refreshToken is usually HttpOnly cookie, so we might not see it here
}