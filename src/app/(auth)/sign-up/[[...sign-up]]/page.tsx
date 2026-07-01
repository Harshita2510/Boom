import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      <Link href="/" className="text-xl font-semibold tracking-tight">
        {siteConfig.name}
      </Link>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard/financial-dna"
        fallbackRedirectUrl="/dashboard/financial-dna"
      />
    </main>
  );
}
