"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

// --- VALIDATION SCHEMA ---
const formSchema = z.object({
  text: z.string().min(5, "Question text must be at least 5 characters"),
  type: z.enum(["mcq", "text"]),
  // 🛠️ FIX: Remove .default(true). We handle the default in useForm.
  // This ensures TS sees it as strictly 'boolean', not 'boolean | undefined'.
  isActive: z.boolean(),
  options: z.array(z.object({ value: z.string().min(1, "Option cannot be empty") }))
    .optional(),
}).refine((data) => {
  if (data.type === "mcq") {
    // Ensure options exist and have at least 2 items
    return data.options && data.options.length >= 2;
  }
  return true;
}, {
  message: "Multiple Choice Questions must have at least 2 options",
  path: ["options"], // Shows error on the options field
});

type FormValues = z.infer<typeof formSchema>;

export default function QuestionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const isEditing = params.questionId !== "new";
  const questionId = params.questionId as string;

  // 1. SETUP FORM
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      type: "text",
      isActive: true, // 👈 Default value handled here
      options: [{ value: "" }, { value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options" as any, 
  });

  const watchType = form.watch("type");

  // 2. FETCH DATA (If Editing)
  const { data: existingQuestion, isLoading: isFetching } = useQuery({
    queryKey: ["admin", "question", questionId],
    queryFn: () => adminApi.getQuestion(questionId),
    enabled: isEditing,
  });

  // 3. POPULATE FORM
  useEffect(() => {
    if (existingQuestion?.data) {
      // Use 'as any' here if backend type slightly mismatches, 
      // but usually existingQuestion.data is enough.
      const q = existingQuestion.data;
      
      form.reset({
        text: q.text,
        type: q.type as "mcq" | "text",
        isActive: q.isActive,
        // Map ["A", "B"] -> [{value: "A"}, {value: "B"}]
        options: q.options?.map((opt: string) => ({ value: opt })) || [{ value: "" }, { value: "" }],
      });
    }
  }, [existingQuestion, form]);

  // 4. MUTATION
  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      // Transform [{value: "A"}] -> ["A"]
      const payload = {
        ...values,
        options: values.type === 'mcq' ? values.options?.map(o => o.value) : []
      };

      if (isEditing) {
        return adminApi.updateQuestion(questionId, payload);
      }
      return adminApi.createQuestion(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Question updated" : "Question created");
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
      router.push("/admin/questions");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  if (isEditing && isFetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/admin/questions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Question" : "New Question"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Modify existing question details." : "Create a new daily engagement task."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* STATUS SWITCH */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Disable to hide this question from users immediately.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                )}
              />

              {/* QUESTION TYPE */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">Text Input (Open Answer)</SelectItem>
                        <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      MCQ requires predefined options. Text allows users to type freely.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TEXT AREA */}
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g. Who is the president of Kenya?" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DYNAMIC OPTIONS (Only for MCQ) */}
              {watchType === "mcq" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base font-semibold">Answer Options</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => append({ value: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Option
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                        <span className="text-sm font-mono text-muted-foreground w-6 text-center">
                           {String.fromCharCode(65 + index)}.
                        </span>
                        <FormField
                          control={form.control}
                          name={`options.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="flex-1 space-y-0">
                              <FormControl>
                                <Input {...field} placeholder={`Option ${index + 1}`} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-500"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <FormMessage>
                    {form.formState.errors.options?.root?.message}
                  </FormMessage>
                </div>
              )}

            </CardContent>
          </Card>

          {/* ACTIONS */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/questions">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Question
                </>
              )}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}