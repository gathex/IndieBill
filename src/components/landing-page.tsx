import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingDemo } from "@/components/landing-demo";
import { HeroDotGrid } from "@/components/hero-dot-grid";
import { IndieBillLogo } from "@/components/IndieBillLogo";

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

function InvoiceIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h9l4 4v14l-2.5-1.6L14 21l-2.5-1.6L9 21l-3-1.5V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 3v4H19M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function QuoteIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5h14v11l-4 4H5V5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 20v-4h4M8.5 9h7M8.5 12.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaymentIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2.5 10h19M6.5 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function QrIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 14h2.5v2.5H14V14Zm5 0h1v1h-1v-1Zm-5 5h2v1h-2v-1Zm5 0h1v1h-1v-1Z" fill="currentColor" />
    </svg>
  );
}

function BrandIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m4 7 8 4 8-4M12 11v10" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 12h17M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ShareIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const features = [
  {
    icon: InvoiceIcon,
    title: "Invoices that look the part",
    body: "Build polished invoices with line items, discounts, tax, and due dates. Preview a true A4 sheet, print it, or download a ready-to-send PDF.",
    tone: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: QuoteIcon,
    title: "Quotes that turn into work",
    body: "Send professional quotations with validity dates and statuses. When a client says yes, convert an accepted quote into an invoice in one click.",
    tone: "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  {
    icon: PaymentIcon,
    title: "Track every rupee, dollar, or euro",
    body: "Record full or partial payments, keep references and notes, and see the outstanding balance update instantly. No spreadsheet required.",
    tone: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: QrIcon,
    title: "More ways to get paid",
    body: "Add a Stripe payment link, or let clients scan a UPI QR built from your VPA, UPI ID, and account details. It works even without Stripe.",
    tone: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    icon: BrandIcon,
    title: "Your brand on every page",
    body: "Upload your logo once. It appears in the document header and as a subtle watermark on invoices and quotations, in both previews and PDFs.",
    tone: "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
  {
    icon: GlobeIcon,
    title: "Made for your market",
    body: "Choose from every ISO country, currency, and language. Dates, numbers, and money are formatted to match the locale you work in.",
    tone: "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    icon: ShareIcon,
    title: "Share in one tap",
    body: "Copy a shareable invoice link, use the native share sheet, or jump straight to email and WhatsApp. Clients get the document, not a login wall.",
    tone: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  },
  {
    icon: MailIcon,
    title: "Email with the PDF attached",
    body: "Send an invoice or quotation straight from the app with its PDF attached, and keep a clear record of what went out.",
    tone: "bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400",
  },
];

const steps = [
  {
    number: "01",
    title: "Set up your business once",
    body: "Add your business details, logo, currency, and payment information. IndieBill remembers them for every document you create.",
  },
  {
    number: "02",
    title: "Create an invoice or quote",
    body: "Pick a client, add line items, and let the totals, tax, and due dates calculate themselves. Preview the finished A4 document before sending.",
  },
  {
    number: "03",
    title: "Send it and track payment",
    body: "Share the link, email the PDF, or show a QR code. Record payments as they arrive and always know who still owes you.",
  },
];

