import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  AudioLines,
  Brain,
  CheckCircle2,
  IndianRupee,
  Radar,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const productPillars = [
  {
    title: "Voice Ledger",
    description: "Log spends in natural language and turn messy notes into clean records.",
    icon: AudioLines
  },
  {
    title: "Financial DNA",
    description: "Understand spending habits, risk signals, and goal readiness in one place.",
    icon: Brain
  },
  {
    title: "Scam Shield",
    description: "Check suspicious messages, offers, and payment requests before acting.",
    icon: ShieldCheck
  },
  {
    title: "Future Simulation",
    description: "Ask what-if questions and see how today's choice changes tomorrow.",
    icon: Radar
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-slate-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-slate-950 text-white">
              <IndianRupee className="size-4" aria-hidden="true" />
            </span>
            <span>{siteConfig.name}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <SignedOut>
              <Button asChild variant="ghost" className="px-2 sm:px-4">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild className="px-2 sm:px-4">
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

      <section className="container grid min-h-[100svh] items-center gap-8 pb-10 pt-24 sm:gap-10 sm:pb-14 lg:grid-cols-[1fr_480px]">
        <div className="max-w-3xl space-y-7">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <Sparkles className="size-4 text-emerald-700" aria-hidden="true" />
            AI financial companion for Indian households
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              ArthSaathi
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
              Plan daily money decisions, capture expenses by voice, spot scams,
              and simulate future choices from one calm dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <SignedOut>
              <Button asChild size="lg" className="bg-slate-950 hover:bg-slate-800">
                <Link href="/sign-up">
                  Start planning
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-300 bg-white">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button asChild size="lg" className="bg-slate-950 hover:bg-slate-800">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
            </SignedIn>
          </div>

          <div className="grid max-w-2xl gap-3 pt-2 sm:grid-cols-3">
            {["Track cashflow", "Check risky messages", "Plan goals"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="size-4 text-emerald-700" aria-hidden="true" />
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Today</p>
                <p className="text-xl font-semibold sm:text-2xl">Money health 78</p>
              </div>
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                Stable
              </div>
            </div>

            <div className="space-y-3">
              {productPillars.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="grid grid-cols-[40px_1fr] gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-white text-slate-900 shadow-sm">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-md bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2">
                <UsersRound className="size-4 text-emerald-300" aria-hidden="true" />
                <p className="text-sm font-medium">Community insight</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Similar households are saving 12% more by splitting goals into
                weekly targets.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
