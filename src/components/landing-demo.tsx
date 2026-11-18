"use client";

import { useState } from "react";
import Link from "next/link";

type DemoView = "invoice" | "quotation" | "payments";

type IconProps = { className?: string };

function InvoiceIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h9l4 4v14l-2.5-1.6L14 21l-2.5-1.6L9 21l-3-1.5V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 3v4H19M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function QuoteIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5h14v11l-4 4H5V5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 20v-4h4M8.5 9h7M8.5 12.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaymentIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2.5 10h19M6.5 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const tabs = [
  { id: "invoice", label: "Invoice", icon: InvoiceIcon },
  { id: "quotation", label: "Quotation", icon: QuoteIcon },
  { id: "payments", label: "Payments", icon: PaymentIcon },
] as const;

const copy: Record<DemoView, {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
}> = {
  invoice: {
    eyebrow: "Invoice preview",
    title: "A polished document, ready to send",
    body: "Build an invoice once and every detail stays consistent — line items, tax, locale, branding, and the exact balance still due.",
    points: [
      "True A4 preview with print and PDF output",
      "Partial payments update the balance automatically",
      "QR and share options appear when payment details are set",
    ],
  },
  quotation: {
    eyebrow: "Quotation preview",
    title: "Turn a yes into an invoice in one click",
    body: "Send a clear quote with validity dates and statuses. When your client accepts it, convert it into an invoice without retyping a thing.",
    points: [
      "Professional quotation numbering and status tracking",
      "Expiry dates keep old proposals from lingering",
      "Accepted quotes convert straight into invoices",
    ],
  },
  payments: {
    eyebrow: "Payment tracking",
    title: "Always know who has paid — and who hasn't",
    body: "Record full or partial payments with references and notes. Balances, statuses, and dashboard totals recalculate the moment you save.",
    points: [
      "Partial payments with a running outstanding balance",
      "Duplicate references are caught before they are saved",
      "Stripe webhooks mark matching invoices as paid",
    ],
  },
};

function MiniQr() {
  return (
    <svg className="h-12 w-12 rounded-md bg-white p-1 shadow-sm" viewBox="0 0 64 64" aria-label="Demo QR code" role="img">
      <rect width="64" height="64" fill="#fff" />
      <g fill="#18181b">
        <path d="M6 6h18v18H6V6Zm3 3v12h12V9H9Zm31-3h18v18H40V6Zm3 3v12h12V9H43ZM6 40h18v18H6V40Zm3 3v12h12V43H9Z" />
        <path d="M43 10h4v4h-4zm8 0h3v3h-3zm-4 5h4v4h-4zm8 3h3v3h-3zM10 43h4v4h-4zm8 0h3v3h-3zm-4 5h4v4h-4zm8 3h3v3h-3zM43 40h4v4h-4zm8 0h3v3h-3zm-4 5h4v4h-4zm8 3h3v3h-3z" />
      </g>
    </svg>
  );
}

function InvoicePreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="absolute right-6 top-10 text-4xl font-black tracking-tighter text-zinc-900/[0.04] dark:text-white/[0.05]" aria-hidden="true">
        NORTHSTAR
      </div>
      <div className="relative border-b border-zinc-100 dark:border-zinc-800 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">N</div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Northstar Studio</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">San Francisco, CA</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-50 dark:bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Partially paid
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Invoice</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">INV-0005</p>
          </div>
          <div className="text-right text-[11px] text-zinc-500 dark:text-zinc-400">
            <p>Issued Nov 18, 2026</p>
            <p>Due Dec 18, 2026</p>
          </div>
        </div>
      </div>
      <div className="relative px-6 py-5">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between border-b border-dashed border-zinc-200 dark:border-zinc-700 pb-2">
            <span className="text-zinc-600 dark:text-zinc-400">Brand identity package</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">$1,800.00</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-zinc-200 dark:border-zinc-700 pb-2">
            <span className="text-zinc-600 dark:text-zinc-400">Landing page design</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">$1,200.00</span>
          </div>
          <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
            <span>Tax (8%)</span>
            <span>$146.50</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-900 dark:border-zinc-100 pt-3">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Balance due</span>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">$3,146.50</span>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Payment progress</span>
            <span>$1,000 paid</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full w-1/4 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
      <div className="relative flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/70 px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Pay by QR</p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">UPI deep link ready</p>
        </div>
        <MiniQr />
      </div>
    </div>
  );
}

function QuotationPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="absolute -right-8 top-12 text-4xl font-black tracking-tighter text-sky-500/[0.06]" aria-hidden="true">
        QUOTE
      </div>
      <div className="relative border-b border-zinc-100 dark:border-zinc-800 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Quotation</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">QUO-0012</p>
          </div>
          <span className="rounded-full bg-sky-50 dark:bg-sky-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">Sent</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          <p>Prepared for Globex Inc</p>
          <p>Valid until Dec 31, 2026</p>
        </div>
      </div>
      <div className="relative px-6 py-5">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between border-b border-dashed border-zinc-200 dark:border-zinc-700 pb-2">
            <span className="text-zinc-600 dark:text-zinc-400">Brand system audit</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">$2,400.00</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-zinc-200 dark:border-zinc-700 pb-2">
            <span className="text-zinc-600 dark:text-zinc-400">Design workshop</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">$1,500.00</span>
          </div>
          <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
            <span>Discount (10%)</span>
            <span>-$390.00</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-900 dark:border-zinc-100 pt-3">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Quote total</span>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">$3,510.00</span>
        </div>
        <p className="mt-4 rounded-lg bg-sky-50 dark:bg-sky-500/10 px-3 py-2 text-[11px] leading-5 text-sky-800 dark:text-sky-300">
          Once accepted, this quote becomes an invoice with the same line items and client details.
        </p>
      </div>
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/70 px-6 py-4">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Waiting for client response</span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-white dark:text-zinc-900">
          Convert to invoice <ArrowIcon className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function PaymentsPreview() {
  const metrics = [
    { label: "Outstanding", value: "$9,589.12", tone: "text-amber-700 dark:text-amber-300" },
    { label: "Received", value: "$4,250.00", tone: "text-emerald-700 dark:text-emerald-300" },
    { label: "Overdue", value: "$2,500.00", tone: "text-red-700 dark:text-red-300" },
  ];
  const rows = [
    { name: "Globex Inc", ref: "INV-0005 · UPI", amount: "+$1,000.00", state: "Partial" },
    { name: "Acme Corp", ref: "INV-0002 · STRIPE", amount: "+$2,500.00", state: "Paid" },
    { name: "Initech", ref: "INV-0003 · BANK", amount: "+$750.00", state: "Partial" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="grid grid-cols-3 gap-3 border-b border-zinc-100 dark:border-zinc-800 p-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/50 p-3">
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{metric.label}</p>
            <p className={`mt-1 text-sm font-bold tracking-tight ${metric.tone}`}>{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Recent payments</p>
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">Last 30 days</span>
        </div>
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.ref} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">{row.name}</p>
                  <p className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">{row.ref}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{row.amount}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{row.state}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/70 px-5 py-3">
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Balances recalculate after every change</span>
        <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">Live</span>
      </div>
    </div>
  );
}

export function LandingDemo({
  appHref,
  isLoggedIn,
}: {
  appHref: string;
  isLoggedIn: boolean;
}) {
  const [view, setView] = useState<DemoView>("invoice");
  const content = copy[view];

  return (
    <div className="mt-12">
      <div
        className="mx-auto flex w-fit flex-wrap justify-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-1.5"
        role="group"
        aria-label="Choose a demo view"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-demo-tab={tab.id}
              aria-pressed={active}
              aria-controls="landing-demo-panel"
              onClick={() => setView(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Icon />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id="landing-demo-panel"
        data-demo-view={view}
        aria-live="polite"
        className="mt-8 overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 shadow-[0_30px_80px_-40px_rgba(24,24,27,0.45)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="truncate text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            invoicely.app / {view}
          </span>
          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Demo data
          </span>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              {content.eyebrow}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {content.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {content.body}
            </p>
            <ul className="mt-6 space-y-3">
              {content.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={appHref}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 transition hover:bg-zinc-700 dark:hover:bg-zinc-300"
              >
                {isLoggedIn ? "Open dashboard" : "Create your account"}
                <ArrowIcon className="h-3.5 w-3.5" />
              </Link>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                No card needed to try it
              </span>
            </div>
          </div>

          <div>
            {view === "invoice" ? <InvoicePreview /> : null}
            {view === "quotation" ? <QuotationPreview /> : null}
            {view === "payments" ? <PaymentsPreview /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
