import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      <Link href="/" className="text-xl font-semibold tracking-tight">
        {siteConfig.name}
      </Link>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
