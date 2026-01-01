"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { authAPI } from "@/services/api";
import { toast } from "sonner";
import { Loader2, Save, User, Lock, ShieldCheck, Mail, Phone, MailIcon } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PasswordInput } from "@/components/password-input"; // Reusing your existing component

// --- 1. PROFILE FORM SCHEMA ---
const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
});

// --- 2. PASSWORD FORM SCHEMA ---
const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  // --- PROFILE LOGIC ---
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    try {
      await authAPI.updateProfile(values);
      await refreshUser(); // Update global context immediately
      toast.success("Profile updated", { description: "Your details have been saved." });
    } catch (error: any) {
      toast.error("Update failed", { description: error?.response?.data?.message });
    }
  }

  // --- PASSWORD LOGIC ---
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    try {
      await authAPI.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed", { description: "Please use your new password next time." });
      passwordForm.reset();
    } catch (error: any) {
      toast.error("Change failed", { description: error?.response?.data?.message || "Incorrect current password" });
    }
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* --- LEFT: PROFILE CARD --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription>
                Update your public profile information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-8">
                <Avatar className="h-20 w-20 border-4 border-muted">
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {user?.firstName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                   <h3 className="font-medium text-lg leading-none">{user?.firstName} {user?.lastName}</h3>
                   <p className="text-sm text-muted-foreground">{user?.email}</p>
                   <div className="flex items-center gap-1.5 pt-1">
                      <ShieldCheck className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                        Account Active
                      </span>
                      {!user?.isVerified && 
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
                          <MailIcon className="h-3 w-3 text-red-600" />Not Verfied
                        </span>
                      }
                      
                   </div>
                </div>
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Read Only Fields */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> Email Address
                      </FormLabel>
                      <Input value={user?.email} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" /> Phone Number
                      </FormLabel>
                      <Input value={user?.phoneNumber} disabled className="bg-muted/50" />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-4" 
                    disabled={profileForm.formState.isSubmitting || !profileForm.formState.isDirty}
                  >
                    {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Profile
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT: SECURITY CARD --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-500" /> Security
              </CardTitle>
              <CardDescription>
                Ensure your account stays safe by updating your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="oldPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator className="my-2" />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    variant="secondary"
                    className="w-full mt-4" 
                    disabled={passwordForm.formState.isSubmitting}
                  >
                    {passwordForm.formState.isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Change Password
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="bg-muted/30 px-6 py-4">
              <p className="text-xs text-muted-foreground text-center w-full">
                For security reasons, your session might be refreshed after changing your password.
              </p>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
  );
}
