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

  const expenseSpecs = [
    {
      title: "Figma Professional Annual Plan",
      category: "Software",
      amount: 144,
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      vendor: "Figma, Inc.",
      paymentMethod: "Card",
      taxAmount: 12,
      notes: "Design team collaboration and design system tokens sync",
    },
    {
      title: "Vercel Pro Team & Custom Domain",
      category: "Software",
      amount: 40,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      vendor: "Vercel Inc.",
      paymentMethod: "Card",
      taxAmount: 3.5,
      notes: "Production hosting and serverless Edge deployments",
    },
    {
      title: "WeWork Hot Desk & Meeting Space",
      category: "Office",
      amount: 250,
      date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      vendor: "WeWork",
      paymentMethod: "Bank Transfer",
      taxAmount: 20,
      notes: "Monthly hot desk access and client consultation rooms",
    },
    {
      title: "Ergonomic 4K Display & Desk Setup",
      category: "Hardware",
      amount: 420,
      date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      vendor: "Dell Tech / Amazon",
      paymentMethod: "Card",
      taxAmount: 35,
      notes: "32-inch 4K USB-C monitor with color calibration for design work",
    },
    {
      title: "Google Workspace & Cloud Storage",
      category: "Software",
      amount: 36,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      vendor: "Google LLC",
      paymentMethod: "Card",
      taxAmount: 2.88,
      notes: "Custom business email, Google Meet, and 2TB Drive",
    },
    {
      title: "Contract Code Review & Frontend QA",
      category: "Subcontractor",
      amount: 450,
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      vendor: "Alex Chen",
      paymentMethod: "Bank Transfer",
      taxAmount: 0,
      notes: "Independent contractor assisting on React 19 test migration",
    },
  ];

  for (const spec of expenseSpecs) {
    const existing = await prisma.expense.findFirst({
      where: { userId: user.id, title: spec.title },
    });
    if (existing) {
      await prisma.expense.update({
        where: { id: existing.id },
        data: spec,
      });
    } else {
      await prisma.expense.create({
        data: { ...spec, userId: user.id },
      });
    }
  }

  // Ensure Acme and Globex clients exist for recurring invoice links
  const acmeClient = await prisma.client.upsert({
    where: { id: "seed-client-acme" },
    update: {
      userId: user.id,
      name: "Acme Corp",
      email: "billing@acme.example",
      company: "Acme Corp",
    },
    create: {
      id: "seed-client-acme",
      userId: user.id,
      name: "Acme Corp",
      email: "billing@acme.example",
      company: "Acme Corp",
    },
  });

  const globexClient = await prisma.client.upsert({
    where: { id: "seed-client-globex" },
    update: {
      userId: user.id,
      name: "Globex Inc",
      email: "accounts@globex.example",
      company: "Globex Inc",
    },
    create: {
      id: "seed-client-globex",
      userId: user.id,
      name: "Globex Inc",
      email: "accounts@globex.example",
      company: "Globex Inc",
    },
  });

  const now = new Date();
  const dateFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const recurringSpecs = [
    {
      title: "Monthly Website Maintenance & Retainer",
      clientId: acmeClient.id,
      frequency: "MONTHLY",
      dueInDays: 14,
      autoSendEmail: true,
      status: "ACTIVE",
      currency: "USD",
      notes: "Monthly retainer covers routine maintenance, security patches, backups, and up to 4h of on-call support.",
      discount: 5,
      taxRate: 8.5,
      gstEnabled: false,
      startDate: dateFromNow(-30),
      nextRunDate: dateFromNow(0),
      items: [
        {
          description: "Monthly Retainer: Security Updates, Backups & Content Maintenance",
          quantity: 1,
          rate: 1200,
          unit: "month",
        },
        {
          description: "On-call Support (4 hours allocated)",
          quantity: 4,
          rate: 125,
          unit: "hr",
        },
      ],
    },
    {
      title: "Quarterly Cloud Infrastructure Audit",
      clientId: globexClient.id,
      frequency: "QUARTERLY",
      dueInDays: 30,
      autoSendEmail: false,
      status: "ACTIVE",
      currency: "USD",
      notes: "Quarterly compliance, architecture review, and cost optimization report.",
      discount: 0,
      taxRate: 18,
      gstEnabled: true,
      startDate: dateFromNow(-90),
      nextRunDate: dateFromNow(1),
      items: [
        {
          description: "Quarterly Cloud Security & Architecture Audit",
          quantity: 1,
          rate: 3500,
          unit: "audit",
          hsnSac: "998313",
        },
        {
          description: "Performance & Cost Optimization Report",
          quantity: 1,
          rate: 1500,
          unit: "report",
          hsnSac: "998314",
        },
      ],
    },
  ];

  for (const spec of recurringSpecs) {
    const { items, ...recurringData } = spec;
    const existing = await prisma.recurringInvoice.findFirst({
      where: { userId: user.id, title: spec.title },
    });

    if (existing) {
      await prisma.recurringInvoice.update({
        where: { id: existing.id },
        data: {
          ...recurringData,
          items: {
            deleteMany: {},
            create: items,
          },
        },
      });
    } else {
      await prisma.recurringInvoice.create({
        data: {
          ...recurringData,
          userId: user.id,
          items: {
            create: items,
          },
        },
      });
    }
  }

  const [catalogItemCount, expenseCount, recurringCount] = await Promise.all([
    prisma.catalogItem.count({ where: { userId: user.id } }),
    prisma.expense.count({ where: { userId: user.id } }),
    prisma.recurringInvoice.count({ where: { userId: user.id } }),
  ]);
  console.log(`Seeded ${catalogItemCount} catalog items, ${expenseCount} expenses, and ${recurringCount} recurring invoices for ${user.email}.`);
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
