"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { adminApi } from "@/services/admin-api";
import { DashboardAnalytics, SystemConfig } from "@/types/admin";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context"; // Assuming you have this
import { useRouter } from "next/navigation";

interface AdminContextType {
  // Data
  analytics: DashboardAnalytics | null;
  config: SystemConfig | null;
  isLoading: boolean;
  
  // Actions
  refreshAnalytics: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  updateSystemConfig: (data: Partial<SystemConfig>) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Check Admin Access
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        // Redirect non-admins immediately
        router.replace("/dashboard"); 
      }
    }
  }, [user, authLoading, router]);

  // 2. Fetch Global Admin Data
  const fetchGlobalData = async () => {
    if (!user || user.role !== 'admin') return;

    try {
      setLoading(true);
      // Run these in parallel for speed
      const [analyticsData, configData] = await Promise.all([
        adminApi.getAnalytics().catch(() => ({ data: null })), // Graceful fail
        adminApi.getConfig().catch(() => ({ data: null }))
      ]);

      if (analyticsData.data) setAnalytics(analyticsData.data);
      if (configData.data) setConfig(configData.data);
      
    } catch (error) {
      console.error("Failed to load admin context:", error);
      toast.error("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchGlobalData();
    }
  }, [user]);

  // Actions
  const updateSystemConfig = async (data: Partial<SystemConfig>) => {
    try {
      const res = await adminApi.updateConfig(data);
      setConfig(res.data);
      toast.success("System configuration updated");
    } catch (error) {
      toast.error("Failed to update configuration");
      throw error;
    }
  };

  const refreshAnalytics = async () => {
    const res = await adminApi.getAnalytics();
    setAnalytics(res.data);
  };

  const refreshConfig = async () => {
    const res = await adminApi.getConfig();
    setConfig(res.data);
  };

  // Prevent rendering children until basic admin check passes
  if (authLoading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  if (user?.role !== 'admin') return null; 

  return (
    <AdminContext.Provider 
      value={{ 
        analytics, 
        config, 
        isLoading: loading,
        refreshAnalytics,
        refreshConfig,
        updateSystemConfig
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};