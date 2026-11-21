import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seed() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {
      name: "Test Freelancer",
      businessName: "Northstar Studio",
      businessAddress: "123 Market St\nSan Francisco, CA 94103",
      currency: "USD",
      country: "US",
      language: "en",
      logoDataUrl: null,
      qrName: "Northstar Studio",
      qrVpa: "northstar@bank",
      qrUpiId: "northstar@upi",
      qrAccountNumber: "000123456789",
      passwordHash,
    },
    create: {
      email: "test@example.com",
      name: "Test Freelancer",
      businessName: "Northstar Studio",
      businessAddress: "123 Market St\nSan Francisco, CA 94103",
      currency: "USD",
      country: "US",
      language: "en",
      logoDataUrl: null,
      qrName: "Northstar Studio",
      qrVpa: "northstar@bank",
      qrUpiId: "northstar@upi",
      qrAccountNumber: "000123456789",
      passwordHash,
    },
  });

  const catalogItemSpecs = [
    {
      name: "UI/UX Design Retainer",
      description: "Dedicated monthly product design sprints, wireframing, and design system maintenance",
      rate: 3500,
      unit: "month",
      hsnSac: "998314",
      defaultTaxRate: 8.5,
      isActive: true,
    },
    {
      name: "Full-Stack Web Development",
      description: "Custom Next.js & React web application architecture, API development, and frontend implementation",
      rate: 120,
      unit: "hr",
      hsnSac: "998313",
      defaultTaxRate: 8.5,
      isActive: true,
    },
    {
      name: "Brand Identity Package",
      description: "Comprehensive logo design, brand guidelines, typography system, and vector asset deliverables",
      rate: 2200,
      unit: "project",
      hsnSac: "998314",
      defaultTaxRate: 8.5,
      isActive: true,
    },
    {
      name: "Design System & Component Library",
      description: "Figma design tokens, reusable React/Tailwind component library, and documentation handoff",
      rate: 1800,
      unit: "item",
      hsnSac: "998314",
      defaultTaxRate: 8.5,
      isActive: true,
    },
    {
      name: "Technical SEO & Performance Audit",
      description: "Core Web Vitals audit, Lighthouse optimization, structured schema data, and performance remediation",
      rate: 750,
      unit: "audit",
      hsnSac: "998315",
      defaultTaxRate: 0,
      isActive: true,
    },
  ];

  for (const spec of catalogItemSpecs) {
    const existing = await prisma.catalogItem.findFirst({
      where: { userId: user.id, name: spec.name },
    });
    if (existing) {
      await prisma.catalogItem.update({
        where: { id: existing.id },
        data: spec,
      });
    } else {
      await prisma.catalogItem.create({
        data: { ...spec, userId: user.id },
      });
    }
  }

  const catalogItemCount = await prisma.catalogItem.count({ where: { userId: user.id } });
  console.log(`Seeded ${catalogItemCount} catalog items for ${user.email}.`);
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  seed()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
