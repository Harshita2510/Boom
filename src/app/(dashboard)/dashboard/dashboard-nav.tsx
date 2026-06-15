"use client";

import Link from "next/link";
import { useState } from "react";
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
  Mic,
  Radar,
  Repeat2,
  ShieldCheck,
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
  const [featuresOpen, setFeaturesOpen] = useState(false);

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {primaryNavItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.title}
          </Link>
        );
      })}

      <div className="shrink-0 md:mt-1 md:shrink">
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
          <div className="mt-1 flex gap-1 border-l pl-2 md:flex-col">
            {featureNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
