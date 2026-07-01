"use client";

import { useEffect, useState } from "react";

import { type AppLanguage, type TranslationKey, translate } from "@/lib/i18n";

export function LanguageText({ id }: { id: TranslationKey }) {
  const [language, setLanguage] = useState<AppLanguage>("en");

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

  return <>{translate(id, language)}</>;
}
