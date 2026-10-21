import { useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation, type Locale } from "@/i18n";
import { useClickOutside } from "@/hooks/useClickOutside";

const LANGUAGES: { code: Locale; name: string; nativeName: string; flag: string }[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", flag: "🇪🇹" },
  { code: "om", name: "Oromo", nativeName: "Afaan Oromoo", flag: "🇪🇹" },
];

interface LanguageSwitcherProps {
  className?: string;
  btnClassName?: string;
  variant?: "pill" | "icon" | "full" | "compact";
  short?: boolean;
}

export const LanguageSwitcher = ({
  className,
  btnClassName,
  variant = "pill",
  short = false,
}: LanguageSwitcherProps) => {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useClickOutside<HTMLDivElement>(() => {
    setIsOpen(false);
  });

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];
  const isCompact = variant === "compact" || short;

  return (
    <div ref={containerRef} className={clsx("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Select language. Current language: ${current.name}`}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-xl font-semibold transition-all duration-150 select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
          isCompact && "px-2 py-1 text-xs border",
          !isCompact && variant === "pill" && "px-2.5 py-1.5 text-xs border",
          variant === "icon" &&
            "p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-teal-400 dark:hover:bg-white/10",
          variant === "full" &&
            "w-full justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 text-xs",
          btnClassName
            ? btnClassName
            : (variant === "pill" || isCompact) &&
                "bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-200 border-slate-200/60 dark:border-white/10"
        )}
      >
        <span className="text-xs leading-none">{current.flag}</span>
        {isCompact ? (
          <span className="text-[11px] font-bold uppercase tracking-wider">{current.code}</span>
        ) : (
          <span className="truncate">{current.nativeName}</span>
        )}
        <ChevronDown
          className={clsx(
            "w-3 h-3 opacity-70 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Languages"
          className="absolute right-0 top-full mt-1.5 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.15)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            <span>Select Language</span>
          </div>

          <div className="space-y-0.5">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-all duration-150",
                    isSelected
                      ? "bg-teal-500/10 text-teal-700 font-bold dark:bg-teal-400/20 dark:text-teal-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{lang.nativeName}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">{lang.name}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
