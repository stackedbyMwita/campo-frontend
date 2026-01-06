"use client";

import { useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { formatMoney } from "@/lib/utils";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Wallet, 
  ShieldAlert, 
  CheckCircle2, 
  Award,
  TrendingUp,
  History
} from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

// --- VALIDATION FOR BALANCE FORM ---
const balanceSchema = z.object({
  amount: z.string().min(1, "Amount is required").regex(/^\d+$/, "Must be a valid number"),
  action: z.enum(["CREDIT", "DEBIT"]),
  wallet: z.enum(["TASK_EARNINGS", "REFERRAL_WALLET"]),
  description: z.string().min(5, "Reason is required (min 5 chars)"),
});

type BalanceFormValues = z.infer<typeof balanceSchema>;

export default function UserDetailsPage() {
  const pathname = usePathname();
  const userId = pathname.split('/').pop();

  const queryClient = useQueryClient();
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  // 1. FETCH USER DATA
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminApi.getUserDetails(userId!),
  });

  const user = data?.data;

  // 2. MUTATION: UPDATE TIER
  const tierMutation = useMutation({
    mutationFn: (newTier: string) => adminApi.updateUserTier(userId!, parseInt(newTier)),
    onSuccess: () => {
      toast.success("User tier updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update tier")
  });

  // 3. MUTATION: UPDATE BALANCE
  const balanceMutation = useMutation({
    mutationFn: (values: BalanceFormValues) => {
      // Logic mapping: Frontend 'CREDIT' -> Backend 'BONUS', 'DEBIT' -> 'PENALTY'
      const type = values.action === 'CREDIT' ? 'BONUS' : 'PENALTY';
      // Convert Shillings to Cents
      const amountInCents = Math.abs(parseInt(values.amount) * 100);

      return adminApi.updateUserBalance(userId!, {
        amountInCents,
        type,
        targetWallet: values.wallet,
        description: values.description
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setIsBalanceModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update balance")
  });

  // Form handling for Balance Modal
  const form = useForm<BalanceFormValues>({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      action: "CREDIT",
      wallet: "TASK_EARNINGS",
      amount: "",
      description: ""
    }
  });

  if (isLoading) return <UserDetailsSkeleton />;
  if (!user) return <div className="p-8 text-center">User not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.profile.firstName} {user.profile.lastName}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">ID: {user.profile._id}</span>
            <span>•</span>
            <Badge variant={user.profile.isActive ? "default" : "secondary"} className={user.profile.isActive ? "bg-green-600" : ""}>
              {user.profile.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* LEFT COLUMN: INFO & ACTIONS */}
        <div className="space-y-6 md:col-span-1">
          
          {/* PERSONAL INFO CARD */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Personal Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{user.profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{user.profile.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="text-sm font-medium">{format(new Date(user.profile.createdAt), "MMM d, yyyy")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TIER MANAGEMENT */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Segment / Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label>Current Tier</Label>
                <Select 
                  defaultValue={String(user.profile.tier)} 
                  onValueChange={(val) => tierMutation.mutate(val)}
                  disabled={tierMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">Tier 4 (Basic)</SelectItem>
                    <SelectItem value="3">Tier 3 (Pro)</SelectItem>
                    <SelectItem value="2">Tier 2 (Elite)</SelectItem>
                    <SelectItem value="1">Tier 1 (Premium)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Updating the tier changes daily task limits and withdrawal privileges immediately.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: WALLETS & STATS */}
        <div className="space-y-6 md:col-span-2">
          
          {/* STATS OVERVIEW */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Referral Earnings Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(user.profile.wallet.referralEarnings)}</div>
                <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Earnings Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(user.profile.wallet.taskEarnings || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Lifetime accumulation</p>
              </CardContent>
            </Card>
          </div>

          {/* TABS FOR DETAILS */}
          <Tabs defaultValue="actions" className="w-full">
            <TabsList>
              <TabsTrigger value="actions">Management</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            {/* MANAGEMENT TAB */}
            <TabsContent value="actions" className="space-y-4 pt-4">
              <Card className="border-orange-200 bg-orange-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-orange-600" />
                    Admin Corrections
                  </CardTitle>
                  <CardDescription>
                    Manually credit or debit user wallets. This action creates a transaction record visible to the user.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-orange-300 hover:bg-orange-100">
                        <Wallet className="mr-2 h-4 w-4" /> Manage User Balance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update User Balance</DialogTitle>
                        <DialogDescription>
                          Adjust funds for <strong>{user.profile.firstName}</strong>. Use with caution.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={form.handleSubmit((data) => balanceMutation.mutate(data))} className="space-y-4 py-4">
                        
                        {/* Action Type */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Action</Label>
                            <Select 
                              onValueChange={(val: any) => form.setValue("action", val)} 
                              defaultValue={form.getValues("action")}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CREDIT">Credit (Add)</SelectItem>
                                <SelectItem value="DEBIT">Debit (Subtract)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Target Wallet</Label>
                            <Select 
                              onValueChange={(val: any) => form.setValue("wallet", val)} 
                              defaultValue={form.getValues("wallet")}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TASK_EARNINGS">Task Earnings</SelectItem>
                                <SelectItem value="REFERRAL_WALLET">Referral Wallet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                          <Label>Amount (KSh)</Label>
                          <Input 
                            type="number" 
                            placeholder="e.g. 500" 
                            {...form.register("amount")}
                          />
                          {form.formState.errors.amount && (
                            <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
                          )}
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                          <Label>Reason for Adjustment</Label>
                          <Textarea 
                            placeholder="e.g. Compensation for failed task #123" 
                            {...form.register("description")}
                          />
                          {form.formState.errors.description && (
                            <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
                          )}
                        </div>

                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={balanceMutation.isPending}
                            className={form.watch("action") === 'DEBIT' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                          >
                            {balanceMutation.isPending ? "Processing..." : `Confirm ${form.watch("action")}`}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </TabsContent>

            {/* HISTORY TAB - Placeholder for future implementation */}
            <TabsContent value="history" className="pt-4">
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground">
                <History className="h-8 w-8 mb-2 opacity-50" />
                <p>Transaction history view coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function UserDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-64 md:col-span-1" />
        <Skeleton className="h-64 md:col-span-2" />
      </div>
    </div>
  )
}