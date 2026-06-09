import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Button asChild variant="ghost">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>
      <section className="container flex min-h-screen flex-col justify-center gap-8 py-16">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Boom (ArthSaathi)
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {siteConfig.name}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {siteConfig.description}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SignedOut>
              <Button asChild>
                <Link href="/sign-up">
                  Create account
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button asChild>
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
            </SignedIn>
          </div>
        </div>
      </section>
    </main>
  );
}
