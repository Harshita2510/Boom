"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const languageOptions = [
  { en: "English", hi: "अंग्रेजी", value: "english" },
  { en: "Hindi", hi: "हिंदी", value: "hindi" },
  { en: "Marathi", hi: "मराठी", value: "marathi" },
  { en: "Tamil", hi: "तमिल", value: "tamil" },
  { en: "Telugu", hi: "तेलुगु", value: "telugu" },
  { en: "Bengali", hi: "बंगाली", value: "bengali" },
  { en: "Gujarati", hi: "गुजराती", value: "gujarati" },
  { en: "Kannada", hi: "कन्नड़", value: "kannada" },
  { en: "Malayalam", hi: "मलयालम", value: "malayalam" },
  { en: "Punjabi", hi: "पंजाबी", value: "punjabi" },
  { en: "Odia", hi: "ओड़िया", value: "odia" },
  { en: "Urdu", hi: "उर्दू", value: "urdu" },
  { en: "Assamese", hi: "असमिया", value: "assamese" },
  { en: "Rajasthani", hi: "राजस्थानी", value: "rajasthani" },
  { en: "Mizo", hi: "मिजो", value: "mizo" },
  { en: "Other", hi: "अन्य", value: "other" }
];

type UiLanguage = "en" | "hi";

const uiCopy = {
  en: {
    cancel: "Cancel",
    change: "Change",
    fallbackLanguage: "English",
    saving: "Saving...",
    selectLanguage: "Select language",
    updateError: "Could not update language."
  },
  hi: {
    cancel: "रद्द करें",
    change: "बदलें",
    fallbackLanguage: "अंग्रेजी",
    saving: "सेव हो रहा है...",
    selectLanguage: "भाषा चुनें",
    updateError: "भाषा अपडेट नहीं हो सकी."
  }
} satisfies Record<UiLanguage, Record<string, string>>;

function getLanguageLabel(language: string | undefined, uiLanguage: UiLanguage) {
  return (
    languageOptions.find((option) => option.value === language)?.[uiLanguage] ||
    uiCopy[uiLanguage].fallbackLanguage
  );
}

export function PreferredLanguageSelect({
  initialLanguage
}: {
  initialLanguage?: string;
}) {
  const router = useRouter();
  const [language, setLanguage] = useState(initialLanguage || "english");
  const [savedLanguage, setSavedLanguage] = useState(initialLanguage || "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("en");

  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
      setSavedLanguage(initialLanguage);
      window.localStorage.setItem("arthsathi-preferred-language", initialLanguage);
      return;
    }

    const storedLanguage = window.localStorage.getItem(
      "arthsathi-preferred-language"
    );

    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, [initialLanguage]);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("arthsathi-language");

    if (storedLanguage === "hi" || storedLanguage === "en") {
      setUiLanguage(storedLanguage);
    }

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: UiLanguage }>;
      const nextLanguage = customEvent.detail?.language;

      if (nextLanguage === "hi" || nextLanguage === "en") {
        setUiLanguage(nextLanguage);
      }
    }

    window.addEventListener("arthsathi-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener(
        "arthsathi-language-change",
        handleLanguageChange
      );
    };
  }, []);

  async function updateLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/user/preferences", {
        body: JSON.stringify({ preferredLanguage: nextLanguage }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH"
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || uiCopy[uiLanguage].updateError);
        return;
      }

      const savedValue = data.preferredLanguage || nextLanguage;

      setLanguage(savedValue);
      setSavedLanguage(savedValue);
      setIsEditing(false);
      window.localStorage.setItem(
        "arthsathi-preferred-language",
        savedValue
      );
      window.dispatchEvent(
        new CustomEvent("arthsathi-preferred-language-change", {
          detail: { language: savedValue }
        })
      );
      router.refresh();
    } catch {
      setError(uiCopy[uiLanguage].updateError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-1 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-bold text-emerald-800">
          {getLanguageLabel(language, uiLanguage)}
        </p>
        <button
          type="button"
          onClick={() => setIsEditing((value) => !value)}
          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          {isEditing ? uiCopy[uiLanguage].cancel : uiCopy[uiLanguage].change}
        </button>
      </div>
      {isEditing ? (
        <select
          value={language}
          onChange={(event) => void updateLanguage(event.target.value)}
          disabled={isSaving}
          className="h-10 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:opacity-70"
          aria-label="Preferred language"
        >
          <option value="" disabled>
            {uiCopy[uiLanguage].selectLanguage}
          </option>
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option[uiLanguage]}
            </option>
          ))}
        </select>
      ) : null}
      <p className="font-mono text-xs text-emerald-700">
        Saved: {savedLanguage || "checking"} | UI: {language}
      </p>
      {isSaving ? (
        <p className="text-xs font-semibold text-emerald-700">
          {uiCopy[uiLanguage].saving}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs font-semibold text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
