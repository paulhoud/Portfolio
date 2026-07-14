"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import type { Locale } from "@/i18n/types";

const FLAG_INNER_RADIUS = "rounded-[3.5px]";
const FLAG_OUTER_RADIUS = "rounded-[5px]";
const FLAG_SIZE = "h-[19px] w-[27px]";

function FrenchFlagIcon() {
  return (
    <svg
      viewBox="0 0 63 45"
      aria-hidden="true"
      className={cn("block", FLAG_SIZE, FLAG_INNER_RADIUS)}
    >
      <rect width="63" height="45" rx="9" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M0 0H21V45H0V0Z" fill="#1A47B8" />
      <path fillRule="evenodd" clipRule="evenodd" d="M42 0H63V45H42V0Z" fill="#F93939" />
    </svg>
  );
}

function UsFlagIcon() {
  return (
    <svg
      viewBox="0 0 63 45"
      aria-hidden="true"
      className={cn("block", FLAG_SIZE, FLAG_INNER_RADIUS)}
    >
      <rect width="63" height="45" rx="9" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M0 0H27V21H0V0Z" fill="#1A47B8" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27 0V3H63V0H27ZM27 6V9H63V6H27ZM27 12V15H63V12H27ZM27 18V21H63V18H27ZM0 24V27H63V24H0ZM0 30V33H63V30H0ZM0 36V39H63V36H0ZM0 42V45H63V42H0Z"
        fill="#F93939"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 3V6H6V3H3ZM9 3V6H12V3H9ZM15 3V6H18V3H15ZM21 3V6H24V3H21ZM18 6V9H21V6H18ZM12 6V9H15V6H12ZM6 6V9H9V6H6ZM3 9V12H6V9H3ZM9 9V12H12V9H9ZM15 9V12H18V9H15ZM21 9V12H24V9H21ZM3 15V18H6V15H3ZM9 15V18H12V15H9ZM15 15V18H18V15H15ZM21 15V18H24V15H21ZM18 12V15H21V12H18ZM12 12V15H15V12H12ZM6 12V15H9V12H6Z"
        fill="white"
      />
    </svg>
  );
}

const flagIcons = {
  fr: FrenchFlagIcon,
  en: UsFlagIcon,
} as const;

const languages: { code: Locale; labelKey: "french" | "english" }[] = [
  { code: "fr", labelKey: "french" },
  { code: "en", labelKey: "english" },
];

export function LanguageFlags() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="flex items-center gap-3" aria-label={t.site.language.switchTo}>
      {languages.map((language) => {
        const isActive = locale === language.code;
        const FlagIcon = flagIcons[language.code];

        return (
          <button
            key={language.code}
            type="button"
            aria-label={`${t.site.language.switchTo} ${t.site.language[language.labelKey]}`}
            aria-pressed={isActive}
            onClick={() => setLocale(language.code)}
            className={cn(
              "block p-[1.5px] transition-opacity duration-300",
              FLAG_OUTER_RADIUS,
              isActive
                ? "border border-white opacity-100"
                : "border border-transparent opacity-70 hover:opacity-100",
            )}
          >
            <FlagIcon />
          </button>
        );
      })}
    </div>
  );
}
