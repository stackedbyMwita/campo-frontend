"use client";

import { useState, useMemo } from "react";
// 1. Import keepPreviousData if you are on an older TanStack version, 
// but in v5 we use a function for placeholderData.
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
  List,
  AlertCircle
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// --- TYPE DEFINITION ---
interface QuestionData {
  _id: string;
  text: string;
  type: 'mcq' | 'text';
  options: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function QuestionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- 1. FETCH QUESTIONS (PAGINATED) ---
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "questions", page], // ⚡ Key includes page, so changing state triggers refetch
    queryFn: () => adminApi.getQuestions(page, 20), // ⚡ Fetch 20 items per page
    placeholderData: (prev) => prev, // ⚡ CRITICAL: Keeps page 1 data visible while page 2 loads
  });

  // MUTATION: DELETE
  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteQuestion,
    onSuccess: () => {
      toast.success("Question deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete")
  });

  // MUTATION: TOGGLE STATUS
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      adminApi.updateQuestion(id, { isActive }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    }
  });

  // --- 2. FRONTEND SEARCH ---
  const filteredQuestions = useMemo(() => {
    // Cast to unknown first to fix the Type mismatch error you saw earlier
    const list = (data?.data as unknown as QuestionData[]) || [];
    if (!search) return list;
    return list.filter((item) => 
      item.text.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // --- 3. COLUMNS DEFINITION ---
  const columns: ColumnDef<QuestionData>[] = [
    {
      accessorKey: "text",
      header: "Question Text",
      cell: ({ row }) => (
        <div className="max-w-[400px]">
          <span className="font-medium line-clamp-2" title={row.original.text}>
            {row.original.text}
          </span>
          {row.original.type === 'mcq' && row.original.options.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Options: {row.original.options.join(", ")}
            </p>
          )}
        </div>
      )
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge 
            variant="outline" 
            className={`capitalize font-normal pl-1.5 ${
              type === 'mcq' 
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-orange-50 text-orange-700 border-orange-200"
            }`}
          >
            {type === 'mcq' ? <List className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
            {type === 'mcq' ? 'Multiple Choice' : 'Text Input'}
          </Badge>
        )
      }
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge 
          variant={row.original.isActive ? "default" : "secondary"} 
          className={row.original.isActive ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
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
                <Link href={`/admin/questions/${item._id}`} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleStatusMutation.mutate({ id: item._id, isActive: !item.isActive })}
                className="cursor-pointer"
              >
                {item.isActive ? (
                  <><PauseCircle className="mr-2 h-4 w-4 text-orange-500" /> Deactivate</>
                ) : (
                  <><PlayCircle className="mr-2 h-4 w-4 text-green-600" /> Activate</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteId(item._id)}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                 <Trash2 className="mr-2 h-4 w-4" /> Delete
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
          <h1 className="text-3xl font-bold tracking-tight">Daily Questions</h1>
          <p className="text-muted-foreground">Manage the pool of daily engagement questions.</p>
        </div>
        <Link href="/admin/questions/new">
          <Button>
             <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </Link>
      </div>

      {/* ERROR STATE */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load questions.</AlertDescription>
        </Alert>
      )}

      {/* SEARCH */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border shadow-sm max-w-md">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search question text..." 
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="">
          <AppTable 
            columns={columns}
            data={filteredQuestions}
            isLoading={isLoading}
            // ⚡ Pagination Wiring
            pageCount={data?.pagination?.totalPages || 1}
            pageIndex={page}
            onPageChange={setPage}
            // Optional: Disable 'Next' button if we are using placeholder data (loading background)
          />
        </CardContent>
      </Card>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question?
              <span className="bg-accent/20 p-2 rounded-full ml-2">
                {/* 🛠️ FIX: Use .text instead of .title (which doesn't exist) */}
                "{data?.data.find((q: any) => q._id === deleteId)?.text}"
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
