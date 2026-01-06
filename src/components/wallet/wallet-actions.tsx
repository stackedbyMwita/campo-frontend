"use client";

import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowDownLeft, ArrowUpRight, Loader2, Smartphone, CheckCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { DepositData, WithdrawalData } from "@/types/api";


// 1. DEPOSIT DIALOG (Two-Step Flow: STK Push -> Receipt Confirmation)

interface DepositProps {
  // We split the action into two steps to match the Activation Modal flow
  onInitiate: (amount: number, phone: string) => Promise<{ checkoutRequestID: string }>;
  onConfirm: (checkoutRequestID: string, receipt: string) => Promise<DepositData>;
  isLoading: boolean;
  defaultPhone?: string;
}

export function DepositDialog({ onInitiate, onConfirm, isLoading, defaultPhone }: DepositProps) {
  const [open, setOpen] = useState(false);
  
  // State for Steps
  const [step, setStep] = useState<"INITIATE" | "CONFIRM">("INITIATE");
  
  // Form Data
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(defaultPhone || "");
  const [checkoutID, setCheckoutID] = useState("");
  const [receipt, setReceipt] = useState("");

  // Reset state when dialog closes/opens
  useEffect(() => {
    if (open) {
      setStep("INITIATE");
      setAmount("");
      setCheckoutID("");
      setReceipt("");
      if (defaultPhone) setPhone(defaultPhone);
    }
  }, [open, defaultPhone]);

  // STEP 1: Send STK Push
  const handleInitiateSubmit = async () => {
    const val = parseInt(amount);
    if (!val || val < 10) return toast.error("Minimum deposit is KES 10");
    if (!phone || phone.length < 9) return toast.error("Invalid phone number");

    const amountInCents = val * 100;

    try {
      const res = await onInitiate(amountInCents, phone);
      if (res?.checkoutRequestID) {
        setCheckoutID(res.checkoutRequestID);
        setStep("CONFIRM"); // Move to Step 2
        toast.info("STK Push Sent", { description: "Check your phone to enter PIN." });
      }
    } catch (error) {
      // Error handling is likely done in the parent hook, but just in case
      console.error(error);
    }
  };

  // STEP 2: Confirm Receipt
  const handleConfirmSubmit = async () => {
    if (!receipt || receipt.length < 5) return toast.warning("Please enter a valid M-Pesa code");

    try {
      await onConfirm(checkoutID, receipt);
      setOpen(false); // Success! Close dialog.
      toast.success("Deposit Successful", { description: "Your wallet has been credited." });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1 gap-2 h-12 text-base shadow-md bg-green-600 hover:bg-green-700 text-white" size="lg">
          <ArrowDownLeft className="h-5 w-5" /> Deposit
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>
            {step === "INITIATE" 
              ? "Enter amount to receive an M-Pesa STK Push." 
              : "Payment sent! Enter the M-Pesa code below."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          
          {/* --- STEP 1 FORM --- */}
          {step === "INITIATE" && (
            <>
              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">KES</span>
                  <Input 
                    type="number" 
                    placeholder="500" 
                    className="pl-12 text-lg font-bold"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>M-Pesa Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="pl-9"
                    placeholder="07..."
                  />
                </div>
              </div>
              <Button onClick={handleInitiateSubmit} disabled={isLoading} className="w-full mt-2">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Pay Now"}
              </Button>
            </>
          )}

          {/* --- STEP 2 FORM --- */}
          {step === "CONFIRM" && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center gap-3 border border-blue-100 dark:border-blue-800">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-sm">
                   <p className="font-medium text-blue-900 dark:text-blue-300">STK Push Sent</p>
                   <p className="text-blue-700 dark:text-blue-400 text-xs">Waiting for payment...</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>M-Pesa Receipt Code</Label>
                <Input
                  value={receipt}
                  onChange={(e) => setReceipt(e.target.value.toUpperCase())}
                  placeholder="e.g. QJH133591"
                  className="h-11 uppercase font-mono tracking-widest text-center text-lg"
                />
              </div>

              <Button onClick={handleConfirmSubmit} disabled={isLoading} className="w-full mt-2">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Confirm Payment"}
              </Button>
              
              <button 
                onClick={() => setStep("INITIATE")} 
                className="text-xs text-center text-muted-foreground hover:underline mt-1"
              >
                Didn't receive prompt? Try again
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// 2. WITHDRAW DIALOG (Cents Conversion + Phone Formatting)
// ----------------------------------------------------------------------

interface WithdrawProps {
  onWithdraw: (amountInCents: number, phone: string) => Promise<WithdrawalData>;
  isLoading: boolean;
  maxAmount: number; // Balance in CENTS
  defaultPhone?: string;
}

export function WithdrawDialog({ onWithdraw, isLoading, maxAmount, defaultPhone }: WithdrawProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(defaultPhone || "");

  const maxKes = maxAmount / 100; // Display limit in Shillings

  // Reset phone when dialog opens
  useEffect(() => {
    if (open && defaultPhone) {
      setPhone(defaultPhone);
    }
  }, [open, defaultPhone]);

  const handleSubmit = async () => {
    const val = parseInt(amount);

    // 1. Validation
    if (!val || val < 50) return toast.error("Minimum withdrawal is KES 50");
    if (val > maxKes) return toast.error("Insufficient funds");
    if (!phone || phone.length < 9) return toast.error("Invalid phone number");

    // 3. Format Phone (Remove 254 or leading 0, ensure it starts with 7 or 1)
    // Regex Logic: Remove non-digits, then strip '254' or '0' from start
    let formattedPhone = phone.replace(/\D/g, ''); // Remove spaces/dashes
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone.substring(3);
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }

    // Double check it looks like a valid KE number (starts with 7 or 1)
    if (!['7', '1'].includes(formattedPhone.charAt(0))) {
        return toast.error("Please enter a valid Safaricom/Airtel number");
    }

    // 4. Send to Backend
    await onWithdraw(val, formattedPhone);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 gap-2 h-12 text-base border-primary/20 hover:bg-primary/5" size="lg">
          <ArrowUpRight className="h-5 w-5" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
             Available Balance: <span className="font-bold text-primary">{formatMoney(maxAmount)}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          <div className="space-y-2">
            <Label>Amount to Withdraw</Label>
            <div className="relative">
               <span className="absolute left-3 top-2.5 text-muted-foreground">KES</span>
               <Input 
                 type="number" 
                 placeholder="1000" 
                 className="pl-12 text-lg font-bold"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
               />
            </div>
          </div>

          <div className="space-y-2">
             <Label>Send to Number</Label>
             <div className="relative">
                <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="pl-9"
                  placeholder="07..."
                />
             </div>
             <p className="text-[10px] text-muted-foreground">
               We will send funds to this M-Pesa number.
             </p>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading} className="w-full" variant="secondary">
            {isLoading ? <Loader2 className="animate-spin" /> : "Confirm Withdrawal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
