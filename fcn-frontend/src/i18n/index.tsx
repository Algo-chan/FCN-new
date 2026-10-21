import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import en from "./translations/en";
import am from "./translations/am";
import om from "./translations/om";
import so from "./translations/so";

export type Locale = "en" | "am" | "om" | "so";

const dictionaries: Record<Locale, Record<string, string>> = { en, am, om, so };

const LS_LOCALE_KEY = "fcn_locale";

export type TranslateParams = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.split(`{${key}}`).join(String(value));
  }
  return result;
}

export const translate = (locale: Locale, key: string, params?: TranslateParams): string => {
  const dictionary = dictionaries[locale] ?? dictionaries.en;
  const template = dictionary[key] ?? dictionaries.en[key] ?? key;
  return interpolate(template, params);
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(LS_LOCALE_KEY);
      if (saved && (saved === "en" || saved === "am" || saved === "om")) {
        return saved as Locale;
      }
      return "en";
    } catch {
      return "en";
    }
  });

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale: (next) => {
      try {
        localStorage.setItem(LS_LOCALE_KEY, next);
      } catch {
        // storage unavailable (private mode) — still switch for this session
      }
      setLocaleState(next);
    },
    t: (key, params) => translate(locale, key, params)
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return ctx;
};
