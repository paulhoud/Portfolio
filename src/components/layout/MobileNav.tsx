"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { LanguageFlags } from "./LanguageFlags";
import { LogoMark } from "./LogoMark";
import { SocialLinks } from "./SocialLinks";

/** Écart vertical entre les centres des trois barres : 2 px de trait + 6 px de gouttière. */
const BAR_OFFSET = 8;

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { href: "/", label: t.site.nav.home },
    { href: "/method", label: t.site.nav.method },
    { href: "/about", label: t.site.nav.about },
    { href: "/contact", label: t.site.nav.contact },
  ];

  const close = () => setIsOpen(false);

  // Fermeture à la touche Échap + verrouillage du défilement de l'arrière-plan
  // tant que le menu recouvre la page.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Un changement de route referme le menu, y compris lorsqu'il ne vient pas
  // d'un clic sur un lien du menu (retour du navigateur, par exemple).
  // Ajustement pendant le rendu plutôt que dans un effet : la fermeture est
  // appliquée avant la peinture, sans rendu intermédiaire menu ouvert.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setIsOpen(false);
  }

  const barTransition = { duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="md:hidden">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center justify-between bg-[#17161d]/95 px-5 backdrop-blur">
        <LogoMark className="origin-left scale-[0.58]" />
        <button
          type="button"
          aria-label={isOpen ? t.site.nav.closeMenu : t.site.nav.openMenu}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsOpen((current) => !current)}
          className="relative z-10 flex h-11 w-11 flex-col items-center justify-center gap-1.5 text-white"
        >
          {/* Les deux barres extrêmes convergent vers le centre en pivotant,
              la barre médiane s'efface : le burger devient une croix. */}
          <motion.span
            className="h-0.5 w-7 origin-center rounded-full bg-current"
            animate={isOpen ? { rotate: 45, y: BAR_OFFSET } : { rotate: 0, y: 0 }}
            transition={barTransition}
          />
          <motion.span
            className="h-0.5 w-7 origin-center rounded-full bg-current"
            animate={isOpen ? { opacity: 0, scaleX: 0.4 } : { opacity: 1, scaleX: 1 }}
            transition={barTransition}
          />
          <motion.span
            className="h-0.5 w-7 origin-center rounded-full bg-current"
            animate={isOpen ? { rotate: -45, y: -BAR_OFFSET } : { rotate: 0, y: 0 }}
            transition={barTransition}
          />
        </button>
      </header>

      <AnimatePresence>
        {isOpen ? (
          <>
            {/* Calque sombre entre le menu et le contenu : assombrit les cartes
                du damier et referme le menu au clic (clic « en dehors »). */}
            <motion.button
              type="button"
              aria-label={t.site.nav.closeMenu}
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
              className="fixed inset-0 z-30 h-full w-full cursor-default bg-black/60 backdrop-blur-[2px]"
            />

            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
              className="fixed inset-x-0 top-[72px] z-40 border-t border-white/10 bg-[#17161d]/98 px-6 py-8 shadow-2xl backdrop-blur"
            >
              <nav aria-label={t.site.nav.mobile} className="flex flex-col gap-5">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
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
              <div className="mt-8 space-y-5 border-t border-white/10 pt-6">
                <SocialLinks />
                <LanguageFlags />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
