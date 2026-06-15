import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MessageCircle } from "lucide-react";

import { siteConfig } from "@/config/site";
import { DashboardNav } from "./dashboard-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            {siteConfig.name}
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "size-9"
              }
            }}
          />
        </div>
      </header>

      <div className="container grid gap-6 py-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border bg-background p-2 md:sticky md:top-20 md:h-fit">
          <DashboardNav />
        </aside>

        <div className="min-w-0 rounded-lg border bg-background p-6">
          {children}
        </div>
      </div>

      {/* Chat floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/chat" aria-label="Open chat" className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition">
          <MessageCircle className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
