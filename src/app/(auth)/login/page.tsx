"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { BrandLogo } from "@/components/BrandLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const errorMessage =
    error ||
    (urlError === "Configuration"
      ? "Authentication configuration issue. If signing in with Google, verify that 'http://localhost:3000/api/auth/callback/google' is added to Authorized redirect URIs in Google Cloud Console."
      : urlError === "AccessDenied"
        ? "Access denied. You do not have permission to sign in."
        : urlError
          ? `Authentication error: ${urlError}`
          : null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirectTo: "/dashboard",
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2">
          <Link href="/" aria-label="IndieBill home">
            <BrandLogo size={36} />
          </Link>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription>
          Sign in to your IndieBill account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Google Sign-In */}
        <div className="w-full flex flex-col items-center">
          <GoogleSignInButton text="Sign in with Google" />
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          <span className="absolute bg-white dark:bg-zinc-900 px-3 text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Or continue with
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-2.5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in with Email"}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="font-medium text-zinc-900 dark:text-zinc-100 underline-offset-4 hover:underline"
          >
            Sign up
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <Suspense fallback={<div className="w-full max-w-md h-96 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-xl" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
