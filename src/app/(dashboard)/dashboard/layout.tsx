import { auth } from "@clerk/nextjs/server";

import { getCurrentFinancialDNA } from "@/lib/financial-dna-gate";
import { DashboardShell } from "./dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();
  const { financialDNA } = await getCurrentFinancialDNA();
  const hasFinancialDNA = Boolean(financialDNA);

  return (
    <DashboardShell hasFinancialDNA={hasFinancialDNA}>
      {children}
    </DashboardShell>
  );
}
