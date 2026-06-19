import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { MessageCircle } from "lucide-react";

import { siteConfig } from "@/config/site";
import { DashboardNav } from "./dashboard-nav";
import { DashboardUserButton } from "./dashboard-user-button";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/dashboard" className="min-w-0 truncate font-semibold tracking-tight">
            {siteConfig.name}
          </Link>
          <DashboardUserButton />
        </div>
      </header>

      <div className="container grid gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-5 md:grid-cols-[220px_1fr] md:gap-6 md:py-6">
        <aside className="rounded-2xl border bg-background p-2 md:sticky md:top-20 md:h-fit">
          <DashboardNav />
        </aside>

        <div className="min-w-0 overflow-hidden rounded-2xl border bg-background p-3 sm:p-6">
          {children}
        </div>
      </div>

      {/* Chat floating button */}
      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <Link href="/chat" aria-label="Open chat" className="inline-flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 sm:size-14">
          <MessageCircle className="size-5 sm:size-6" />
        </Link>
      </div>
    </div>
  );
}
