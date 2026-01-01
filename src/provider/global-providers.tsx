"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner"; // We stick to Sonner as it's lighter/newer than react-hot-toast
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "./theme-provider";
import { usePathname } from "next/navigation";
import { PaymentGuard } from "@/components/guards/payment-guard";

// Define routes that ANYONE can see without being logged in or paid
const PUBLIC_ROUTES = [
  "/", 
  "/login", 
  "/register", 
  "/forgot-password", 
  "/reset-password"
];

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 1. Check if the current path matches any public route
  // We use .some() to handle dynamic sub-paths if necessary, but exact match is usually safer
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // 2. Initialize React Query Client
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute='class'
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <Toaster position="top-right" richColors />
          {isPublicRoute ? ( children )
          : ( <PaymentGuard> {children} </PaymentGuard> )}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
