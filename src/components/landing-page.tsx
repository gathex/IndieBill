import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingDemo } from "@/components/landing-demo";
import { HeroDotGrid } from "@/components/hero-dot-grid";
import { IndieBillLogo } from "@/components/IndieBillLogo";
import { LandingAnimator } from "@/components/LandingAnimator";
import { SpeedDialCardPreview } from "@/components/speed-dial-card-preview";
import { LandingQuickNav } from "@/components/landing-quick-nav";

type IconProps = { className?: string };

function ArrowIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentCheckIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 15 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UpiRazorpayIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2.5 10h19M6.5 15h3.5M14 15h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ShareChannelIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RecurringIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21.5 2-1.4 1.4A10 10 0 0 0 4.1 7.2L2 9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 7V2h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m2.5 22 1.4-1.4a10 10 0 0 0 16-3.8l2.1-2.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 17v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfitChartIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m19 9-5 5-4-4-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpeedDialIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const bentoFeatures = [
  {
    icon: DocumentCheckIcon,
    title: "30-Second GST Invoicing & Quotations",
    body: "Reusable Service Catalog, auto CGST/SGST/IGST split based on state, HSN/SAC codes, and 1-click Quotation-to-Invoice conversion.",
    tags: ["Service Catalog", "Auto GST Split", "HSN/SAC", "1-Click Convert"],
    tone: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: UpiRazorpayIcon,
    title: "Inbuilt UPI QR + Razorpay Links",
    body: "Clients scan a dynamic UPI QR (GPay, PhonePe, Paytm, BHIM) or pay via Razorpay (Cards, Netbanking, UPI) with automatic webhook status updates.",
    tags: ["Dynamic UPI QR", "Razorpay Links", "Live Webhooks", "Zero Hassle"],
    tone: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: SpeedDialIcon,
    title: "1-Tap Speed Dial & ⌘K",
    body: "Jump straight to a New Invoice, Quotation, Expense, or Client from anywhere in the app. Press ⌘K or tap the floating speed-dial for zero friction.",
    tags: ["Floating Speed-Dial", "⌘K / Ctrl+K", "Instant Actions", "Zero Friction"],
    tone: "bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400",
    hasPreview: true,
  },
  {
    icon: ShareChannelIcon,
    title: "WhatsApp & Multi-Channel Sharing",
    body: "One-click pre-filled WhatsApp messages, Mailtrap email delivery with attached A4 PDF, and a zero-config Mail App backup.",
    tags: ["1-Tap WhatsApp", "PDF Attachments", "Mailtrap API", "Mail App Fallback"],
    tone: "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  {
    icon: RecurringIcon,
    title: "Automated Retainers & Reminders",
    body: "Put client retainers on weekly or monthly autopilot and schedule polite before-due, on-due, and overdue email sequences (3, 7, 14 days) with 1-click pause.",
    tags: ["Client Retainers", "Auto-Generation", "Overdue Sequences", "Per-Invoice Mute"],
    tone: "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
  {
    icon: ProfitChartIcon,
    title: "Expense & Net Profit Clarity",
    body: "Track business expenses alongside revenue to see real net profit and 6-month cash flow trajectory at a glance without spreadsheets.",
    tags: ["Revenue vs Expense", "Net Profit Margin", "6-Month Cash Flow", "Categories"],
    tone: "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
];

const steps = [
  {
    number: "01",
    title: "Pick from Catalog",
    body: "Select pre-saved services with preset rates and HSN/SAC codes, or type custom line items. Auto-calculates totals, discounts, and CGST/SGST/IGST tax splits.",
  },
  {
    number: "02",
    title: "Share via WhatsApp / Email",
    body: "Send a pre-filled WhatsApp message, deliver the official PDF directly via email with Mailtrap, or share the live public payment link with your client.",
  },
  {
    number: "03",
    title: "Get Paid via UPI or Razorpay",
    body: "Clients scan your dynamic UPI QR code or pay securely with Cards/Netbanking via Razorpay. Recorded payments update ledger balances in real time.",
  },
];

const faqs = [
  {
    question: "Do I need a GSTIN to use IndieBill?",
    answer:
      "No! GST registration is completely optional. If you are an unregistered freelancer or consultant, keep GST disabled and IndieBill creates clean invoices with standard tax or zero tax. If you have a GSTIN, enable GST to automatically compute intra-state (CGST + SGST) or inter-state (IGST) splits and include HSN/SAC codes on your documents.",
  },
  {
    question: "How do clients pay using the inbuilt UPI QR and Razorpay?",
    answer:
      "Every invoice has a live public share page. Clients can scan the dynamic UPI QR code directly using Google Pay, PhonePe, Paytm, or BHIM. If you configure Razorpay, they can also click 'Pay Now' to settle invoices via Credit/Debit Cards, Netbanking, or UPI. Payment statuses update automatically via webhooks.",
  },
  {
    question: "Can I share invoices directly over WhatsApp?",
    answer:
      "Yes! Every invoice and quotation detail page has a 1-click WhatsApp share button. It opens a pre-filled, polite message containing the invoice number, balance due, and the public payment link ready to send to your client.",
  },
  {
    question: "Can I automate monthly client retainers?",
    answer:
      "Yes. Under the Recurring section, create a recurring schedule (weekly, monthly, quarterly, or yearly) for client retainers. IndieBill generates the next invoice on the target date, increments the invoice number, and can optionally auto-send it to your client.",
  },
  {
    question: "How do automated payment reminders work?",
    answer:
      "IndieBill can automatically send polite email reminders before the due date (e.g. 3 days prior), on the due date, and when overdue (e.g. 3, 7, and 14 days). You can pause reminders for individual invoices with one toggle, or send a reminder manually anytime.",
  },
  {
    question: "How does expense and net profit tracking work?",
    answer:
      "Log business expenses (software subscriptions, equipment, contractor payouts) with categories and dates. The Dashboard compares total payments received against expenses to give you your true net profit and 6-month cash flow trends at a glance.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition hover:border-zinc-300 dark:hover:border-zinc-600">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-zinc-900 dark:text-zinc-100 marker:hidden">
        {question}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition group-open:rotate-45">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </summary>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">{answer}</p>
    </details>
  );
}

function InvoiceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-indigo-200/50 dark:bg-indigo-900/30 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-emerald-200/60 dark:bg-emerald-900/30 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_30px_80px_-30px_rgba(24,24,27,0.35)]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[4.5rem] font-black tracking-tighter text-zinc-900/[0.03] dark:text-white/[0.03] pointer-events-none select-none" aria-hidden="true">
          KALA STUDIO
        </div>
        <div className="relative border-b border-zinc-100 dark:border-zinc-800 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                K
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kala Design Studio</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Mumbai, Maharashtra · GSTIN 27AAAAA0000A1Z5</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-50 dark:bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Partially paid
            </span>
          </div>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Tax Invoice</p>
              <p className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">INV-2026-0042</p>
            </div>
            <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
              <p>Billed to: Razorworks Labs (KA)</p>
              <p>Due Dec 05, 2026</p>
            </div>
          </div>
        </div>

        <div className="relative px-6 py-4">
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-2.5">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Brand Identity & Design System</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">SAC: 998314 · 1 unit</p>
              </div>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">₹45,000.00</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-2.5">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Web Application UI Development</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">SAC: 998313 · 1 unit</p>
              </div>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">₹35,000.00</span>
            </div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400 pt-1">
              <span>Subtotal</span>
              <span>₹80,000.00</span>
            </div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>IGST (18% Inter-state MH → KA)</span>
              <span>₹14,400.00</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Advance Received via UPI</span>
              <span>-₹40,000.00</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-zinc-900 dark:border-zinc-100 pt-3">
            <div>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">Balance Due</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Total ₹94,400</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">₹54,400.00</span>
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 px-6 py-4 dark:bg-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">UPI QR & Razorpay</p>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Instant</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Scan with GPay, PhonePe, Paytm, BHIM</p>
            <p className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300 mt-0.5">kala@okaxis</p>
          </div>
          <svg className="h-12 w-12 shrink-0 rounded-md bg-white dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-700" viewBox="0 0 64 64" aria-label="UPI QR code preview" role="img">
            <rect width="64" height="64" fill="currentColor" className="text-white dark:text-zinc-900" />
            <g fill="currentColor" className="text-zinc-900 dark:text-zinc-100">
              <path d="M6 6h18v18H6V6Zm3 3v12h12V9H9Zm31-3h18v18H40V6Zm3 3v12h12V9H43ZM6 40h18v18H6V40Zm3 3v12h12V43H9Z" />
              <path d="M43 10h4v4h-4zm8 0h3v3h-3zm-4 5h4v4h-4zm8 3h3v3h-3zM10 43h4v4h-4zm8 0h3v3h-3zm-4 5h4v4h-4zm8 3h3v3h-3zM43 40h4v4h-4zm8 0h3v3h-3zm-4 5h4v4h-4zm8 3h3v3h-3z" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const appHref = isLoggedIn ? "/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <LandingAnimator />
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="IndieBill home">
            <IndieBillLogo size={32} />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex" aria-label="Main navigation">
            <Link href="#features" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">Features</Link>
            <Link href="#how-it-works" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">How it works</Link>
            <Link href="#demo" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">Demo</Link>
            <Link href="#faq" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {!isLoggedIn && (
              <Link href="/login" className="hidden rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition hover:text-zinc-900 dark:hover:text-zinc-50 sm:block">
                Sign in
              </Link>
            )}
            <Link
              href={appHref}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {isLoggedIn ? "Go to dashboard" : "Start Free"}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1. Hero Section */}
        <section className="relative isolate overflow-hidden border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="absolute inset-0 z-0 w-full h-full pointer-events-auto">
            <HeroDotGrid />
          </div>

          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div>
              <span data-gsap="hero-item" className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Built for Indian Freelancers & Studios
              </span>
              <h1 data-gsap="hero-item" className="mt-5 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl lg:text-6xl">
                Invoicing built for{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-500 bg-clip-text text-transparent">
                  independent work.
                </span>
              </h1>
              <p data-gsap="hero-item" className="mt-5 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                Create GST invoices, collect via UPI & Razorpay, and get paid on time. Everything you need—from quotations and service catalogs to automated reminders and net profit tracking—in one fast, calm workspace.
              </p>
              <div data-gsap="hero-item" className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={appHref}
                  className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {isLoggedIn ? "Go to dashboard" : "Start Free"}
                  <ArrowIcon />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  See Features
                </Link>
              </div>
              <div data-gsap="hero-item" className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-emerald-500 shrink-0" /> GST Ready (CGST/SGST/IGST)
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-emerald-500 shrink-0" /> Inbuilt UPI QR & Razorpay
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-emerald-500 shrink-0" /> Zero Setup Hassle
                </span>
              </div>
            </div>
            <div data-gsap="hero-item"><InvoiceMockup /></div>
          </div>
        </section>

        {/* Stats / Pricing Value Strip (#pricing) */}
        <section id="pricing" className="scroll-mt-20 border-y border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "100% Free in Beta", label: "Zero platform fees, keep 100% of your earnings" },
              { value: "GST Ready", label: "Auto CGST/SGST and IGST calculation with HSN/SAC codes" },
              { value: "Instant UPI QR", label: "Dynamic UPI QR codes built directly into public share links" },
              { value: "Razorpay Integrated", label: "Direct settlement with Cards, Netbanking, & live webhooks" },
            ].map((item) => (
              <div key={item.value} data-gsap="stats-item">
                <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{item.value}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Interactive / Visual Feature Bento Grid (#features) */}
        <section id="features" className="scroll-mt-20 bg-zinc-50 dark:bg-zinc-950 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Everything in one place</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                The tools you need to run your independent business.
              </h2>
              <p className="mt-4 text-base sm:text-lg leading-7 text-zinc-600 dark:text-zinc-400">
                From your first quote to recurring retainers and net profit clarity, IndieBill eliminates billing friction so you can focus on great work.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bentoFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    data-gsap="feature-card"
                    key={feature.title}
                    className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50"
                  >
                    <div>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.tone}`}>
                        <Icon />
                      </div>
                      <h3 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
                      <p className="mt-2.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{feature.body}</p>
                      {feature.hasPreview && <SpeedDialCardPreview />}
                    </div>
                    <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap gap-1.5">
                      {feature.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Simple "How It Works" 3-Step Strip (#how-it-works) */}
        <section id="how-it-works" className="scroll-mt-20 bg-white dark:bg-zinc-900 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">Three steps from service to payment.</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div data-gsap="step-card" key={step.number} className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 transition-transform duration-200 hover:-translate-y-0.5">
                  <span className="text-4xl font-bold tracking-tight text-zinc-200 dark:text-zinc-700">{step.number}</span>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Demo Section (#demo) */}
        <section id="demo" className="scroll-mt-20 border-y border-zinc-100 dark:border-zinc-800 bg-white py-20 sm:py-24 dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-6">
            <div data-gsap="demo-section" className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Interactive demo</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                Take IndieBill for a spin.
              </h2>
              <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400">
                Switch between an invoice, a quotation, and your payments dashboard to see how the whole flow fits together. No account needed to explore.
              </p>
            </div>
            <LandingDemo appHref={appHref} isLoggedIn={isLoggedIn} />
          </div>
        </section>

        {/* FAQ Section (#faq) */}
        <section id="faq" className="scroll-mt-20 bg-zinc-50 dark:bg-zinc-950 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Good to know</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">Frequently asked questions</h2>
            </div>
            <div className="mt-10 space-y-3">
              {faqs.map((faq) => (
                <div data-gsap="faq-item" key={faq.question}>
                  <FaqItem question={faq.question} answer={faq.answer} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Clean Final CTA */}
        <section className="px-6 py-20 sm:py-24 bg-white dark:bg-zinc-900">
          <div data-gsap="cta-section" className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-zinc-950 px-6 py-16 text-center text-white sm:px-12 sm:py-20 shadow-2xl">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Stop chasing invoices. Start getting paid faster.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-indigo-100">
              Create professional GST invoices, share via WhatsApp, and collect payments effortlessly.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href={appHref}
                className="inline-flex items-center gap-2 rounded-md bg-white px-7 py-3.5 text-sm font-semibold text-zinc-900 shadow-md transition hover:bg-zinc-100"
              >
                {isLoggedIn ? "Go to dashboard" : "Start Free"}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 4. Minimal Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="IndieBill home">
              <IndieBillLogo size={28} />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Invoicing, quotations, and payments built for Indian freelancers and studios.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-zinc-600 dark:text-zinc-400" aria-label="Footer navigation">
            <Link href="#features" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">Features</Link>
            <Link href="#how-it-works" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">How it works</Link>
            <Link href="#demo" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">Demo</Link>
            <Link href="#faq" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">FAQ</Link>
            {!isLoggedIn && (
              <Link href="/login" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">Login</Link>
            )}
            {!isLoggedIn && (
              <Link href="/register" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">Sign Up</Link>
            )}
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-zinc-400 dark:text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} IndieBill. Built for independent creators & studios.</span>
            <span className="text-zinc-400 dark:text-zinc-500">GST Ready · Inbuilt UPI QR · Razorpay</span>
          </div>
        </div>
      </footer>
      <LandingQuickNav appHref={appHref} isLoggedIn={isLoggedIn} />
    </div>
  );
}
