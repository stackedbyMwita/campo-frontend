"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { PasswordInput } from "@/components/password-input"
import { useAuth } from "@/context/auth-context"

// 1. Define the Validation Schema (Frontend Only)
const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  countryCode: z.enum(["254", "255", "256"]),
  phoneNumber: z.string().min(9, "Phone number is too short").max(10, "Phone number is too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export default function SignUpPage() {
  const router = useRouter()
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false)

  // 2. Initialize the Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "254", // Default to Kenya
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
    },
  })

  // 3. Handle Submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        countryCode: values.countryCode,
        referralCode: values.referralCode || undefined,
      }

      await register(payload)

      toast.success("Account created!", { description: "Setting up your dashboard...",}
      )
    } catch (error: any) {
      console.error(error)
      toast.error("Registration failed", {
        description: error?.response?.data?.message || "Please check your details and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold font-heading">Create an account</h1>
        <p className="text-balance text-muted-foreground">
          Enter your information below to create your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          
          {/* Row: First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="m@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number with Custom Selector */}
          <div className="grid gap-2">
            <FormLabel>Phone Number</FormLabel>
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem className="w-[110px]">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="254">🇰🇪 +254</SelectItem>
                        <SelectItem value="255">🇹🇿 +255</SelectItem>
                        <SelectItem value="256">🇺🇬 +256</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Phone Input */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Referral Code (Optional) */}
          <FormField
            control={form.control}
            name="referralCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral Code (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 7DF85F9F" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create an account
          </Button>
          
        </form>
      </Form>

      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}