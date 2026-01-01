"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { 
  MoreHorizontal, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  PlayCircle, 
  PauseCircle,
  FileText,
  HelpCircle,
  List
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Components
import { AppTable } from "@/components/tables/app-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";

// --- 1. DEFINE EXACT TYPE BASED ON YOUR JSON ---
interface TaskData {
  _id: string;
  title: string;
  description: string;
  type: 'mcq' | 'text' | 'mixed';
  rewardMultiplier: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  questions: any[]; // We don't need full question detail for the table
}

export default function TasksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // FETCH TASKS
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "tasks", page],
    queryFn: () => adminApi.getTasks(page, 20), // Fetching 20 items per page as per your JSON
  });

  // MUTATION: DELETE
  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteTask,
    onSuccess: () => {
      toast.success("Task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "tasks"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete task")
  });

  // MUTATION: TOGGLE STATUS
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      adminApi.updateTask(id, { isActive }),
    onSuccess: () => {
      toast.success("Task status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "tasks"] });
    }
  });

  // --- 2. FRONTEND SEARCH LOGIC ---
  // Filter the fetched data based on the search input
  const filteredTasks = useMemo(() => {
    const tasks = (data?.data as TaskData[]) || [];
    if (!search) return tasks;
    return tasks.filter((task) => 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // --- 3. COLUMNS DEFINITION ---
  const columns: ColumnDef<TaskData>[] = [
    {
      accessorKey: "title",
      header: "Task Details",
      cell: ({ row }) => (
        <div className="flex flex-col max-w-[300px]">
          <span className="font-medium truncate">{row.original.title}</span>
          <span className="text-xs text-muted-foreground truncate">
            {row.original.description}
          </span>
        </div>
      )
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        let icon = <HelpCircle className="w-3 h-3 mr-1" />;
        let color = "bg-slate-100 text-slate-700";

        if (type === 'mcq') {
           icon = <List className="w-3 h-3 mr-1" />;
           color = "bg-blue-50 text-blue-700 border-blue-200";
        } else if (type === 'text') {
           icon = <FileText className="w-3 h-3 mr-1" />;
           color = "bg-orange-50 text-orange-700 border-orange-200";
        }

        return (
          <Badge variant="outline" className={`capitalize font-normal ${color} pl-1.5`}>
            {icon} {type}
          </Badge>
        )
      }
    },
    {
      accessorKey: "rewardMultiplier",
      header: "Reward",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Badge variant="secondary" className="font-mono text-xs">
            x{row.original.rewardMultiplier.toFixed(1)}
          </Badge>
        </div>
      )
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"} className={row.original.isActive ? "bg-green-600 hover:bg-green-700" : ""}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => {
        const date = new Date(row.original.expiresAt);
        const isExpired = date < new Date();
        return (
          <span className={`text-xs ${isExpired ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
            {format(date, "MMM d, yyyy")}
          </span>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/tasks/${task._id}`} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" /> Edit Task
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleStatusMutation.mutate({ id: task._id, isActive: !task.isActive })}
                className="cursor-pointer"
              >
                {task.isActive ? (
                  <><PauseCircle className="mr-2 h-4 w-4 text-orange-500" /> Deactivate</>
                ) : (
                  <><PlayCircle className="mr-2 h-4 w-4 text-green-600" /> Activate</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteId(task._id)}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                 <Trash2 className="mr-2 h-4 w-4" /> Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">Manage quizzes, surveys, and engagement tasks.</p>
        </div>
        <Link href="/admin/tasks/new">
          <Button>
             <Plus className="mr-2 h-4 w-4" /> Create Task
          </Button>
        </Link>
      </div>

      {/* SEARCH (Frontend Only) */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border shadow-sm max-w-md">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Filter displayed tasks..." 
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <Card>
        <CardContent>
          <AppTable 
            columns={columns}
            data={filteredTasks}
            isLoading={isLoading}
            pageCount={data?.pagination?.totalPages || 1}
            pageIndex={page}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{data?.data.find((t: any) => t._id === deleteId)?.title}". 
              Users will no longer see this task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}