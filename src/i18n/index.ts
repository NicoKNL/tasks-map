import i18next from "i18next";
import en from "./locales/en.json";
import nl from "./locales/nl.json";
import zh from "./locales/zh-CN.json";

export type Language = "en" | "nl" | "zh-CN";

export const SUPPORTED_LANGUAGES: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands (Dutch)" },
  { value: "zh-CN", label: "简体中文 (Simplified Chinese)" },
];

const resources = {
  en: { translation: en },
  nl: { translation: nl },
  "zh-CN": { translation: zh },
};

export async function initI18n(language: Language = "en") {
  await i18next.init({
    lng: language,
    fallbackLng: "en",
    resources,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });
}

export function changeLanguage(language: Language) {
  i18next.changeLanguage(language);
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18next.t(key, options);
}

export default i18next;
