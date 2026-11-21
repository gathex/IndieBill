"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isValidGstin } from "@/lib/gst";

const clientSchema = z.object({
  name: z.string().min(1, "Client name is required.").max(120),
  email: z.email("Enter a valid email address."),
  company: z.string().max(120),
  phone: z.string().max(40),
  notes: z.string().max(2000),
  gstin: z
    .string()
    .max(15)
    .optional()
    .refine((val) => !val || !val.trim() || isValidGstin(val), {
      message: "Client GSTIN must be a valid 15-character Indian GST identification number.",
    }),
  state: z.string().max(100).optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

function normalize(input: ClientInput) {
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: input.company.trim() || null,
    phone: input.phone.trim() || null,
    notes: input.notes.trim() || null,
    gstin: input.gstin?.trim().toUpperCase() || null,
    state: input.state?.trim() || null,
  };
}

export async function createClient(input: ClientInput) {
  const userId = await requireUserId();
  const data = normalize(clientSchema.parse(input));

  const client = await prisma.client.create({ data: { userId, ...data } });
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return client;
}

export async function updateClient(id: string, input: ClientInput) {
  const userId = await requireUserId();
  const data = normalize(clientSchema.parse(input));
  const existing = await prisma.client.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Client not found.");

  await prisma.client.update({ where: { id }, data });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
  return { id };
}

export async function deleteClient(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const userId = await requireUserId();
  const existing = await prisma.client.findFirst({
    where: { id, userId },
    include: { _count: { select: { invoices: true } } },
  });
  if (!existing) throw new Error("Client not found.");
  if (existing._count.invoices > 0) {
    throw new Error("Delete this client's invoices before deleting the client.");
  }

  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}
