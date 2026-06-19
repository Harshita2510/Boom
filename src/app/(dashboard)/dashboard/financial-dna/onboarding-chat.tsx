"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  Mic,
  Pencil,
  Send,
  Sparkles,
  Square
} from "lucide-react";

type Msg = {
  role: "user" | "agent";
  text: string;
  meta?: {
    completed?: boolean;
    step?: number;
  };
};

type Language = "en" | "hi";

type QuickReply = {
  label: string;
  labelHi: string;
  value: string;
};

const quickRepliesByStep: Record<number, QuickReply[]> = {
  1: [
    { label: "18-25", labelHi: "18-25", value: "18-25" },
    { label: "26-30", labelHi: "26-30", value: "26-30" },
    { label: "31-35", labelHi: "31-35", value: "31-35" },
    { label: "36-45", labelHi: "36-45", value: "36-45" },
    { label: "46-55", labelHi: "46-55", value: "46-55" },
    { label: "55+", labelHi: "55+", value: "55+" }
  ],
  2: [
    { label: "Mumbai", labelHi: "मुंबई", value: "Mumbai" },
    { label: "Delhi", labelHi: "दिल्ली", value: "Delhi" },
    { label: "Bengaluru", labelHi: "बेंगलुरु", value: "Bengaluru" },
    { label: "Hyderabad", labelHi: "हैदराबाद", value: "Hyderabad" },
    { label: "Chennai", labelHi: "चेन्नई", value: "Chennai" },
    { label: "Pune", labelHi: "पुणे", value: "Pune" },
    { label: "Other", labelHi: "दूसरा", value: "__other_city__" }
  ],
  3: [
    { label: "💼 Salaried", labelHi: "💼 नौकरी", value: "Salaried" },
    { label: "🏪 Self-Employed", labelHi: "🏪 सेल्फ-एम्प्लॉयड", value: "Self-Employed" },
    { label: "🏢 Business Owner", labelHi: "🏢 बिजनेस ओनर", value: "Business Owner" },
    { label: "💻 Freelancer", labelHi: "💻 फ्रीलांसर", value: "Freelancer" },
    { label: "🌅 Retired", labelHi: "🌅 रिटायर्ड", value: "Retired" },
    { label: "🎓 Student", labelHi: "🎓 स्टूडेंट", value: "Student" }
  ],
  4: [
    {
      label: "Under Rs20,000",
      labelHi: "Rs20,000 से कम",
      value: "Under Rs20,000"
    },
    {
      label: "Rs20k - Rs40k",
      labelHi: "Rs20k - Rs40k",
      value: "Rs20k - Rs40k"
    },
    {
      label: "Rs40k - Rs70k",
      labelHi: "Rs40k - Rs70k",
      value: "Rs40k - Rs70k"
    },
    {
      label: "Rs70k - Rs1L",
      labelHi: "Rs70k - Rs1L",
      value: "Rs70k - Rs1L"
    },
    {
      label: "Rs1L - Rs2L",
      labelHi: "Rs1L - Rs2L",
      value: "Rs1L - Rs2L"
    },
    {
      label: "Above Rs2 Lakhs",
      labelHi: "Rs2 लाख से ज्यादा",
      value: "Above Rs2 Lakhs"
    }
  ],
  5: [
    { label: "👤 Single", labelHi: "👤 सिंगल", value: "Single" },
    { label: "👫 Married, No Kids", labelHi: "👫 शादीशुदा, बच्चे नहीं", value: "Married, No Kids" },
    { label: "👨‍👩‍👧 Married with Kids", labelHi: "👨‍👩‍👧 शादीशुदा, बच्चे हैं", value: "Married with Kids" },
    { label: "👩‍👦 Single Parent", labelHi: "👩‍👦 सिंगल पैरेंट", value: "Single Parent" },
    { label: "🏡 Empty Nester", labelHi: "🏡 एम्प्टी नेस्टर", value: "Empty Nester" }
  ],
  6: [
    { label: "None", labelHi: "कोई नहीं", value: "None" },
    { label: "1", labelHi: "1", value: "1" },
    { label: "2", labelHi: "2", value: "2" },
    { label: "3", labelHi: "3", value: "3" },
    { label: "4+", labelHi: "4+", value: "4+" }
  ],
  7: [
    { label: "📋 Yes, I do", labelHi: "📋 हां", value: "Yes, I do" },
    { label: "✅ No, I'm debt-free", labelHi: "✅ नहीं, debt-free हूं", value: "No, I'm debt-free" }
  ],
  8: [
    { label: "Under Rs5,000", labelHi: "Rs5,000 से कम", value: "Under Rs5,000" },
    { label: "Rs5k - Rs15k", labelHi: "Rs5k - Rs15k", value: "Rs5k - Rs15k" },
    { label: "Rs15k - Rs30k", labelHi: "Rs15k - Rs30k", value: "Rs15k - Rs30k" },
    { label: "Rs30k - Rs50k", labelHi: "Rs30k - Rs50k", value: "Rs30k - Rs50k" },
    { label: "Above Rs50k", labelHi: "Rs50k से ज्यादा", value: "Above Rs50k" }
  ],
  9: [
    { label: "🛡️ Emergency Fund", labelHi: "🛡️ इमरजेंसी फंड", value: "Emergency Fund" },
    { label: "🏠 Buy a Home", labelHi: "🏠 घर खरीदना", value: "Buy a Home" },
    { label: "🌴 Retirement", labelHi: "🌴 रिटायरमेंट", value: "Retirement" },
    { label: "🎓 Child's Education", labelHi: "🎓 बच्चे की शिक्षा", value: "Child's Education" },
    { label: "✈️ Travel", labelHi: "✈️ यात्रा", value: "Travel" },
    { label: "🚗 Buy a Car", labelHi: "🚗 कार खरीदना", value: "Buy a Car" },
    { label: "🚀 Start Business", labelHi: "🚀 बिजनेस शुरू करना", value: "Start Business" },
    { label: "💍 Wedding", labelHi: "💍 शादी", value: "Wedding" }
  ],
  10: [
    {
      label: "🛡️ Conservative — safety first, even if returns are lower",
      labelHi: "🛡️ Conservative — safety first",
      value: "Conservative — safety first, even if returns are lower"
    },
    {
      label: "⚖️ Moderate — balanced risk and growth over time",
      labelHi: "⚖️ Moderate — balanced risk and growth",
      value: "Moderate — balanced risk and growth over time"
    },
    {
      label: "🚀 Aggressive — I can handle volatility for maximum growth",
      labelHi: "🚀 Aggressive — maximum growth",
      value: "Aggressive — I can handle volatility for maximum growth"
    }
  ]
};

