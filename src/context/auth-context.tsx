"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "@/services/api";
import { User } from "@/types/api";
import { LoginCredentials, RegisterCredentials } from "@/types/auth";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginCredentials) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // 1. Identify if we are on a Public Page (Login or Register)
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname === "/";

  // 2. Fetch User Profile
  const { data, isLoading: queryLoading, refetch, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authAPI.getProfile,
    retry: false, // Stop immediately if 401
    staleTime: 1000 * 60 * 5,
    // OPTIMIZATION: If we are on login/register, don't even try to fetch!
    enabled: !isAuthRoute, 
  });

  // 3. Sync State
  useEffect(() => {
    const userPayload = (data as any)?.data || data;

    if (userPayload) {
      setUser(userPayload);
    } else if (isError) {
      setUser(null);
    }
  }, [data, isError]);

  const login = async (credentials: LoginCredentials) => {
    const response = await authAPI.login(credentials);
    const userObj = response.data?.user || response.data; // Handle different response structures
    
    setUser(userObj);
    queryClient.setQueryData(["auth", "me"], userObj);
    
    // ✅ ROLE BASED REDIRECT
    if (userObj.role === 'admin') {
      router.push("/admin/dashboard");
      toast.success("Welcome back, Admin!");
    } else {
      router.push("/dashboard");
      toast.success("Welcome back!");
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    const response = await authAPI.register(credentials);
    const userObj = response.data?.user || response.data;
    
    setUser(userObj);
    queryClient.setQueryData(["auth", "me"], userObj);
    
    // ✅ Check role just in case, though usually register = user
    if (userObj.role === 'admin') {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
    
    toast.success("Account created successfully!");
  };

  const logout = async () => {
    try {
      await authAPI.logout(); 
    } catch (err) {
      console.error("Logout error", err);
    }
    queryClient.removeQueries(); 
    queryClient.clear();
    setUser(null);
    router.push("/login");
  };

  // 4. Loading Logic
  const showLoader = queryLoading && !isAuthRoute;

  if (showLoader) {
     return (
       <div className="flex h-screen items-center justify-center bg-background">
         <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
       </div>
     );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading: queryLoading, 
      login, 
      register,
      logout,
      refreshUser: async () => { await refetch(); } 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
