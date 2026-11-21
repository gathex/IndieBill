"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { registerUser } from "@/actions/auth";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { BrandLogo } from "@/components/BrandLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await registerUser({ name, email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <Link href="/" aria-label="IndieBill home">
              <BrandLogo size={36} />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create your account
          </CardTitle>
          <CardDescription>
            Start sending invoices in minutes with IndieBill
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign-In */}
          <div className="w-full flex flex-col items-center">
            <GoogleSignInButton text="Sign up with Google" />
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            <span className="absolute bg-white dark:bg-zinc-900 px-3 text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Or continue with
            </span>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-2.5 text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating…" : "Create account with Email"}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-zinc-900 dark:text-zinc-100 underline-offset-4 hover:underline"
            >
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
