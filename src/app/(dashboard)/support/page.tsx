"use client";

import { useState, useEffect, useRef } from "react";
import { useSupport } from "@/hooks/use-support";
import { SupportTicket } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Components
import { CreateTicketDialog } from "@/components/support/create-ticket-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"; // For Mobile Chat

// Icons
import { 
  Send, 
  Search, 
  LifeBuoy, 
  MessageSquare, 
  User, 
  Bot,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function SupportPage() {
  const { user } = useAuth();
  const { tickets, isLoading, replyTicket, isReplying } = useSupport();
  
  // State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile Sheet State

  // Auto-scroll to bottom of chat
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.messages]);

  // Filter Logic
  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    await replyTicket({ id: selectedTicket._id, message: replyText });
    setReplyText("");
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsMobileOpen(true); // Open sheet on mobile
  };

  // --- RENDER HELPERS ---

  // 1. The Chat Interface (Used in both Desktop Right Pane & Mobile Sheet)
  const ChatInterface = () => {
    if (!selectedTicket) return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <LifeBuoy className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Support Center</h3>
        <p>Select a ticket from the list to view the conversation or create a new one.</p>
      </div>
    );

    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur">
          <div>
            <h2 className="font-bold flex items-center gap-2">
              {selectedTicket.subject}
              <Badge variant={selectedTicket.status === "OPEN" ? "default" : "secondary"}>
                {selectedTicket.status}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">Ticket ID: #{selectedTicket._id.slice(-6)}</p>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 bg-muted/20">
          <div className="space-y-4">
             {/* Initial creation note */}
             <div className="flex justify-center">
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Ticket created {formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}
                </span>
             </div>

             {selectedTicket.messages.map((msg) => {
               const isMe = msg.sender === "USER";
               return (
                 <div key={msg._id} className={cn("flex gap-3 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                   <Avatar className="h-8 w-8 mt-1">
                     <AvatarFallback className={isMe ? "bg-primary text-primary-foreground" : "bg-muted"}>
                       {isMe ? "ME" : <Bot className="h-4 w-4" />}
                     </AvatarFallback>
                   </Avatar>
                   <div className={cn(
                     "rounded-2xl px-4 py-2 text-sm shadow-sm",
                     isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"
                   )}>
                     {msg.message}
                     <div className={cn("text-[10px] mt-1 opacity-70", isMe ? "text-primary-foreground" : "text-muted-foreground")}>
                       {formatDistanceToNow(new Date(msg.createdAt))}
                     </div>
                   </div>
                 </div>
               );
             })}
             <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendReply(); }}
            className="flex gap-2"
          >
            <Input 
              value={replyText} 
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1"
              disabled={selectedTicket.status === "CLOSED" || isReplying}
            />
            <Button type="submit" size="icon" disabled={selectedTicket.status === "CLOSED" || isReplying}>
              {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          {selectedTicket.status === "CLOSED" && (
             <p className="text-xs text-center text-muted-foreground mt-2">This ticket is closed. Please create a new one.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] p-4 md:p-8 gap-4">
      
      {/* --- PAGE HEADER --- */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
          <p className="text-muted-foreground hidden md:block">We are here to help you.</p>
        </div>
        <CreateTicketDialog />
      </div>

      {/* --- MAIN CONTENT (INBOX LAYOUT) --- */}
      <div className="flex flex-1 border rounded-xl overflow-hidden shadow-sm bg-card">
        
        {/* LEFT PANE: TICKET LIST */}
        <div className="w-full md:w-87.5 lg:w-100 border-r flex flex-col bg-muted/10">
          
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tickets..." 
                className="pl-9 bg-background" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
               <div className="p-4 text-center text-muted-foreground text-sm">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground">
                 <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                 <p className="text-sm">No tickets found</p>
               </div>
            ) : (
               <div className="flex flex-col">
                 {filteredTickets.map((ticket) => (
                   <button
                     key={ticket._id}
                     onClick={() => openTicket(ticket)}
                     className={cn(
                       "flex flex-col items-start gap-2 p-4 text-left border-b transition-all hover:bg-muted/50",
                       selectedTicket?._id === ticket._id && "bg-muted border-l-4 border-l-primary"
                     )}
                   >
                     <div className="flex w-full flex-col gap-1">
                       <div className="flex items-center justify-between">
                         <span className="font-semibold text-sm line-clamp-1">{ticket.subject}</span>
                         <span className="text-[10px] text-muted-foreground shrink-0">
                           {formatDistanceToNow(new Date(ticket.createdAt))}
                         </span>
                       </div>
                       <span className="text-xs text-muted-foreground line-clamp-2">
                         {ticket.messages[ticket.messages.length - 1]?.message || "No messages yet"}
                       </span>
                       <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] h-5 px-1">{ticket.category}</Badge>
                          {ticket.status === "OPEN" && (
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                          )}
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
            )}
          </ScrollArea>
        </div>

        {/* RIGHT PANE: DESKTOP CHAT VIEW */}
        <div className="hidden md:block flex-1 bg-background relative">
           <ChatInterface />
        </div>
      </div>

      {/* --- MOBILE SHEET: CHAT VIEW --- */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0">
          <div className="sr-only">
            <SheetTitle>Support Chat</SheetTitle>
            <SheetDescription>
              Chat conversation with support regarding ticket {selectedTicket?.subject}
            </SheetDescription>
          </div>
           <ChatInterface />
        </SheetContent>
      </Sheet>

    </div>
  );
}
