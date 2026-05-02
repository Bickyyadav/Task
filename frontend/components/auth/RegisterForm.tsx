"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    full_name: z.string().min(1, "Full name is required").max(255),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["admin", "member"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "member",
    },
  });

  const currentRole = watch("role");

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(
      {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
      },
      {
        onSuccess: () => {
          // Cookie handled by auth store
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          placeholder="John Doe"
          autoComplete="name"
          {...register("full_name")}
          className={errors.full_name ? "border-destructive" : ""}
        />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("password")}
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className={errors.confirmPassword ? "border-destructive" : ""}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Join as</Label>
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant={currentRole === "member" ? "secondary" : "outline"}
            className={cn(
              "flex-1 h-20 flex-col gap-2 border-2",
              currentRole === "member" ? "border-violet-600 bg-violet-600/5" : ""
            )}
            onClick={() => setValue("role", "member")}
          >
            <div className="font-bold text-sm">Developer</div>
            <div className="text-[10px] text-muted-foreground">Work on tasks</div>
          </Button>
          <Button
            type="button"
            variant={currentRole === "admin" ? "secondary" : "outline"}
            className={cn(
              "flex-1 h-20 flex-col gap-2 border-2",
              currentRole === "admin" ? "border-violet-600 bg-violet-600/5" : ""
            )}
            onClick={() => setValue("role", "admin")}
          >
            <div className="font-bold text-sm">Admin</div>
            <div className="text-[10px] text-muted-foreground">Manage projects</div>
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
