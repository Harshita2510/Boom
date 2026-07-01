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
  Mic,
  Radar,
  Repeat2,
  ShieldCheck,
  Loader2,
  TrendingUp,
  UserRound,
  UsersRound,
  type LucideIcon
} from "lucide-react";

import { type AppLanguage, type TranslationKey, translate } from "@/lib/i18n";

const primaryNavItems: Array<{
  titleKey: TranslationKey;
  href: string;
  icon: LucideIcon;
}> = [
  {
    titleKey: "nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    titleKey: "nav.financialDna",
    href: "/dashboard/financial-dna",
    icon: Brain
  },
  {
    titleKey: "nav.learn",
    href: "/dashboard/learn",
    icon: LibraryBig
  },
  {
    titleKey: "nav.voiceLedger",
    href: "/dashboard/voice-ledger",
    icon: AudioLines
  },
  {
    titleKey: "nav.voiceMode",
    href: "/dashboard/voice-mode",
    icon: Mic
  },
  {
    titleKey: "nav.community",
    href: "/dashboard/community-intelligence",
    icon: UsersRound
  },
  {
    titleKey: "nav.scamShield",
    href: "/dashboard/scam-shield",
    icon: ShieldCheck
  },
  {
    titleKey: "nav.documents",
    href: "/dashboard/documents",
    icon: FileSearch
  },
  {
    titleKey: "nav.profile",
    href: "/dashboard/profile",
    icon: UserRound
  }
];

const featureNavItems: Array<{
  titleKey: TranslationKey;
  href: string;
  icon: LucideIcon;
}> = [
  {
    titleKey: "nav.schemes",
    href: "/dashboard/schemes",
    icon: Landmark
  },
  {
    titleKey: "nav.budgetCoach",
    href: "/dashboard/budget-coach",
    icon: ChartNoAxesCombined
  },
  {
    titleKey: "nav.goals",
    href: "/dashboard/goals",
    icon: Goal
  },
  {
    titleKey: "nav.cashSmoothing",
    href: "/dashboard/cash-smoothing",
    icon: CloudSun
  },
  {
    titleKey: "nav.recurring",
    href: "/dashboard/recurring",
    icon: Repeat2
  },
  {
    titleKey: "nav.investments",
    href: "/dashboard/investments",
    icon: TrendingUp
  },
  {
    titleKey: "nav.simulation",
    href: "/dashboard/future-simulation",
    icon: Radar
  }
];

export function DashboardNav({
  hasFinancialDNA
}: {
  hasFinancialDNA: boolean;
}) {
  const pathname = usePathname();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const visiblePrimaryNavItems = hasFinancialDNA
    ? primaryNavItems
    : primaryNavItems.filter((item) => item.href === "/dashboard/financial-dna");
  const visibleFeatureNavItems = hasFinancialDNA ? featureNavItems : [];

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("arthsathi-language");

    if (storedLanguage === "hi" || storedLanguage === "en") {
      setLanguage(storedLanguage);
    }

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: AppLanguage }>;
      const nextLanguage = customEvent.detail?.language;

      if (nextLanguage === "hi" || nextLanguage === "en") {
        setLanguage(nextLanguage);
      }
    }

    window.addEventListener("arthsathi-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("arthsathi-language-change", handleLanguageChange);
    };
  }, []);

  function getLinkClass(href: string, compact = false) {
    const active = pathname === href;
    const pending = pendingHref === href;

    return `inline-flex ${compact ? "h-9" : "h-9"} items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors ${
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
      <nav className="flex flex-col gap-0.5">
        {visiblePrimaryNavItems.map((item) => {
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
              {translate(item.titleKey, language)}
            </Link>
          );
        })}

        {hasFinancialDNA ? (
          <button
            type="button"
            onClick={() => setFeaturesOpen((value) => !value)}
            aria-expanded={featuresOpen}
            className="inline-flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {featuresOpen ? (
              <ChevronDown className="size-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-4" aria-hidden="true" />
            )}
            {translate("nav.features", language)}
          </button>
        ) : null}

        {featuresOpen ? (
          <div className="mt-1 flex flex-col gap-0.5 border-l pl-2">
            {visibleFeatureNavItems.map((item) => {
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
                  {translate(item.titleKey, language)}
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>
  );
}
