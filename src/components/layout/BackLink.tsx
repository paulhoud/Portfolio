"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/context";

type BackLinkProps = {
  href?: string;
};

export function BackLink({ href = "/" }: BackLinkProps) {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      aria-label={t.site.common.back}
      className="group inline-flex h-12 w-12 items-center justify-center rounded-full text-white/35 transition hover:bg-white/5 hover:text-white"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}
