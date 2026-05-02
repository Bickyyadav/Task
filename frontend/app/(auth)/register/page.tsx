import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Zap } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left: decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-48 w-48 rounded-full bg-purple-500/15 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-2xl shadow-violet-500/30">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">ProjectHub</h1>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Start managing
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              like a pro.
            </span>
          </h2>
          <p className="text-lg text-violet-200/70 max-w-md">
            Join your team and take control of projects with an intuitive,
            real-time workspace.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              ProjectHub
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Create an account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started with your free account
            </p>
          </div>

          <RegisterForm />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
