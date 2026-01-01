"use client";

// 1. Add 'use' back to imports
import { use, useEffect, useRef } from "react"; 
import { useForm, useFieldArray } from "react-hook-form";
// ... keep other imports exactly the same ...
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

import { adminApi } from "@/services/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

/* ------------------------ helpers (SAME) ------------------------ */
const toLocalDatetime = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/* ------------------------ FORM SCHEMA (SAME) ------------------------ */
const taskFormSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  type: z.enum(["mcq", "text", "mixed"]),
  rewardMultiplier: z.number().min(0.1),
  expiresAt: z.string(),
  isActive: z.boolean(),
  questions: z.array(
    z.object({
      text: z.string().min(3),
      options: z.array(z.string()),
      expectedAnswer: z.string().min(1),
      isMcq: z.boolean(),
    })
  ),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

/* ------------------------ API PAYLOAD TYPE (SAME) ------------------------ */
type TaskApiPayload = {
  title: string;
  description: string;
  type: "mcq" | "text" | "mixed";
  rewardMultiplier?: number;
  expiresAt: string;
  isActive: boolean;
  questions: {
    text: string;
    expectedAnswer: string;
    options?: string[];
  }[];
};

/* ------------------------ transform (SAME) ------------------------ */
const toApiPayload = (values: TaskFormValues): TaskApiPayload => ({
  title: values.title.trim(),
  description: values.description.trim(),
  type: values.type,
  rewardMultiplier: values.rewardMultiplier,
  isActive: values.isActive,
  expiresAt: new Date(values.expiresAt).toISOString(),
  questions: values.questions.map(q => {
    const isMCQ =
      values.type === "mcq" ||
      (values.type === "mixed" && q.isMcq);

    return {
      text: q.text.trim(),
      expectedAnswer: q.expectedAnswer.trim(),
      ...(isMCQ
        ? { options: q.options.filter(o => o.trim() !== "") }
        : {}),
    };
  }),
});

/* ------------------------ page ------------------------ */

export default function TaskEditorPage({
  params,
}: {
  // 2. Update Type: params is a Promise in Next.js 15+
  params: Promise<{ taskId: string }>;
}) {
  // 3. Unwrap the Promise using React.use()
  const { taskId } = use(params);
  
  const isEditing = taskId !== "new";
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasReset = useRef(false);

  // ... (The rest of the component remains EXACTLY the same as before) ...
  
  /* ------------------------ data ------------------------ */

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "task", taskId],
    queryFn: () => adminApi.getTask(taskId),
    enabled: isEditing,
  });

  /* ------------------------ form ------------------------ */

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "mixed",
      rewardMultiplier: 1,
      isActive: true,
      expiresAt: toLocalDatetime(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      ),
      questions: [
        {
          text: "",
          options: ["", "", "", ""],
          expectedAnswer: "",
          isMcq: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const taskType = form.watch("type");
  const watchedQuestions = form.watch("questions");

  /* ------------------------ prefill ------------------------ */

  useEffect(() => {
    if (data?.data && !hasReset.current) {
      hasReset.current = true;
      const task = data.data;

      form.reset({
        title: task.title,
        description: task.description ?? "",
        type: task.type,
        rewardMultiplier: task.rewardMultiplier,
        isActive: task.isActive,
        expiresAt: toLocalDatetime(task.expiresAt),
        questions: task.questions.map((q: any) => ({
          text: q.text,
          options: [0, 1, 2, 3].map(i => q.options?.[i] ?? ""),
          expectedAnswer: q.expectedAnswer,
          isMcq: Array.isArray(q.options) && q.options.length > 0,
        })),
      });
    }
  }, [data, form]);

  /* ------------------------ submit ------------------------ */

  const onSubmit = (values: TaskFormValues) => {
    const payload = toApiPayload(values);
    isEditing
      ? updateMutation.mutate(payload)
      : createMutation.mutate(payload);
  };

  /* ------------------------ mutations ------------------------ */

  const createMutation = useMutation({
    mutationFn: (data: TaskApiPayload) => adminApi.createTask(data),
    onSuccess: () => {
      toast.success("Task created");
      queryClient.invalidateQueries({ queryKey: ["admin", "tasks"] });
      router.push("/admin/tasks");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TaskApiPayload) =>
      adminApi.updateTask(taskId, data),
    onSuccess: () => {
      toast.success("Task updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "tasks"] });
      router.push("/admin/tasks");
    },
  });

  if (isEditing && isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  /* ------------------------ ui ------------------------ */

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Link href="/admin/tasks">
            <Button size="icon" variant="ghost">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Task" : "Create Task"}
          </h1>
        </div>
        <Badge variant={form.watch("isActive") ? "default" : "destructive"}>
          {form.watch("isActive") ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* SETTINGS */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="mcq">MCQ</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="rewardMultiplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Multiplier</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="expiresAt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between border p-3 rounded-lg mt-8">
                  <FormLabel>Active</FormLabel>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* QUESTIONS */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">Questions ({fields.length})</h2>
              <Button type="button" size="sm" variant="outline"
                onClick={() =>
                  append({
                    text: "",
                    options: ["", "", "", ""],
                    expectedAnswer: "",
                    isMcq: taskType !== "text",
                  })
                }>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>

            {fields.map((f, index) => {
              const isMcq =
                taskType === "mcq" ||
                (taskType === "mixed" && watchedQuestions?.[index]?.isMcq);

              return (
                <Card key={f.id} className="relative">
                  <Button type="button" size="icon" variant="ghost"
                    className="absolute right-2 top-2"
                    onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <CardContent className="space-y-4 pt-6">
                    <FormField control={form.control} name={`questions.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder="Question..." {...field} /></FormControl>
                        </FormItem>
                      )} />

                    {isMcq && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[0,1,2,3].map(i => (
                          <FormField key={i} control={form.control}
                            name={`questions.${index}.options.${i}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl><Input placeholder={`Option ${i+1}`} {...field} /></FormControl>
                              </FormItem>
                            )} />
                        ))}
                      </div>
                    )}

                    <FormField control={form.control} name={`questions.${index}.expectedAnswer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isMcq ? "Correct Answer" : "Expected Answer"}</FormLabel>
                          {isMcq ? (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {watchedQuestions?.[index]?.options?.map(
                                  (opt, i) =>
                                    opt && <SelectItem key={i} value={opt}>{opt}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input {...field} />
                          )}
                        </FormItem>
                      )} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end gap-4 sticky bottom-6 bg-background/80 backdrop-blur p-4 border rounded-xl">
            <Link href="/admin/tasks"><Button type="button" variant="ghost">Cancel</Button></Link>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}