import { redirect } from "next/navigation";
import type { Types } from "mongoose";
import { cache } from "react";

import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { FinancialDNAModel } from "@/models";

export const getCurrentFinancialDNA = cache(async function getCurrentFinancialDNA() {
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return {
      appUser: null,
      financialDNA: null
    };
  }

  const financialDNA = await FinancialDNAModel.findOne({
    userId: appUser._id
  });

  return {
    appUser,
    financialDNA
  };
});

export async function requireFinancialDNA() {
  const { appUser, financialDNA } = await getCurrentFinancialDNA();

  if (!appUser || !financialDNA) {
    redirect("/dashboard/financial-dna");
  }

  return {
    appUser: appUser as typeof appUser & { _id: Types.ObjectId },
    financialDNA
  };
}
