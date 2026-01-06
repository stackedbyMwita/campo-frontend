"use client";

import { useState } from "react";
import { useAvailableTasks, useTaskHistory, useSubmitTask } from "@/hooks/use-tasks";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { Loader2, CheckCircle, Clock, Coins, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ColumnDef } from "@tanstack/react-table";
import { AppTable } from "@/components/tables/app-table";
import { TaskHistoryItem } from "@/types/api";
import { formatMoney } from "@/lib/utils";

export default function TasksPage() {
  // UI State
  const [activeTab, setActiveTab] = useState("available");
  const [historyPage, setHistoryPage] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const historyColumns: ColumnDef<TaskHistoryItem>[] = [
    {
      accessorKey: "taskTitle",
      header: "Task Detail",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{item.taskTitle}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.completedAt).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "amountEarned",
      header: "Reward",
      // Right align the reward column usually looks better
      meta: { className: "text-right" }, 
      cell: ({ row }) => (
        <div className="font-bold text-green-600 text-right">
          {formatMoney(row.original.rewardAmount)}
        </div>
      ),
    },
  ];
  
  const { 
    data: taskSession, 
    isLoading: loadingTask, 
    isError: errorTask 
  } = useAvailableTasks();

  const { 
    data: historyData, 
    isLoading: loadingHistory, 
    isPlaceholderData 
  } = useTaskHistory(historyPage);

  const { mutateAsync: submitTask, isPending: isSubmitting } = useSubmitTask();

  // Action: Called when "Finish" is clicked inside the TaskSheet
  const handleSheetComplete = async () => {
    if (!taskSession) return;

    try {
      await submitTask({ sessionId: taskSession.sessionId });
      setIsSheetOpen(false); // Close on success
    } catch (e) {
      // Error handled in hook (Sonner toast)
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Task Center</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Daily Task</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* --- AVAILABLE TASKS TAB --- */}
        <TabsContent value="available" className="space-y-4 mt-4">
          {loadingTask ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : errorTask ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load the daily task.</AlertDescription>
            </Alert>
          ) : !taskSession ? (
            <div className="text-center text-muted-foreground p-8 bg-muted/20 rounded-lg border border-dashed">
              <p>No tasks available right now.</p>
            </div>
          ) : (
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{taskSession.title}</CardTitle>
                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                    <Coins className="w-4 h-4" />
                    + {formatMoney(taskSession.reward)} 
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {taskSession.description || "Complete the questionnaire to earn your reward."}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-11 text-base font-semibold" 
                  onClick={() => setIsSheetOpen(true)}
                  disabled={isSubmitting || taskSession.status === "COMPLETED"}
                  variant={taskSession.status === "COMPLETED" ? "secondary" : "default"}
                >
                  {taskSession.status === "COMPLETED" ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Task Completed
                    </>
                  ) : (
                    <>
                      Start Task
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* --- HISTORY TAB --- */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle className="text-lg">Submission History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 1. The Table (Displays the Data) */}
              <AppTable
                columns={historyColumns}
                data={historyData?.data || []}
                isLoading={loadingHistory}
              />

              {/* 2. The Pagination (Rendered Manually below the table) */}
              {historyData && historyData.data.length > 0 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {historyPage} of {historyData.pagination.totalPages || 1}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setHistoryPage((p) => Math.max(p - 1, 1))}
                      disabled={historyPage === 1 || loadingHistory}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setHistoryPage((p) => p + 1)}
                      disabled={
                        isPlaceholderData || 
                        historyPage >= (historyData.pagination.totalPages || 1) || 
                        loadingHistory
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- REUSABLE SHEET COMPONENT --- */}
      <TaskSheet 
        session={taskSession ?? null}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onComplete={handleSheetComplete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}