const faqs = [
  {
    question: "Do I need Stripe or any other account to start?",
    answer:
      "No. The core app works on its own with local accounts, invoices, quotations, PDFs, and payment tracking. Stripe payment links and QR payments are optional add-ons you can switch on later.",
  },
  {
    question: "Can I use my own currency and language?",
    answer:
      "Yes. Choose any ISO country, currency, and language in Settings. Currency, dates, and numbers across the app, previews, PDFs, and emails follow your selection.",
  },
  {
    question: "Will my documents look like my business?",
    answer:
      "They will. Upload a PNG or JPG logo and it appears in the header and as a faded centered watermark on both invoices and quotations, including downloaded PDFs.",
  },
  {
    question: "Can clients pay by UPI?",
    answer:
      "Add a VPA or UPI ID in Settings and invoices without a Stripe link show a scannable upi://pay QR with the amount, payee, and invoice reference. You can also add an account number for the text fallback.",
  },
  {
    question: "Can I email invoices with the PDF attached?",
    answer:
      "Yes. Connect Resend and send invoices or quotations directly from the app with the generated PDF attached. Without an API key, the rest of the app continues to work normally.",
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
      <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-indigo-200/50 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-emerald-200/60 blur-3xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_30px_80px_-30px_rgba(24,24,27,0.35)]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[5rem] font-black tracking-tighter text-zinc-900/[0.035]" aria-hidden="true">
          NORTHSTAR
        </div>
        <div className="relative border-b border-zinc-100 dark:border-zinc-800 px-7 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">N</div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Northstar Studio</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">San Francisco, CA</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Partially paid
            </span>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Invoice</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">INV-0005</p>
            </div>
            <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
              <p>Issued Nov 18, 2026</p>
              <p>Due Dec 18, 2026</p>
            </div>
          </div>
        </div>

        <div className="relative px-7 py-5">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-3">
              <span className="text-zinc-600 dark:text-zinc-400">Brand identity package</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">$1,800.00</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-3">
              <span className="text-zinc-600 dark:text-zinc-400">Landing page design</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">$1,200.00</span>
            </div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Tax (8%)</span>
              <span>$146.50</span>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-zinc-900 dark:border-zinc-100 pt-4">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Balance due</span>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">$3,146.50</span>
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 px-7 py-5 dark:bg-zinc-800/70">
          <div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Pay by QR</p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Scan to pay with UPI</p>
          </div>
          <svg className="h-14 w-14 rounded-md bg-white dark:bg-zinc-900 p-1" viewBox="0 0 64 64" aria-label="QR code preview" role="img">
            <rect width="64" height="64" fill="#fff" />
            <g fill="#18181b">
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
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="IndieBill home">
            <IndieBillLogo size={32} />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex" aria-label="Main navigation">
            <Link href="#features" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">Features</Link>
            <Link href="#how-it-works" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">How it works</Link>
            <Link href="#demo" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">Demo</Link>
            <Link href="#payments" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">Payments</Link>
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
              {isLoggedIn ? "Go to dashboard" : "Get started"}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="absolute inset-0 z-0 w-full h-full">
            <HeroDotGrid />
          </div>

          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Built for freelancers and small studios
              </span>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl lg:text-6xl">
                Invoicing that helps you{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">get paid faster.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                Create beautiful invoices and quotations, share them anywhere, and track every payment in one calm workspace. IndieBill handles the paperwork so you can get back to the work you love.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={appHref}
                  className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {isLoggedIn ? "Open dashboard" : "Start invoicing"}
                  <ArrowIcon />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  See how it works
                </Link>
              </div>
              <Link href="#demo" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 transition hover:text-indigo-700 dark:hover:text-indigo-300">
                Explore the interactive demo
                <ArrowIcon className="h-3.5 w-3.5" />
              </Link>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-emerald-500" /> No credit card needed</span>
                <span className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-emerald-500" /> Ready in minutes</span>
                <span className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-emerald-500" /> Your branding throughout</span>
              </div>
            </div>
            <InvoiceMockup />
          </div>
        </section>

        <section className="border-y border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "A4 ready", label: "Print-perfect invoices and quotations" },
              { value: "Every currency", label: "ISO countries, currencies, and languages" },
              { value: "UPI + Stripe", label: "QR codes and online payment links" },
              { value: "Real balances", label: "Partial payments tracked automatically" },
            ].map((item) => (
              <div key={item.value}>
                <p className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{item.value}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-20 bg-zinc-50 dark:bg-zinc-950 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Everything in one place</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                The tools you need to run your billing, minus the busywork.
              </h2>
              <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                From the first quote to the final payment, IndieBill keeps your documents consistent, your clients informed, and your numbers clear.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 transition hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-black/40">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.tone}`}>
                      <Icon />
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{feature.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 bg-white dark:bg-zinc-900 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">Three steps from idea to income.</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7">
                  <span className="text-4xl font-bold tracking-tight text-zinc-100 dark:text-zinc-300">{step.number}</span>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="scroll-mt-20 border-y border-zinc-100 dark:border-zinc-800 bg-white py-20 sm:py-24 dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Interactive demo</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                Take IndieBill for a spin.
              </h2>
              <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400">
                Switch between an invoice, a quotation, and your payments dashboard to see how the whole flow fits together. No account needed to look around.
              </p>
            </div>
            <LandingDemo appHref={appHref} isLoggedIn={isLoggedIn} />
          </div>
        </section>

        <section id="payments" className="scroll-mt-20 bg-zinc-950 py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Getting paid</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Give clients every easy way to pay you.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-zinc-300">
                Add a Stripe payment link for card payments, or let clients scan a QR code built from your UPI ID, VPA, and account number. Every invoice shows the exact amount due and the details they need.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "UPI deep links when a VPA or UPI ID is set",
                  "Readable payment details as a fallback",
                  "Partial payments with running balances",
                  "Automatic status updates from Stripe webhooks",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-200">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={appHref}
                className="mt-9 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
              >
                {isLoggedIn ? "Open dashboard" : "Try it yourself"}
                <ArrowIcon />
              </Link>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Outstanding</p>
                  <p className="mt-2 text-3xl font-semibold">$9,589.12</p>
                </div>
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">3 open invoices</span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { name: "INV-0005 · Globex Inc", value: "$3,146.50", state: "Sent" },
                  { name: "INV-0004 · Acme Corp", value: "$2,500.00", state: "Overdue" },
                  { name: "INV-0003 · Initech", value: "$1,942.62", state: "Partial" },
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between gap-4 rounded-xl bg-zinc-800/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{row.name}</p>
                      <p className="text-xs text-zinc-400">{row.state}</p>
                    </div>
                    <span className="text-sm font-semibold text-zinc-100">{row.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">Numbers update as soon as a payment is recorded.</p>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-white dark:bg-zinc-900 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Good to know</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">Questions, answered.</h2>
            </div>
            <div className="mt-10 space-y-3">
              {faqs.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 sm:pb-24">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-zinc-900 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Look professional. Get paid on time. Keep your focus on the work.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-indigo-100">
              Set up your business profile, create your first document, and send it with a link, a PDF, or a QR code.
            </p>
            <Link
              href={appHref}
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              {isLoggedIn ? "Open dashboard" : "Create your account"}
              <ArrowIcon />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="IndieBill home">
              <IndieBillLogo size={28} />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Invoices, quotations, and payments in one simple workspace for independent professionals.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-600 dark:text-zinc-400" aria-label="Footer navigation">
            <Link href="#features" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">Features</Link>
            <Link href="#how-it-works" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">How it works</Link>
            <Link href="#demo" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">Demo</Link>
            <Link href="#faq" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">FAQ</Link>
            {!isLoggedIn && (
              <Link href="/login" className="transition hover:text-zinc-900 dark:hover:text-zinc-50">Sign in</Link>
            )}
            <Link href={appHref} className="transition hover:text-zinc-900 dark:hover:text-zinc-50">
              {isLoggedIn ? "Dashboard" : "Get started"}
            </Link>
          </nav>
        </div>
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-zinc-400 dark:text-zinc-500">
            © {new Date().getFullYear()} IndieBill. Built for the work you do.
          </div>
        </div>
      </footer>
    </div>
  );
}
