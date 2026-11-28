import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Verifies that the authenticated session's `user.id` exists in `prisma.user`.
 * Redirects cleanly to `/login` when unauthenticated or when the database user record is missing.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    redirect("/login?session=expired");
  }

  return user.id;
}
