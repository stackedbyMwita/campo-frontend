"use client";

import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import ActivationModal from "@/components/modals/activation-modal";

interface PaymentGuardProps {
  children: React.ReactNode;
}

export function PaymentGuard({ children }: PaymentGuardProps) {
  const { user, loading } = useAuth();

  // 1. Loading State
  // While fetching the user profile, show a full-screen loader.
  // This prevents the "Flash of Unpaid Content"
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Not Logged In? 
  // If we are on a protected route (handled by GlobalProviders) and have no user,
  // we render nothing. The AuthContext or Middleware should have already 
  // redirected to /login.
  if (!user) {
    return null; 
  }

  // 3. User Logged In BUT Not Active (The "Blur" Effect)
  if (!user.isActive) { 
    return (
      <div className="relative min-h-screen w-full">
        {/* Background: Render the Dashboard but Blur it */}
        <div 
          className="pointer-events-none select-none opacity-20 filter blur-sm h-screen overflow-hidden" 
          aria-hidden="true"
        >
          {children}
        </div>

        {/* The Gate Modal: Always Open */}
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <ActivationModal isOpen={true} />
        </div>
      </div>
    );
  }

  // 4. Paid User (Access Granted)
  return <>{children}</>;
}
