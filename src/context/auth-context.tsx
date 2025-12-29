"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/api";
import { authAPI } from "@/services/api";
import { LoginCredentials, RegisterCredentials } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginCredentials) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authAPI.getProfile();
      setUser(userData);
    } catch (error) {
      try {
        const newToken = await authAPI.refreshToken(); // Uses the new function
        if (newToken) {
          // Retry profile fetch with new token
          const userData = await authAPI.getProfile(); 
          setUser(userData);
        } else {
          throw new Error("Refresh failed");
        }
      } catch (retryError) {
        // Truly logged out
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setLoading(false);
    };

    initAuth();
  }, [refreshUser]);


  const register = async (credentials: RegisterCredentials) => {
    // Calls the service, which saves the token
    const response = await authAPI.register(credentials);
    const userObj = response.data?.user;
    // Updates the Global State
    setUser(userObj);
    
    // Redirects to Dashboard (or Payment if inactive)
    router.push("/dashboard");
  };

  // 2. Login Function
  const login = async (credentials: LoginCredentials) => {
    const response = await authAPI.login(credentials);
    const userObj = response.data?.user;
    setUser(userObj);
    router.push("/dashboard");
  };

  // 3. Logout Function
  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
