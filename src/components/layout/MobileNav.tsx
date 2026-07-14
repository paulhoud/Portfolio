"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { LanguageFlags } from "./LanguageFlags";
import { LogoMark } from "./LogoMark";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { href: "/", label: t.site.nav.home },
    { href: "/method", label: t.site.nav.method },
    { href: "/about", label: t.site.nav.about },
    { href: "/contact", label: t.site.nav.contact },
  ];

  return (
    <div className="md:hidden">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center justify-between bg-[#17161d]/95 px-5 backdrop-blur">
        <LogoMark className="origin-left scale-[0.58]" />
        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 text-white"
        >
          <span className="h-0.5 w-7 rounded-full bg-current" />
          <span className="h-0.5 w-7 rounded-full bg-current" />
          <span className="h-0.5 w-7 rounded-full bg-current" />
        </button>
      </header>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-x-0 top-[72px] z-40 border-t border-white/10 bg-[#17161d]/98 px-6 py-8 shadow-2xl backdrop-blur"
          >
            <nav aria-label={t.site.nav.mobile} className="flex flex-col gap-5">
              {navigation.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-lg uppercase tracking-[0.03em] transition-colors",
                      isActive ? "font-bold text-white" : "font-medium text-white/80",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 border-t border-white/10 pt-6">
              <LanguageFlags />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
