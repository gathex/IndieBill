import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function stripQuotesAndTrim(value: string): string {
  return value.trim().replace(/^["']+|["']+$/g, "").trim();
}

/**
 * Parses `process.env.ADMIN_EMAILS` (comma-separated) into normalized lowercase emails,
 * trimming surrounding spaces and quotes from both the full value and each entry.
 */
export function getAdminEmails(): string[] {
  const raw = stripQuotesAndTrim(process.env.ADMIN_EMAILS ?? "");
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => stripQuotesAndTrim(entry).toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true if the given email is configured in `process.env.ADMIN_EMAILS`.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = stripQuotesAndTrim(email).toLowerCase();
  const admins = getAdminEmails();
  return admins.includes(normalized);
}

/**
 * Server Component guard for `/admin` pages.
 * Redirects unauthenticated users to `/login` and non-admins (or suspended users) to `/dashboard`.
 * Falls back to the database user's email when the session only contains `userId`.
 */
export async function requireAdmin() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isSuspended: true,
    },
  });

  const resolvedEmail = dbUser?.email ?? session?.user?.email ?? null;

  if (!dbUser || dbUser.isSuspended || !isAdminEmail(resolvedEmail)) {
    redirect("/dashboard");
  }

  return {
    userId: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image,
  };
}

export type AdminActionGuardResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: 403; error: string };

/**
 * Server Action guard for admin mutations.
 * Returns a 403 Forbidden result object instead of redirecting when unauthorized.
 */
export async function requireAdminAction(): Promise<AdminActionGuardResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      ok: false,
      status: 403,
      error: "403 Forbidden: Admin access is required.",
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isSuspended: true },
  });

  const resolvedEmail = dbUser?.email ?? session?.user?.email ?? null;

  if (!dbUser || dbUser.isSuspended || !isAdminEmail(resolvedEmail)) {
    return {
      ok: false,
      status: 403,
      error: "403 Forbidden: Admin access is required.",
    };
  }

  return {
    ok: true,
    userId: dbUser.id,
    email: dbUser.email,
  };
}
