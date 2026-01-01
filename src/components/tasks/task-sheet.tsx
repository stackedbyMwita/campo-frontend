// src/components/task-sheet.tsx
"use client";

import { useState } from "react";
import { TaskSession } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Trophy, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";

// Simple helper to format money
const formatMoney = (amount: number) => `$${(amount / 100).toFixed(2)}`;

interface TaskSheetProps {
  session: TaskSession | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => Promise<void>;
  isSubmitting: boolean;
}

export function TaskSheet({ session, isOpen, onClose, onComplete, isSubmitting }: TaskSheetProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  if (!session) return null;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    // 1. Validation: Ensure all questions have a non-empty answer
    const allAnswered = session.questions.every(q => {
        const ans = answers[q._id];
        return ans && ans.trim().length > 0;
    });

    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    
    // 2. Submit
    await onComplete();
    setAnswers({}); // Reset form after success
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* LAYOUT FIX: 
         - h-full & max-h-screen: Forces the sheet to fill the viewport height.
         - overflow-hidden: Prevents the main container from scrolling.
         - p-0: Removes default padding so we can control it per section.
      */}
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 h-full max-h-screen overflow-hidden">
        
        {/* HEADER: Fixed at top (shrink-0) */}
        <SheetHeader className="space-y-4 px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1">
               <Zap className="h-3 w-3 text-orange-500" /> Daily Challenge
            </Badge>
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white gap-1 pl-2 pr-3 py-1 text-sm">
              <Trophy className="h-3 w-3" />
              {formatMoney(session.reward)}
            </Badge>
          </div>
          <div>
            <SheetTitle className="text-xl">Your Questions</SheetTitle>
            <SheetDescription className="mt-1 text-sm">
              Answer the following {session.questions.length} questions to claim your reward.
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* SCROLL AREA: Fills remaining space (flex-1) */}
        <ScrollArea className="flex-1 h-[200px]">
          {/* Content padding is applied here, inside the scroll view */}
          <div className="p-6 space-y-6 pb-10">
            {session.questions.map((q, idx) => (
              <div key={q._id} className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                
                {/* Question Label */}
                <div className="flex gap-3">
                   <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                     {idx + 1}
                   </span>
                   <div className="space-y-1">
                      <p className="font-medium text-sm leading-6">{q.text}</p>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground font-normal">
                         {q.type === 'mcq' ? 'Multiple Choice' : 'Text Input'}
                      </Badge>
                   </div>
                </div>

                {/* Question Input */}
                <div className="pl-9 pt-1">
                    {q.type === 'mcq' ? (
                        <RadioGroup 
                          onValueChange={(val) => handleAnswerChange(q._id, val)} 
                          value={answers[q._id]}
                          className="space-y-3"
                        >
                          {q.options.map((opt) => (
                            <div key={opt} className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${answers[q._id] === opt ? 'bg-primary/5 border-primary' : 'hover:bg-background bg-card'}`}>
                              <RadioGroupItem value={opt} id={`${q._id}-${opt}`} />
                              <Label htmlFor={`${q._id}-${opt}`} className="font-normal cursor-pointer text-sm w-full">
                                {opt}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                    ) : (
                        <Input 
                          placeholder="Type your answer here..." 
                          value={answers[q._id] || ''}
                          onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                          className="bg-background"
                        />
                    )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* FOOTER: Fixed at bottom (shrink-0) */}
        <SheetFooter className="p-6 border-t bg-background z-10 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                 <span className="animate-spin mr-2">⏳</span> Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Finish & Claim {formatMoney(session.reward)}
              </>
            )}
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}