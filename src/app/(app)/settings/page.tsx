import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  buildLocale,
  getCountryOptions,
  getCurrencyOptions,
  getLanguageOptions,
} from "@/lib/locale-data";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      businessName: true,
      businessAddress: true,
      currency: true,
      country: true,
      language: true,
      logoDataUrl: true,
      qrName: true,
      qrVpa: true,
      qrUpiId: true,
      qrAccountNumber: true,
      gstin: true,
      state: true,
    },
  });

  const country = user?.country ?? "US";
  const language = user?.language ?? "en";
  const locale = buildLocale(language, country);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Customize the details that appear on your invoices.
        </p>
      </div>
      <SettingsForm
        name={user?.name ?? ""}
        businessName={user?.businessName ?? ""}
        businessAddress={user?.businessAddress ?? ""}
        currency={user?.currency ?? "USD"}
        country={country}
        language={language}
        logoDataUrl={user?.logoDataUrl ?? null}
        qrName={user?.qrName ?? ""}
        qrVpa={user?.qrVpa ?? ""}
        qrUpiId={user?.qrUpiId ?? ""}
        qrAccountNumber={user?.qrAccountNumber ?? ""}
        gstin={user?.gstin ?? ""}
        state={user?.state ?? ""}
        countries={getCountryOptions(locale)}
        currencies={getCurrencyOptions(locale)}
        languages={getLanguageOptions(locale)}
      />
    </div>
  );
}
