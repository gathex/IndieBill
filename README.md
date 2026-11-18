# Invoicely

A focused invoice app for freelancers. Each account has one business profile, clients, invoices, PDF delivery, online payment links, and simple income reporting.

## Features

- Email/password authentication (plus optional Google OAuth)
- Client create, view, edit, search, and delete
- Invoice create, edit, duplicate-free numbering, search, status filters, and delete
- Quotation create, edit, duplicate-free numbering, search, status filters, and delete
- Quote statuses: draft, sent, accepted, rejected, expired (from validity date), converted
- One-click conversion of an accepted quotation into a draft invoice
- Line items, discounts, tax, automatic totals, due dates, and overdue detection
- Downloadable PDF invoices and quotations
- Full A4 HTML previews with print / Save as PDF support
- Payment management: partial payments, methods, references, balances, and delete/recalculate
- Email invoices and quotations with the PDF attached (via Resend)
- Stripe payment links and webhook-based payment recording and status updates
- Business name, address, and currency settings
- Dashboard with outstanding, received, overdue, and draft metrics

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4
- Prisma 6 with SQLite for local development
- Auth.js / next-auth v5
- Resend for email, Stripe for payments, react-pdf for PDFs

## Local setup

Use Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env
```

Set `AUTH_SECRET` in `.env` (for example: `openssl rand -base64 32`), then prepare the database:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The seed script creates a demo account with sample data:

```text
Email:    test@example.com
Password: password123
```

The seed is idempotent, so you can run it again to restore the sample clients, invoices, quotations, and payments.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Sync the Prisma schema to SQLite |
| `npm run db:seed` | Seed the demo account and sample data |

## Optional integrations

All integrations are optional. The app remains usable without them; email and payment-link actions show a clear message when they are not configured.

### Email delivery

Set `RESEND_API_KEY` in `.env`. The current sender is `onboarding@resend.dev`, which is suitable for Resend test mode. For production, replace it in `src/lib/email.ts` with a verified domain address.

### Online payments

Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Add a Stripe webhook pointing to:

```text
https://your-domain.com/api/stripe/webhook
```

Subscribe it to `checkout.session.completed`. When a client pays, a Stripe payment is recorded and the invoice status is updated to partial or paid based on the outstanding balance.

### Google sign-in

Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, then allow this callback URL in Google Cloud:

```text
https://your-domain.com/api/auth/callback/google
```

## Production note

The local database is SQLite (`prisma/dev.db`). For a public deployment, use a managed database such as Postgres: change the `datasource db` provider in `prisma/schema.prisma`, update `DATABASE_URL`, and run `npm run db:push` or create a migration.