const copy = {
  en: {
    completedMessage:
      "Excellent! 🎉 I have everything I need.\n\nYour Financial DNA is ready, and ArthSaathi can now personalize your guidance around your goals, life stage, income, and risk comfort.",
    completedStatus: "DNA complete. Nicely done.",
    customPlaceholder: "Type your answer...",
    headerSubline: "Cheerful money clarity, one easy choice at a time",
    moodAfterCompleted:
      "Thank you for sharing. Your money snapshot is ready below, and you can update your DNA whenever life changes.",
    moodPlaceholder: "What should I call you?",
    reading: "Reading your answer",
    updateDNA: "Update DNA",
    useChipsPlaceholder: "Use the chips above, or update your DNA",
    voiceUnsupported:
      "Voice input is not supported in this browser. You can type your answer here.",
    welcomeMessage:
      "Namaste! 🙏 I'm ArthSaathi, your personal AI financial companion.\nBefore we build your Financial DNA, what should I call you?",
    startDNAAfterMoodMessage:
      "Namaste! 🙏 I'm ArthSaathi, your personal AI financial companion.\nBefore we build your Financial DNA, what should I call you?",
    stepPrompts: {
      0: "Namaste! 🙏 I'm ArthSaathi, your personal AI financial companion.\nBefore we build your Financial DNA, what should I call you?",
      1: "How old are you?",
      2: "Which city are you based in?",
      3: "What kind of work do you do?",
      4: "What's your approximate monthly income?",
      5: "What's your current family situation?",
      6: "How many people depend on you financially? (parents, children, etc.)",
      7: "Do you have any existing loans or EMIs running right now?",
      8: "What's your total monthly EMI across all loans?",
      9: "What are your main financial goals? Pick up to 4.",
      10: "Last question! How comfortable are you with investment risk?"
    }
  },
  hi: {
    completedMessage:
      "आपका Financial DNA तैयार है.\n\nबहुत बढ़िया. आपने जरूरी बातें बता दीं, और मैंने उन्हें आपके लिए एक आसान money profile में बदल दिया है.\n\nआपका snapshot नीचे साफ points में है.",
    completedStatus: "DNA पूरा हो गया. बहुत बढ़िया.",
    customPlaceholder: "Custom जवाब लिखना हो तो यहां लिखें...",
    headerSubline: "पैसों की clarity, आसान choices के साथ",
    moodAfterCompleted:
      "बताने के लिए धन्यवाद. आपका money snapshot नीचे तैयार है, और life बदलने पर आप DNA update कर सकते हैं.",
    moodPlaceholder: "आज आप कैसा महसूस कर रहे हैं?",
    reading: "आपका जवाब पढ़ रहा हूं",
    updateDNA: "DNA अपडेट करें",
    useChipsPlaceholder: "ऊपर chips चुनें, या DNA update करें",
    voiceUnsupported:
      "इस browser में voice input supported नहीं है. आप यहां type कर सकते हैं.",
    welcomeMessage:
      "नमस्ते! 🙏 मैं ArthSaathi हूं, आपका personal AI financial companion.\nFinancial DNA बनाने से पहले, मैं आपको किस नाम से बुलाऊं?",
    startDNAAfterMoodMessage:
      "नमस्ते! 🙏 मैं ArthSaathi हूं, आपका personal AI financial companion.\nFinancial DNA बनाने से पहले, मैं आपको किस नाम से बुलाऊं?",
    stepPrompts: {
      0: "मैं आपको किस नाम से बुलाऊं?",
      1: "आपकी उम्र कितनी है?",
      2: "आप किस city में रहते हैं?",
      3: "आप किस तरह का काम करते हैं?",
      4: "आपकी approximate monthly income कितनी है?",
      5: "आपकी current family situation क्या है?",
      6: "कितने लोग आप पर financially depend करते हैं?",
      7: "क्या आपके कोई loans या EMIs चल रहे हैं?",
      8: "सभी loans की total monthly EMI कितनी है?",
      9: "आपके main financial goals क्या हैं? अधिकतम 4 चुनें.",
      10: "Last question! Investment risk को लेकर आप कितने comfortable हैं?"
    }
  }
} satisfies Record<
  Language,
  {
    completedMessage: string;
    completedStatus: string;
    customPlaceholder: string;
    headerSubline: string;
    moodAfterCompleted: string;
    moodPlaceholder: string;
    reading: string;
    updateDNA: string;
    useChipsPlaceholder: string;
    voiceUnsupported: string;
    welcomeMessage: string;
    startDNAAfterMoodMessage: string;
    stepPrompts: Record<number, string>;
  }
