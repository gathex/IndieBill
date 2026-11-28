import { requireUserId } from "@/lib/auth";
import { getUserSettings } from "@/lib/users";
import { getCurrencyOptions } from "@/lib/locale-data";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export const metadata = {
  title: "Welcome Setup",
};

export default async function OnboardingPage() {
  const userId = await requireUserId();
  const settings = await getUserSettings(userId);
  const currencies = getCurrencyOptions("en-IN");

  return (
    <OnboardingWizard
      initialData={{
        displayName: settings.displayName,
        businessName: settings.rawBusinessName,
        phone: settings.phone,
        businessAddress: settings.businessAddress ?? "",
        state: settings.state ?? "",
        currency: settings.currency,
        gstin: settings.gstin ?? "",
        defaultGstRate: settings.defaultGstRate,
        invoicePrefix: settings.invoicePrefix,
        qrUpiId: settings.qrUpiId ?? "",
        bankName: settings.bankName ?? "",
        qrAccountNumber: settings.qrAccountNumber ?? "",
        bankIfsc: settings.bankIfsc ?? "",
      }}
      currencies={currencies}
    />
  );
}
