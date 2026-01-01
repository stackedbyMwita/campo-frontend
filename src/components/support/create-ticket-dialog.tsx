"use client";

import { useState } from "react";
import { useSupport } from "@/hooks/use-support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { PlusCircle, Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

export function CreateTicketDialog() {
  const [open, setOpen] = useState(false);
  const { createTicket, isCreating } = useSupport();
  
  // Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!subject || !message) return toast.error("Please fill in all fields");
    
    await createTicket({ subject, category, message });
    
    // Reset & Close
    setSubject("");
    setMessage("");
    setCategory("GENERAL");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <MessageSquarePlus className="h-4 w-4" /> New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue clearly. Our team usually replies within 2 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Subject</label>
            <Input 
              placeholder="e.g. Withdrawal Delayed" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General Inquiry</SelectItem>
                <SelectItem value="PAYMENT">Payments & Withdrawals</SelectItem>
                <SelectItem value="TASKS">Task Issues</SelectItem>
                <SelectItem value="ACCOUNT">Account Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea 
              placeholder="Provide details about your issue..." 
              className="h-32 resize-none"
              value={message}
              onChange={(e: any) => setMessage(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={isCreating} className="w-full mt-2">
            {isCreating ? <Loader2 className="animate-spin mr-2" /> : "Submit Ticket"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
