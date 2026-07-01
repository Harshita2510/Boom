"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { siteConfig } from "@/config/site";
import { DashboardNav } from "./dashboard-nav";
import { DashboardUserButton } from "./dashboard-user-button";

export function DashboardShell({
  children,
  hasFinancialDNA
}: Readonly<{
  children: React.ReactNode;
  hasFinancialDNA: boolean;
}>) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("arthsathi-language");

    if (storedLanguage === "hi" || storedLanguage === "en") {
      setLanguage(storedLanguage);
    }
  }, []);

  function changeLanguage(nextLanguage: "en" | "hi") {
    setLanguage(nextLanguage);
    window.localStorage.setItem("arthsathi-language", nextLanguage);
    window.dispatchEvent(
      new CustomEvent("arthsathi-language-change", {
        detail: { language: nextLanguage }
      })
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-slate-800 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
            <Link href="/dashboard" className="min-w-0 truncate font-semibold tracking-tight">
              {siteConfig.name}
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              {(["en", "hi"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeLanguage(item)}
                  className={`h-8 rounded-full px-3 text-xs font-bold transition ${
                    language === item
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                  aria-pressed={language === item}
                >
                  {item === "en" ? "EN" : "हिं"}
                </button>
              ))}
            </div>
            <DashboardUserButton />
          </div>
        </div>
      </header>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[1px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 mt-16 w-[270px] border-r bg-background p-3 shadow-2xl transition-transform duration-200 md:sticky md:top-16 md:z-20 md:mt-0 md:h-[calc(100vh-4rem)] md:w-[230px] md:shrink-0 md:shadow-none ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:hidden"
          }`}
        >
          <DashboardNav hasFinancialDNA={hasFinancialDNA} />
        </aside>

        <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0 overflow-hidden rounded-xl border bg-background p-4 sm:p-5 lg:p-6">
            {children}
          </div>
        </div>
      </div>

      {hasFinancialDNA ? (
        <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
          <Link
            href="/chat"
            aria-label="Open chat"
            className="inline-flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 sm:size-14"
          >
            <MessageCircle className="size-5 sm:size-6" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