>;

function getActiveStep(messages: Msg[], completed: boolean) {
  if (completed) {
    return 11;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const step = messages[index]?.meta?.step;

    if (typeof step === "number") {
      return step;
    }
  }

  return 0;
}

function getProgress(step: number, completed: boolean) {
  if (completed) {
    return 100;
  }

  return Math.max(8, Math.min(92, Math.round(((step + 1) / 11) * 92)));
}

type DNARecognitionConstructor = new () => DNARecognition;

type DNARecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: DNARecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type DNARecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
    length: number;
  };
};

export function OnboardingChat({
  initialSummary,
  userId
}: {
  initialSummary?: string;
  userId?: string;
}) {
  const [language, setLanguage] = useState<Language>("en");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "agent",
      text: initialSummary ? copy.en.completedMessage : copy.en.welcomeMessage
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [completed, setCompleted] = useState(Boolean(initialSummary));
  const [showCityInput, setShowCityInput] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<DNARecognition | null>(null);
  const activeStep = getActiveStep(messages, completed);
  const isGoalStep = activeStep === 9 && !completed;
  const progress = getProgress(activeStep, completed);
  const quickReplies = completed ? [] : quickRepliesByStep[activeStep] ?? [];
  const text = copy[language];

  function getVisibleLabel(reply: QuickReply) {
    return language === "hi" ? reply.labelHi : reply.label;
  }

  function switchLanguage(nextLanguage: Language) {
    if (nextLanguage === language) {
      return;
    }

    const nextCopy = copy[nextLanguage];
    setLanguage(nextLanguage);

    setMessages((current) => {
      if (current.length !== 1 || current[0]?.role !== "agent") {
        return current;
      }

      return [
        {
          role: "agent",
          text: completed
            ? nextCopy.completedMessage
            : nextCopy.welcomeMessage
        }
      ];
    });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({
      behavior: "smooth",
      top: scrollRef.current.scrollHeight
    });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  async function send(rawMessage = input, displayMessage?: string) {
    const msg = rawMessage.trim();
    const visibleMessage = (displayMessage ?? msg).trim();

    if (!msg || loading || completed) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", text: visibleMessage || msg }
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/financial-dna/onboard", {
        body: JSON.stringify({ message: msg, userId }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Server error");
      }

      setCompleted(Boolean(data.completed));
      setShowCityInput(false);
      if (data.completed) {
        setSelectedGoals([]);
      }
      setMessages((current) => [
        ...current,
        {
          meta: data,
          role: "agent",
          text: data.completed
            ? text.completedMessage
            : data.reply
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text:
            error instanceof Error
              ? error.message
              : "Sorry, something went wrong. Try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function startUpdate() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/financial-dna/onboard", {
        body: JSON.stringify({ reset: true, userId }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Server error");
      }

      setCompleted(false);
      setShowCityInput(false);
      setSelectedGoals([]);
      setInput("");
      setMessages([
        {
          role: "agent",
          text: text.welcomeMessage
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text:
            error instanceof Error
              ? error.message
              : "Could not start DNA update. Try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startVoiceInput() {
    const speechWindow = window as Window & {
      SpeechRecognition?: DNARecognitionConstructor;
      webkitSpeechRecognition?: DNARecognitionConstructor;
    };
    const SpeechRecognitionApi =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text: text.voiceUnsupported
        }
      ]);
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";

        if ((result as typeof result & { isFinal?: boolean })?.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      setInput((finalText || interimText).trim());
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#dfe6df] bg-[#f8f7f2] font-sans shadow-[0_18px_55px_rgba(25,55,45,0.10)]">
      <header className="flex items-center justify-between gap-4 border-b border-[#e7e2d7] bg-white px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#216f61] text-white shadow-[0_10px_24px_rgba(33,111,97,0.28)]">
            <Sparkles className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-slate-950">
              ArthSaathi
            </h2>
            <p className="truncate text-[13px] font-medium leading-5 text-[#6d746c] sm:text-sm">
              {text.headerSubline}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden rounded-full border border-[#dfe4dc] bg-[#fffdfa] p-1 sm:flex">
            {(["en", "hi"] as Language[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => switchLanguage(item)}
                className={`h-8 rounded-full px-3 text-xs font-bold transition ${
                  language === item
                    ? "bg-[#216f61] text-white shadow-sm"
                    : "text-[#6d746c] hover:text-[#216f61]"
                }`}
                aria-pressed={language === item}
              >
                {item === "en" ? "EN" : "हिं"}
              </button>
            ))}
          </div>
          <span className="w-10 text-right text-sm font-semibold text-[#6d746c]">
            {progress}%
          </span>
          <div
            className="h-2 w-24 overflow-hidden rounded-full bg-[#e5e7df] sm:w-44"
            aria-label={`Financial DNA progress ${progress}%`}
          >
            <div
              className="h-full rounded-full bg-[#216f61] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {completed ? (
        <div className="border-b border-emerald-100 bg-[#ecfff6] px-4 py-3 text-emerald-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {text.completedStatus}
            </div>
            <button
              type="button"
              onClick={startUpdate}
              disabled={loading}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-900 disabled:opacity-60"
            >
              <Pencil className="size-4" aria-hidden="true" />
              {text.updateDNA}
            </button>
          </div>
        </div>
      ) : null}

      <section className="flex min-h-[520px] flex-col bg-[linear-gradient(180deg,#fbfaf6_0%,#f6f5ef_100%)] sm:min-h-[640px]">
          <div ref={scrollRef} className="flex-1 space-y-7 overflow-y-auto p-4 sm:p-8">
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser ? (
                    <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-[#216f61] text-white shadow-sm">
                      <Bot className="size-5" aria-hidden="true" />
                    </div>
                  ) : null}
                  <div
                    className={`max-w-[78%] whitespace-pre-line px-4 py-3 text-[15px] font-medium leading-7 shadow-[0_10px_26px_rgba(15,23,42,0.08)] sm:px-5 sm:text-base ${
                      isUser
                        ? "rounded-3xl rounded-tr-lg bg-[#216f61] text-white"
                        : "rounded-3xl rounded-tl-lg border border-[#e5e0d6] bg-white text-slate-950"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex items-start gap-3">
                <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-[#216f61] text-white shadow-sm">
                  <Bot className="size-5" aria-hidden="true" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-3xl rounded-tl-lg border border-[#e5e0d6] bg-white px-5 py-3 text-sm text-muted-foreground shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {text.reading}
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#e7e2d7] bg-white p-4 sm:p-5">
            <div className="mb-4 flex rounded-full border border-[#dfe4dc] bg-[#fffdfa] p-1 sm:hidden">
              {(["en", "hi"] as Language[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => switchLanguage(item)}
                  className={`h-9 flex-1 rounded-full text-sm font-bold transition ${
                    language === item
                      ? "bg-[#216f61] text-white shadow-sm"
                      : "text-[#6d746c]"
                  }`}
                  aria-pressed={language === item}
                >
                  {item === "en" ? "English" : "हिंदी"}
                </button>
              ))}
            </div>

            {quickReplies.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-3">
                {quickReplies.map((reply) => {
                  const selected = selectedGoals.includes(reply.value);

                  return (
                    <button
                      key={reply.value}
                      type="button"
                      onClick={() => {
                        if (reply.value === "__other_city__") {
                          setShowCityInput(true);
                          setInput("");
                          return;
                        }

                        if (isGoalStep) {
                          setSelectedGoals((current) => {
                            if (current.includes(reply.value)) {
                              return current.filter((item) => item !== reply.value);
                            }

                            if (current.length >= 4) {
                              return current;
                            }

                            return [...current, reply.value];
                          });
                          return;
                        }

                        void send(reply.value, getVisibleLabel(reply));
                      }}
                      disabled={loading}
                      className={`inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 text-[15px] font-semibold leading-none shadow-[0_7px_18px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 disabled:opacity-50 sm:text-base ${
                        selected
                          ? "border-[#216f61] bg-[#216f61] text-white"
                          : "border-[#dfe4dc] bg-[#fffdfa] text-slate-950 hover:border-[#216f61] hover:bg-[#f4fbf7] hover:text-[#216f61]"
                      }`}
                    >
                      {selected ? <CheckCircle2 className="size-4" aria-hidden="true" /> : null}
                      {getVisibleLabel(reply)}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {isGoalStep ? (
              <button
                type="button"
                onClick={() => void send(selectedGoals.join(", "), selectedGoals.join(", "))}
                disabled={loading || selectedGoals.length === 0}
                className="mb-4 inline-flex h-11 items-center justify-center rounded-full bg-[#216f61] px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(33,111,97,0.24)] disabled:opacity-50"
              >
                Confirm {selectedGoals.length}/4
              </button>
            ) : null}

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder={
                  completed
                    ? text.useChipsPlaceholder
                    : activeStep === 0
                      ? text.moodPlaceholder
                      : showCityInput
                        ? "Type your city"
                      : text.customPlaceholder
                }
                disabled={(completed || isGoalStep) && !showCityInput}
                className="h-12 min-w-0 flex-1 rounded-full border border-[#dfe4dc] bg-[#fffdfa] px-4 text-[15px] font-medium shadow-inner placeholder:text-slate-400 disabled:opacity-60 sm:text-sm"
              />
              <button
                type="button"
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={completed || isGoalStep}
                className={`inline-flex size-12 items-center justify-center rounded-full border ${
                  isListening
                    ? "bg-rose-50 text-rose-700"
                    : "bg-[#fffdfa] text-slate-900"
                } disabled:opacity-60`}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? (
                  <Square className="size-4" aria-hidden="true" />
                ) : (
                  <Mic className="size-4" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void send()}
                disabled={
                  loading || completed || isGoalStep || !input.trim()
                }
                className="inline-flex size-12 items-center justify-center rounded-full bg-[#216f61] text-white shadow-[0_10px_20px_rgba(33,111,97,0.24)] disabled:opacity-50"
                aria-label="Send answer"
              >
                <Send className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
      </section>
    </div>
  );
}
