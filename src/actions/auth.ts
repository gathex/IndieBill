"use server";

import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { signIn, signOut } from "@/auth";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const hashedPassword = await hash(input.password, 10);
  await prisma.user.create({
    data: {
      name: input.name.trim() || null,
      email,
      passwordHash: hashedPassword,
    },
  });

  await signIn("credentials", {
    email,
    password: input.password,
    redirectTo: "/dashboard",
  });
}

export async function loginUser(input: {
  email: string;
  password: string;
}) {
  await signIn("credentials", {
    email: input.email,
    password: input.password,
    redirectTo: "/dashboard",
  });
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}
