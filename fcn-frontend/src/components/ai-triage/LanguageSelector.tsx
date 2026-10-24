import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import { useSound } from "@/hooks/useSound";
import type { SupportedLanguage } from "@/types";

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  sample: string;
  buttonText: string;
}

const languages: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    region: "Global",
    sample: "Headache, cough, fever...",
    buttonText: "Continue in English"
  },
  {
    code: "am",
    name: "Amharic",
    nativeName: "አማርኛ",
    flag: "🇪🇹",
    region: "ኢትዮጵያ",
    sample: "ራስ ምታት፣ ትኩሳት፣ ሳል...",
    buttonText: "በአማርኛ ቀጥል"
  },
  {
    code: "om",
    name: "Oromo",
    nativeName: "Afaan Oromoo",
    flag: "🇪🇹",
    region: "Oromiyaa",
    sample: "Mataa dhukkubbi, ho'a...",
    buttonText: "Afaan Oromootiin Itti Fufi"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" }
  }
};

interface LanguageSelectorProps {
  onSelect: (language: SupportedLanguage) => void;
  defaultLanguage?: SupportedLanguage;
}

export const LanguageSelector = ({ onSelect, defaultLanguage }: LanguageSelectorProps) => {
  const [selected, setSelected] = useState<SupportedLanguage | null>(defaultLanguage || null);
  const shouldReduceMotion = useReducedMotion();
  const { playTransition, playSuccess } = useSound();

  const handleLanguageSelect = (code: SupportedLanguage) => {
    setSelected(code);
    playSuccess?.();
  };

  const handleContinue = () => {
    if (selected) {
      playTransition?.();
      onSelect(selected);
    }
  };

  const currentOption = languages.find((l) => l.code === selected);

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto flex w-full max-w-md flex-col items-center px-1 sm:px-0"
    >
      {/* Ambient Header Pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 dark:bg-teal-400/15 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 mb-2.5 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400 animate-pulse" />
        <span>Multi-Language AI Consultation</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white text-center">
        Select Consultation Language
      </h2>

      <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-5 sm:mb-6 leading-relaxed">
        Choose the language you feel most comfortable describing your symptoms in
      </p>

      {/* Language Options Stack (Mobile-First Ergonomic Stack) */}
      <div className="flex flex-col w-full gap-2.5 sm:gap-3">
        {languages.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <motion.button
              key={lang.code}
              variants={shouldReduceMotion ? undefined : cardVariants}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => handleLanguageSelect(lang.code)}
              className={clsx(
                "group relative flex items-center justify-between w-full p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 select-none cursor-pointer",
                isSelected
                  ? "border-teal-500 dark:border-teal-400 bg-gradient-to-r from-teal-500/[0.12] via-emerald-500/[0.08] to-transparent dark:from-teal-400/[0.18] dark:via-emerald-400/[0.1] shadow-[0_4px_20px_rgba(20,184,166,0.18)] ring-2 ring-teal-500/30"
                  : "border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/80 hover:border-teal-500/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 shadow-sm"
              )}
              aria-pressed={isSelected}
            >
              {/* Left Side: Flag Emblem + Typography Stack */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Responsive Flag Squircle */}
                <div
                  className={clsx(
                    "flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm transition-transform duration-200 group-hover:scale-105",
                    isSelected
                      ? "bg-teal-500/20 dark:bg-teal-400/25 ring-1 ring-teal-500/30"
                      : "bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10"
                  )}
                >
                  <span className="leading-none select-none">{lang.flag}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight font-sans">
                      {lang.nativeName}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                      {lang.name}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                    {lang.sample}
                  </p>
                </div>
              </div>

              {/* Right Side: Interactive Radio Spring Checkmark */}
              <div
                className={clsx(
                  "flex h-6 w-6 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ml-2.5",
                  isSelected
                    ? "border-teal-500 bg-teal-500 text-white shadow-sm shadow-teal-500/50 scale-105"
                    : "border-slate-300 dark:border-white/20 bg-transparent group-hover:border-teal-400"
                )}
              >
                {isSelected ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 20 }}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </motion.div>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-transparent" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="mt-5 sm:mt-6 w-full space-y-3">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={clsx(
            "group flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 px-6 font-bold text-sm sm:text-base text-white transition-all shadow-md select-none",
            selected
              ? "bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 shadow-teal-600/25 active:scale-[0.98] cursor-pointer"
              : "bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none"
          )}
        >
          <span>{currentOption ? `${currentOption.buttonText} →` : "Select a Language to Continue"}</span>
          {selected && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 text-center px-2">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Fast Care AI will strictly respond and assess in your chosen language</span>
        </div>
      </div>
    </motion.div>
  );
};
