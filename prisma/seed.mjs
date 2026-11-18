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
      passwordHash,
    },
    create: {
      email: "test@example.com",
      name: "Test Freelancer",
      businessName: "Northstar Studio",
      businessAddress: "123 Market St\nSan Francisco, CA 94103",
      currency: "USD",
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
      status: "SENT",
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

    await prisma.invoice.upsert({
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

  const [clientCount, invoiceCount, quotationCount] = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    prisma.invoice.count({ where: { userId: user.id } }),
    prisma.quotation.count({ where: { userId: user.id } }),
  ]);

  console.log(
    `Seeded ${clientCount} clients, ${invoiceCount} invoices, and ${quotationCount} quotations for ${user.email}.`,
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
