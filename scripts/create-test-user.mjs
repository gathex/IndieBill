import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = "test@example.com";
const password = "password123";
const hash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: { email },
  update: { passwordHash: hash },
  create: { email, passwordHash: hash, name: "Test Freelancer" },
});
console.log("user:", user.id, user.email);

let client = await prisma.client.findFirst({ where: { userId: user.id, email: "billing@acme.com" } });
if (!client) {
  client = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Acme Corp",
      email: "billing@acme.com",
      company: "Acme Corp",
    },
  });
}
console.log("client:", client.id, client.name);

await prisma.$disconnect();
