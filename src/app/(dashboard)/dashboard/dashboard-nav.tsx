"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AudioLines,
  Brain,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  CloudSun,
  FileSearch,
  Goal,
  Landmark,
  LayoutDashboard,
  LibraryBig,
  Menu,
  Mic,
  Radar,
  Repeat2,
  ShieldCheck,
  Loader2,
  TrendingUp,
  UserRound,
  UsersRound
} from "lucide-react";

const primaryNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Financial DNA",
    href: "/dashboard/financial-dna",
    icon: Brain
  },
  {
    title: "Learn",
    href: "/dashboard/learn",
    icon: LibraryBig
  },
  {
    title: "Voice Ledger",
    href: "/dashboard/voice-ledger",
    icon: AudioLines
  },
  {
    title: "Voice Mode",
    href: "/dashboard/voice-mode",
    icon: Mic
  },
  {
    title: "Community",
    href: "/dashboard/community-intelligence",
    icon: UsersRound
  },
  {
    title: "Scam Shield",
    href: "/dashboard/scam-shield",
    icon: ShieldCheck
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileSearch
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: UserRound
  }
];

const featureNavItems = [
  {
    title: "Schemes",
    href: "/dashboard/schemes",
    icon: Landmark
  },
  {
    title: "Budget Coach",
    href: "/dashboard/budget-coach",
    icon: ChartNoAxesCombined
  },
  {
    title: "Goals",
    href: "/dashboard/goals",
    icon: Goal
  },
  {
    title: "Cash Smoothing",
    href: "/dashboard/cash-smoothing",
    icon: CloudSun
  },
  {
    title: "Recurring",
    href: "/dashboard/recurring",
    icon: Repeat2
  },
  {
    title: "Investments",
    href: "/dashboard/investments",
    icon: TrendingUp
  },
  {
    title: "Simulation",
    href: "/dashboard/future-simulation",
    icon: Radar
  }
];

export function DashboardNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
    setMenuOpen(false);
  }, [pathname]);

  function getLinkClass(href: string, compact = false) {
    const active = pathname === href;
    const pending = pendingHref === href;

    return `inline-flex ${compact ? "h-9" : "h-10"} items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
      active
        ? "bg-emerald-50 text-emerald-900"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    } ${pending ? "animate-pulse bg-emerald-50 text-emerald-900" : ""}`;
  }

  function markPending(href: string) {
    if (href !== pathname) {
      setPendingHref(href);
    }
  }

  return (
    <>
      <nav className="md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-semibold text-muted-foreground"
          >
            <Menu className="size-4" aria-hidden="true" />
            Menu
          </button>
          <button
            type="button"
            onClick={() => setFeaturesOpen((value) => !value)}
            aria-expanded={featuresOpen}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-semibold text-muted-foreground"
          >
            {featuresOpen ? (
              <ChevronDown className="size-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-4" aria-hidden="true" />
            )}
            Features
          </button>
        </div>

        {menuOpen ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => markPending(item.href)}
                  className={getLinkClass(item.href)}
                >
                  {pendingHref === item.href ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="size-4" aria-hidden="true" />
                  )}
                  {item.title}
                </Link>
              );
            })}
          </div>
        ) : null}

        {featuresOpen ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {featureNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => markPending(item.href)}
                  className={getLinkClass(item.href)}
                >
                  {pendingHref === item.href ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="size-4" aria-hidden="true" />
                  )}
                  {item.title}
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>

      <nav className="hidden gap-1 md:flex md:flex-col">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={() => markPending(item.href)}
              className={getLinkClass(item.href)}
            >
              {pendingHref === item.href ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Icon className="size-4" aria-hidden="true" />
              )}
              {item.title}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setFeaturesOpen((value) => !value)}
          aria-expanded={featuresOpen}
          className="inline-flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {featuresOpen ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
            Features
        </button>

        {featuresOpen ? (
          <div className="mt-1 flex flex-col gap-1 border-l pl-2">
            {featureNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => markPending(item.href)}
                  className={getLinkClass(item.href, true)}
                >
                  {pendingHref === item.href ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="size-4" aria-hidden="true" />
                  )}
                  {item.title}
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>
    </>
  );
}
