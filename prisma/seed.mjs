import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const round2 = (value) => Math.round(value * 100) / 100;

function calculateTotals(items, discountPercent, taxRate) {
  const subtotal = round2(items.reduce((sum, item) => sum + item.quantity * item.rate, 0));
  const discount = round2(subtotal * (discountPercent / 100));
  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * (taxRate / 100));
  return { subtotal, discount, tax, total: round2(taxable + tax) };
}

function dateFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date;
}

async function main() {
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

  const clientSpecs = [
    {
      key: "acme",
      name: "Acme Corp",
      email: "billing@acme.example",
      company: "Acme Corp",
      phone: "+1 415 555 0101",
      notes: "Net 14 preferred. Send invoices to the billing team.",
    },
    {
      key: "globex",
      name: "Globex Inc",
      email: "accounts@globex.example",
      company: "Globex Inc",
      phone: "+1 212 555 0142",
      notes: "Requires PO number on all invoices.",
    },
    {
      key: "initech",
      name: "Initech",
      email: "finance@initech.example",
      company: "Initech LLC",
      phone: "+1 512 555 0199",
      notes: null,
    },
  ];

  const clients = {};
  for (const spec of clientSpecs) {
    const { key, ...clientData } = spec;
    const existing = await prisma.client.findFirst({
      where: { userId: user.id, email: spec.email },
    });
    const client = existing
      ? await prisma.client.update({
          where: { id: existing.id },
          data: clientData,
        })
      : await prisma.client.create({
          data: { ...clientData, userId: user.id },
        });
    clients[key] = client;
  }

  const invoiceSpecs = [
    {
      id: "seed-invoice-0001",
      number: "INV-0001",
      clientKey: "acme",
      status: "PAID",
      issueDays: -45,
      dueDays: -15,
      discountPercent: 0,
      taxRate: 8.5,
      notes: "Thanks for the quick payment!",
      items: [
        { description: "Landing page design", quantity: 1, rate: 1800 },
        { description: "Brand style guide", quantity: 1, rate: 600 },
      ],
    },
    {
      id: "seed-invoice-0002",
      number: "INV-0002",
      clientKey: "globex",
      status: "PARTIAL",
      issueDays: -10,
      dueDays: 20,
      discountPercent: 5,
      taxRate: 8.5,
      notes: "Please include the PO number with your payment.",
      items: [
        { description: "Web application UI/UX design", quantity: 1, rate: 4200 },
        { description: "Design system handoff", quantity: 1, rate: 900 },
      ],
    },
    {
      id: "seed-invoice-0003",
      number: "INV-0003",
      clientKey: "initech",
      status: "SENT",
      issueDays: -30,
      dueDays: -2,
      discountPercent: 0,
      taxRate: 0,
      notes: "Payment is now overdue. Please remit at your earliest convenience.",
      items: [
        { description: "Monthly retainer — September", quantity: 1, rate: 2500 },
      ],
    },
    {
      id: "seed-invoice-0004",
      number: "INV-0004",
      clientKey: "acme",
      status: "DRAFT",
      issueDays: -2,
      dueDays: 28,
      discountPercent: 10,
      taxRate: 8.5,
      notes: "Draft awaiting final scope approval.",
      items: [
        { description: "Marketing site copywriting", quantity: 1, rate: 1200 },
        { description: "SEO keyword research", quantity: 1, rate: 450 },
      ],
    },
    {
      id: "seed-invoice-0005",
      number: "INV-0005",
      clientKey: "globex",
      status: "SENT",
      issueDays: 0,
      dueDays: 30,
      discountPercent: 0,
      taxRate: 8.5,
      notes: "Thank you for your business.",
      items: [
        { description: "Discovery workshop", quantity: 2, rate: 750 },
        { description: "Technical roadmap", quantity: 1, rate: 1400 },
      ],
    },
  ];

  const invoices = {};

  for (const spec of invoiceSpecs) {
    const itemData = spec.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: round2(item.quantity * item.rate),
    }));
    const totals = calculateTotals(spec.items, spec.discountPercent, spec.taxRate);

    const data = {
      clientId: clients[spec.clientKey].id,
      number: spec.number,
      status: spec.status,
      issueDate: dateFromNow(spec.issueDays),
      dueDate: dateFromNow(spec.dueDays),
      subtotal: totals.subtotal,
      discountPercent: spec.discountPercent,
      taxRate: spec.taxRate,
      tax: totals.tax,
      total: totals.total,
      notes: spec.notes,
    };

    invoices[spec.number] = await prisma.invoice.upsert({
      where: { id: spec.id },
      update: {
        ...data,
        items: { deleteMany: {}, create: itemData },
      },
      create: {
        id: spec.id,
        userId: user.id,
        ...data,
        items: { create: itemData },
      },
    });
  }

  const paymentSpecs = [
    {
      id: "seed-payment-0001",
      invoiceNumber: "INV-0001",
      ratio: 1,
      method: "BANK_TRANSFER",
      reference: "WIRE-1042",
      notes: "Final payment received in full.",
      daysAgo: 16,
    },
    {
      id: "seed-payment-0002",
      invoiceNumber: "INV-0002",
      ratio: 0.25,
      method: "BANK_TRANSFER",
      reference: "DEPOSIT-2002",
      notes: "Initial deposit received.",
      daysAgo: 6,
    },
  ];

  for (const spec of paymentSpecs) {
    const invoice = invoices[spec.invoiceNumber];
    const data = {
      userId: user.id,
      invoiceId: invoice.id,
      amount: round2(invoice.total * spec.ratio),
      paymentDate: dateFromNow(-spec.daysAgo),
      method: spec.method,
      reference: spec.reference,
      notes: spec.notes,
    };

    await prisma.payment.upsert({
      where: {
        invoiceId_reference: {
          invoiceId: invoice.id,
          reference: spec.reference,
        },
      },
      update: data,
      create: { id: spec.id, ...data },
    });
  }

  const quotationSpecs = [
    {
      id: "seed-quotation-0001",
      number: "QUO-0001",
      clientKey: "acme",
      status: "SENT",
      issueDays: -20,
      validDays: 10,
      discountPercent: 0,
      taxRate: 8.5,
      notes: "Valid for 30 days. Includes two rounds of revisions.",
      items: [
        { description: "Mobile app UI design", quantity: 1, rate: 3200 },
        { description: "Prototype and handoff", quantity: 1, rate: 800 },
      ],
    },
    {
      id: "seed-quotation-0002",
      number: "QUO-0002",
      clientKey: "globex",
      status: "DRAFT",
      issueDays: -3,
      validDays: 27,
      discountPercent: 5,
      taxRate: 8.5,
      notes: "Draft scope awaiting internal review.",
      items: [
        { description: "Dashboard analytics UI", quantity: 1, rate: 2400 },
      ],
    },
    {
      id: "seed-quotation-0003",
      number: "QUO-0003",
      clientKey: "initech",
      status: "SENT",
      issueDays: -40,
      validDays: -5,
      discountPercent: 0,
      taxRate: 0,
      notes: "This quote has expired. Ask whether they would like a refreshed version.",
      items: [
        { description: "Brand refresh consultation", quantity: 3, rate: 500 },
      ],
    },
    {
      id: "seed-quotation-0004",
      number: "QUO-0004",
      clientKey: "acme",
      status: "ACCEPTED",
      issueDays: -12,
      validDays: 18,
      discountPercent: 10,
      taxRate: 8.5,
      notes: "Approved by the marketing team. Ready to convert to an invoice.",
      items: [
        { description: "Campaign landing page", quantity: 1, rate: 1500 },
        { description: "Email template set", quantity: 2, rate: 350 },
      ],
    },
  ];

  for (const spec of quotationSpecs) {
    const itemData = spec.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: round2(item.quantity * item.rate),
    }));
    const totals = calculateTotals(spec.items, spec.discountPercent, spec.taxRate);
    const data = {
      clientId: clients[spec.clientKey].id,
      number: spec.number,
      status: spec.status,
      issueDate: dateFromNow(spec.issueDays),
      validUntil: dateFromNow(spec.validDays),
      subtotal: totals.subtotal,
      discountPercent: spec.discountPercent,
      taxRate: spec.taxRate,
      tax: totals.tax,
      total: totals.total,
      notes: spec.notes,
    };

    await prisma.quotation.upsert({
      where: { id: spec.id },
      update: {
        ...data,
        items: { deleteMany: {}, create: itemData },
      },
      create: {
        id: spec.id,
        userId: user.id,
        ...data,
        items: { create: itemData },
      },
    });
  }

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

  const recurringSpecs = [
    {
      title: "Monthly Website Maintenance & Retainer",
      clientKey: "acme",
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
      clientKey: "globex",
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
    const { items, clientKey, ...recurringData } = spec;
    const clientId = clients[clientKey].id;
    const existing = await prisma.recurringInvoice.findFirst({
      where: { userId: user.id, title: spec.title },
    });

    if (existing) {
      await prisma.recurringInvoice.update({
        where: { id: existing.id },
        data: {
          ...recurringData,
          clientId,
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
          clientId,
          items: {
            create: items,
          },
        },
      });
    }
  }

  const [clientCount, invoiceCount, quotationCount, paymentCount, catalogItemCount, expenseCount, recurringCount] = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    prisma.invoice.count({ where: { userId: user.id } }),
    prisma.quotation.count({ where: { userId: user.id } }),
    prisma.payment.count({ where: { userId: user.id } }),
    prisma.catalogItem.count({ where: { userId: user.id } }),
    prisma.expense.count({ where: { userId: user.id } }),
    prisma.recurringInvoice.count({ where: { userId: user.id } }),
  ]);

  console.log(
    `Seeded ${clientCount} clients, ${invoiceCount} invoices, ${quotationCount} quotations, ${paymentCount} payments, ${catalogItemCount} catalog items, ${expenseCount} expenses, and ${recurringCount} recurring invoices for ${user.email}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
