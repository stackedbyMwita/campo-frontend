"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  CheckCheck, 
  MailOpen, 
  Clock, 
  AlertCircle 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NotificationsSheet() {
  const [isOpen, setIsOpen] = useState(false);
  
  // 1. Use the Hook
  const { 
    notifications, 
    unreadCount, 
    markRead, 
    markAllRead, 
    isLoading 
  } = useNotifications();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* --- TRIGGER (THE BELL ICON) --- */}
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          
          {/* Unread Counter Badge */}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </SheetTrigger>

      {/* --- CONTENT --- */}
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="p-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0.5 h-5 text-xs">
                    {unreadCount} New
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription>
                Stay updated with your earnings and account activity.
              </SheetDescription>
            </div>
            
            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10"
                onClick={() => markAllRead()}
              >
                <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* --- LIST AREA --- */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex flex-col gap-4 p-4">
               {/* Skeletons */}
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                       <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                       <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                 </div>
               ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-8 text-muted-foreground">
              <div className="bg-muted p-4 rounded-full mb-4 opacity-50">
                 <Bell className="h-8 w-8" />
              </div>
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No new notifications at the moment.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => !notification.isRead && markRead(notification._id)}
                  className={cn(
                    "flex items-start gap-4 p-4 text-left transition-colors hover:bg-muted/50",
                    !notification.isRead ? "bg-primary/5 hover:bg-primary/10" : "bg-background"
                  )}
                >
                  {/* Icon Indicator */}
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                    !notification.isRead 
                      ? "border-primary/20 bg-primary/10 text-primary" 
                      : "border-muted bg-muted/20 text-muted-foreground"
                  )}>
                    {!notification.isRead ? <AlertCircle className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-medium leading-none", !notification.isRead && "text-primary")}>
                        {notification.title || "System Notification"}
                      </p>
                      <span className="flex items-center text-[10px] text-muted-foreground whitespace-nowrap">
                         <Clock className="mr-1 h-3 w-3" />
                         {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className={cn("text-xs line-clamp-2", !notification.isRead ? "text-foreground" : "text-muted-foreground")}>
                      {notification.message}
                    </p>
                  </div>

                  {/* Unread Dot Indicator */}
                  {!notification.isRead && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
