"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin";

export type AdminActionResponse = {
  ok: boolean;
  status?: number;
  message?: string;
  error?: string;
  plan?: "FREE" | "PRO";
  isSuspended?: boolean;
};

export async function updateUserPlan(
  userId: string,
  plan: "FREE" | "PRO",
): Promise<AdminActionResponse> {
  const guard = await requireAdminAction();
  if (!guard.ok) {
    return guard;
  }

  if (!userId || (plan !== "FREE" && plan !== "PRO")) {
    return { ok: false, status: 400, error: "Invalid user or plan specified." };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, plan: true },
  });

  if (!targetUser) {
    return { ok: false, status: 404, error: "User not found." };
  }

  if (targetUser.plan === plan) {
    return {
      ok: true,
      plan,
      message: `${targetUser.email} is already on the ${plan} plan.`,
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { plan },
  });

  revalidatePath("/admin");
  return {
    ok: true,
    plan,
    message: `Updated ${targetUser.email} to ${plan} plan.`,
  };
}

export async function toggleUserSuspension(
  userId: string,
): Promise<AdminActionResponse> {
  const guard = await requireAdminAction();
  if (!guard.ok) {
    return guard;
  }

  if (!userId) {
    return { ok: false, status: 400, error: "Invalid user ID." };
  }

  if (userId === guard.userId) {
    return {
      ok: false,
      status: 400,
      error: "You cannot suspend your own admin account.",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isSuspended: true },
  });

  if (!targetUser) {
    return { ok: false, status: 404, error: "User not found." };
  }

  const nextSuspended = !targetUser.isSuspended;

  await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: nextSuspended },
  });

  revalidatePath("/admin");
  return {
    ok: true,
    isSuspended: nextSuspended,
    message: nextSuspended
      ? `${targetUser.email} has been suspended.`
      : `${targetUser.email} has been reactivated.`,
  };
}
