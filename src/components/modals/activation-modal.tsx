"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context"; // accessing our auth context
import { paymentService } from "@/services/payment.service";
import { toast } from "sonner";
import { Loader2, Smartphone, CheckCircle, Lock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ActivationModalProps {
  isOpen: boolean;
}

export default function ActivationModal({ isOpen }: ActivationModalProps) {
  const { user, refreshUser } = useAuth();
  
  // State for the 2-step process
  const [step, setStep] = useState<"INITIATE" | "CONFIRM">("INITIATE");
  const [loading, setLoading] = useState(false);
  
  // Form Data
  const [phoneNumber, setPhoneNumber] = useState("");
  const [checkoutID, setCheckoutID] = useState("");
  const [receipt, setReceipt] = useState("");

  // Pre-fill phone number from user profile
  useEffect(() => {
    if (user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
    }
  }, [user]);

  // --- LOGIC: STEP 1 (STK PUSH) ---
  const handleInitiate = async () => {
    setLoading(true);
    try {
      const res = await paymentService.initiateSTK({
        amount: 13000, // Hardcoded Activation Fee
        phoneNumber: phoneNumber,
      });

      // Save ID and move to step 2
      setCheckoutID(res.checkoutRequestID);
      setStep("CONFIRM");
      toast.info(`STK Push for Ksh${res.amount} sent!`, { description: `Check your phone to approve. ${res.checkoutRequestID}`, });
      console.log(res.checkoutRequestID);
    } catch (error: any) {
      toast.error("Failed to initiate", {
        description: error?.response?.data?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: STEP 2 (CONFIRM RECEIPT) ---
  const handleConfirm = async () => {
    if (!receipt) return toast.warning("Please enter the M-Pesa code");
    
    setLoading(true);
    try {
      await paymentService.confirmPayment({
        CheckoutRequestID: checkoutID,
        Status: "Success",
        MpesaReceiptNumber: receipt,
      });

      toast.success("Account Activated!", { description: "Welcome to the dashboard." });
      
      // Refresh user to update 'isActive/isVerified' status
      // This will cause the Guard to unmount this modal automatically
      await refreshUser(); 

    } catch (error: any) {
      toast.error("Activation Failed", {
        description: "Invalid code or transaction not found.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-2 w-fit">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Account Activation</DialogTitle>
          <DialogDescription className="text-center">
            Pay <span className="font-bold text-foreground">KES 130</span> to unlock your earnings.
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: ENTER PHONE & PAY */}
        {step === "INITIATE" && (
          <div className="space-y-4 mt-2">
             <div className="bg-muted/40 p-4 rounded-lg text-center">
               <p className="text-sm text-muted-foreground">Activation Fee</p>
               <p className="text-3xl font-bold text-primary">KES 130</p>
               <p>{checkoutID}</p>
             </div>

             <div className="space-y-2">
               <Label>M-Pesa Number</Label>
               <div className="relative">
                 <Smartphone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                 <Input
                   value={phoneNumber}
                   onChange={(e) => setPhoneNumber(e.target.value)}
                   className="pl-10 h-11"
                   placeholder="2547..."
                 />
               </div>
             </div>

             <Button 
               onClick={handleInitiate} 
               disabled={loading} 
               className="w-full h-11 text-base"
             >
               {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
               Pay Now
             </Button>
          </div>
        )}

        {/* STEP 2: ENTER RECEIPT */}
        {step === "CONFIRM" && (
          <div className="space-y-4 mt-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center gap-3 border border-blue-100 dark:border-blue-800">
               <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
               <div className="text-sm">
                 <p className="font-medium text-blue-900 dark:text-blue-300">STK Push Sent</p>
                 <p className="text-blue-700 dark:text-blue-400 text-xs">If you paid, enter the code below.</p>
               </div>
            </div>

            <div className="space-y-2">
              <Label>M-Pesa Receipt Code</Label>
              <Input
                value={receipt}
                onChange={(e) => setReceipt(e.target.value.toUpperCase())}
                placeholder="e.g. QJH133591"
                className="h-11 uppercase font-mono tracking-widest"
              />
            </div>

            <Button 
              onClick={handleConfirm} 
              disabled={loading} 
              className="w-full h-11 text-base"
            >
               {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
               Confirm Payment
            </Button>
            
            <button 
              onClick={() => setStep("INITIATE")} 
              className="w-full text-xs text-muted-foreground hover:underline mt-2"
            >
              Didn't receive prompt? Try again
            </button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
