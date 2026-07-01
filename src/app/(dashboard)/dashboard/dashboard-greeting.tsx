"use client";

import { useEffect, useState } from "react";

const greetings = {
  assamese: {
    en: "Namoskar. Apuni kene ache?",
    hi: "नमस्कार. आपुनी केने आछे?"
  },
  bengali: {
    en: "Nomoshkar. Apni kemon achen?",
    hi: "नमोस्कार. आपनी केमोन आछेन?"
  },
  english: {
    en: "Hello. How are you?",
    hi: "हेलो. आप कैसे हैं?"
  },
  gujarati: {
    en: "Namaste. Kem cho?",
    hi: "नमस्ते. केम छो?"
  },
  hindi: {
    en: "Namaste. Aap kaise hain?",
    hi: "नमस्ते. आप कैसे हैं?"
  },
  kannada: {
    en: "Namaskara. Neevu hegiddira?",
    hi: "नमस्कारा. नीवु हेगिद्दीरा?"
  },
  malayalam: {
    en: "Namaskaram. Sughamaano?",
    hi: "नमस्कारम. सुखमानो?"
  },
  marathi: {
    en: "Namaskar. Tumhi kase ahat?",
    hi: "नमस्कार. तुम्ही कसे आहात?"
  },
  mizo: {
    en: "Chibai. I dam em?",
    hi: "चिबाई. आई डैम एम?"
  },
  odia: {
    en: "Namaskar. Apanana kemiti achhanti?",
    hi: "नमस्कार. आपनाना केमिति अच्छंति?"
  },
  punjabi: {
    en: "Sat Sri Akaal. Tuhada ki haal hai?",
    hi: "सत श्री अकाल. तुहाडा की हाल है?"
  },
  rajasthani: {
    en: "Khamma Ghani. Kain haal hai?",
    hi: "खम्मा घणी. कैं हाल है?"
  },
  tamil: {
    en: "Vanakkam. Neenga eppadi irukkinga?",
    hi: "वनक्कम. नींगा एपड़ी इरुक्किंगा?"
  },
  telugu: {
    en: "Namaskaramu. Meeru ela unnaru?",
    hi: "नमस्कारमु. मीरु एला उन्नारु?"
  },
  urdu: {
    en: "Aadaab. Aap kaise hain?",
    hi: "आदाब. आप कैसे हैं?"
  }
} as const;

type GreetingLanguage = keyof typeof greetings;
type UiLanguage = "en" | "hi";

function normalizeLanguage(language?: string | null): GreetingLanguage {
  const normalized = language?.toLowerCase().trim();

  if (normalized && normalized in greetings) {
    return normalized as GreetingLanguage;
  }

  return "english";
}

export function DashboardGreeting({
  displayName,
  initialLanguage
}: {
  displayName: string;
  initialLanguage?: string | null;
}) {
  const [language, setLanguage] = useState<GreetingLanguage>(
    normalizeLanguage(initialLanguage)
  );
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("en");

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(
      "arthsathi-preferred-language"
    );

    if (storedLanguage) {
      setLanguage(normalizeLanguage(storedLanguage));
    }

    const storedUiLanguage = window.localStorage.getItem("arthsathi-language");

    if (storedUiLanguage === "hi" || storedUiLanguage === "en") {
      setUiLanguage(storedUiLanguage);
    }

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: string }>;
      setLanguage(normalizeLanguage(customEvent.detail?.language));
    }

    function handleUiLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<{ language?: UiLanguage }>;
      const nextLanguage = customEvent.detail?.language;

      if (nextLanguage === "hi" || nextLanguage === "en") {
        setUiLanguage(nextLanguage);
      }
    }

    window.addEventListener(
      "arthsathi-preferred-language-change",
      handleLanguageChange
    );
    window.addEventListener(
      "arthsathi-language-change",
      handleUiLanguageChange
    );

    return () => {
      window.removeEventListener(
        "arthsathi-preferred-language-change",
        handleLanguageChange
      );
      window.removeEventListener(
        "arthsathi-language-change",
        handleUiLanguageChange
      );
    };
  }, []);

  return (
    <div className="space-y-1.5">
      <p className="font-[cursive] text-3xl font-bold leading-tight tracking-normal text-emerald-950 sm:text-5xl">
        Hi {displayName}
      </p>
      <h1 className="max-w-3xl text-base font-semibold leading-7 tracking-normal text-slate-700 sm:text-xl">
        {greetings[language][uiLanguage]}
      </h1>
    </div>
  );
}
