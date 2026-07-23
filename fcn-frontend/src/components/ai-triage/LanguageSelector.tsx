import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { useSound } from "@/hooks/useSound";
import type { SupportedLanguage } from "@/types";

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  subtitle: string;
  buttonText: string;
}

const languages: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    subtitle: "English",
    buttonText: "Continue in English →"
  },
  {
    code: "am",
    name: "Amharic",
    nativeName: "አማርኛ",
    flag: "🇪🇹",
    subtitle: "Amharic",
    buttonText: "በአማርኛ ቀጥል →"
  },
  {
    code: "so",
    name: "Somali",
    nativeName: "Soomaali",
    flag: "🇸🇴",
    subtitle: "Somali",
    buttonText: "Ku sii wad Soomaali →"
  },
  {
    code: "om",
    name: "Oromo",
    nativeName: "Afaan Oromoo",
    flag: "🇪🇹",
    subtitle: "Oromo",
    buttonText: "Afaan Oromootiin itti fufi →"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
};

interface LanguageSelectorProps {
  onSelect: (language: SupportedLanguage) => void;
}

export const LanguageSelector = ({ onSelect }: LanguageSelectorProps) => {
  const [selected, setSelected] = useState<SupportedLanguage | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { playTransition } = useSound();

  const handleContinue = () => {
    if (selected) {
      playTransition();
      onSelect(selected);
    }
  };

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto flex w-full max-w-lg flex-col items-center"
    >
      <img
        src="/logo/fcn-logo-full.png"
        alt="FCN Logo"
        className="mb-6 h-20 w-auto"
      />

      <h1 className="mb-1 text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
        Choose Your Language
      </h1>
      <p className="mb-8 text-center text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
        English · አማርኛ · Soomaali · Afaan Oromoo
      </p>

      <div className="mb-6 grid w-full grid-cols-2 gap-3">
        {languages.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <motion.button
              key={lang.code}
              variants={shouldReduceMotion ? undefined : cardVariants}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.03, y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => setSelected(lang.code)}
              className={clsx(
                "relative flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all duration-200",
                isSelected
                  ? "border-fcn-accent bg-fcn-accent/10 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                  : "border-fcn-primary/10 bg-white/80 hover:border-fcn-primary/30 dark:bg-fcn-dark/70"
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-fcn-accent"
                >
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              )}

              <span className="text-3xl">{lang.flag}</span>
              <span className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                {lang.nativeName}
              </span>
              <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                {lang.subtitle}
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={false}
        animate={{
          height: selected ? "auto" : 0,
          opacity: selected ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="w-full overflow-hidden"
      >
        <button
          onClick={handleContinue}
          className="flex w-full items-center justify-center rounded-lg bg-fcn-primary py-3 font-medium text-white transition-all hover:shadow-[0_0_24px_rgba(10,126,164,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {selected
            ? languages.find((l) => l.code === selected)?.buttonText
            : "Continue"}
        </button>
      </motion.div>

      <p className="mt-4 text-center text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
        FCN's AI Health Assistant will respond entirely in your chosen language
      </p>
    </motion.div>
  );
};
