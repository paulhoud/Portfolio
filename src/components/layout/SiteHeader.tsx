"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "@/i18n/context";
import { useMotionPaused } from "@/lib/motionPause";
import { initSound, useSoundOn } from "@/lib/sound/sound";
import { lockPageScroll } from "@/lib/scrollLock";
import { cn } from "@/lib/utils";
import { LanguageFlags } from "./LanguageFlags";
import { LogoMark } from "./LogoMark";
import { SocialLinks } from "./SocialLinks";

/** Écart vertical entre les centres des trois barres : 2 px de trait + 6 px de gouttière. */
const BAR_OFFSET = 8;

/** En deçà, le header reste affiché : on est encore en haut de page. */
const ALWAYS_VISIBLE_UNTIL_PX = 80;

/** Déplacement minimal avant de masquer ou de réafficher, pour ignorer les micro-défilements. */
const SCROLL_DELTA_PX = 6;

/**
 * Après une navigation, temps pendant lequel le défilement ne masque pas le
 * header : il couvre la restauration de la position de la grille
 * (`useScrollMemory`), qui sinon passerait pour un défilement vers le bas.
 */
const SETTLE_AFTER_NAVIGATION_MS = 450;

/** Largeur à partir de laquelle le header complet remplace le menu. */
const DESKTOP_QUERY = "(min-width: 1024px)";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Header flottant du site, qui remplace l'ancienne barre latérale.
 *
 * Une capsule de verre dépoli, décollée des bords de l'écran : la scène 3D
 * reste visible tout autour. Un fin contour lumineux, qu'un reflet balaie de
 * temps en temps, prend une pointe de la couleur du projet affiché sur
 * l'accueil (`--accent-glow`) ; au survol, un halo suit la souris.
 *
 * Il se superpose au contenu au lieu de lui réserver une colonne : la grille de
 * l'accueil occupe ainsi tout l'écran. Sur les pages de lecture, il se masque
 * quand on descend et revient dès qu'on remonte, et reste visible en haut de
 * page, menu ouvert, ou quand le focus clavier y entre. Sur l'accueil, le
 * défilement sert à voyager entre les projets, pas à lire : il reste affiché,
 * sans aller-retour qui distrairait de la scène.
 *
 * - Grand écran (≥ 1024 px) : logo à gauche, liens au centre, réseaux et
 *   langues à droite.
 * - En dessous : logo et bouton menu ; le menu déroule les liens (accueil
 *   compris), les réseaux et les langues, sur un voile qui assombrit la page.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollRef = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const isOpenRef = useRef(false);
  const settleUntilRef = useRef(0);

  const navigation = [
    { href: "/method", label: t.site.nav.method },
    { href: "/about", label: t.site.nav.about },
    { href: "/contact", label: t.site.nav.contact },
  ];
  const mobileNavigation = [{ href: "/", label: t.site.nav.home }, ...navigation];

  const close = () => setIsOpen(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Masquage au défilement : caché en descendant, réaffiché en remontant.
  useEffect(() => {
    lastScrollRef.current = window.scrollY;
    let lastPath = window.location.pathname;

    const onScroll = () => {
      // Le premier défilement après une navigation ouvre une courte fenêtre où
      // l'on ne fait que recaler la référence (voir SETTLE_AFTER_NAVIGATION_MS).
      // L'adresse est lue ici plutôt que dans un effet React : la position de
      // la grille est restaurée avant que les effets ne s'exécutent.
      const path = window.location.pathname;
      if (path !== lastPath) {
        lastPath = path;
        settleUntilRef.current = performance.now() + SETTLE_AFTER_NAVIGATION_MS;
      }

      const y = window.scrollY;
      const delta = y - lastScrollRef.current;

      // Menu ouvert, navigation en cours ou focus clavier dans le header : on
      // suit la position sans rien masquer. Un lien focalisé ne doit jamais
      // sortir de l'écran.
      const focusInside = headerRef.current?.contains(document.activeElement) ?? false;
      if (isOpenRef.current || focusInside || performance.now() < settleUntilRef.current) {
        lastScrollRef.current = y;
        if (focusInside) setIsHidden(false);
        return;
      }

      if (y < ALWAYS_VISIBLE_UNTIL_PX) {
        setIsHidden(false);
        lastScrollRef.current = y;
      } else if (Math.abs(delta) >= SCROLL_DELTA_PX) {
        setIsHidden(delta > 0);
        lastScrollRef.current = y;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu ouvert : fermeture à la touche Échap, défilement de l'arrière-plan
  // verrouillé tant que le menu recouvre la page, et fermeture si la fenêtre
  // passe en grand écran (tablette tournée, par exemple) : le menu y est
  // masqué, il resterait sinon ouvert et bloquerait la page sans moyen visible
  // de le fermer.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };
    desktop.addEventListener("change", onBreakpoint);

    const unlockScroll = lockPageScroll();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
      unlockScroll();
    };
  }, [isOpen]);

  // Un changement de route referme le menu et réaffiche le header, y compris
  // quand il ne vient pas d'un clic dans le menu (retour du navigateur, par
  // exemple). Ajustement pendant le rendu plutôt que dans un effet : appliqué
  // avant la peinture, sans rendu intermédiaire.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setIsOpen(false);
    setIsHidden(false);
  }

  const visible = isOpen || !isHidden || pathname === "/";
  const barTransition = { duration: reduceMotion ? 0 : 0.28, ease };
  const [motionPaused] = useMotionPaused();

  // Halo qui suit la souris dans la capsule (sans rendu React à chaque pas).
  const onCapsulePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
  };

  return (
    <>
      <motion.header
        ref={headerRef}
        // Un lien atteint au clavier ne doit jamais rester hors de l'écran.
        onFocusCapture={() => setIsHidden(false)}
        initial={false}
        animate={{ y: visible ? 0 : "-120%" }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease }}
        // Seule la capsule capte les clics : autour, on atteint la scène.
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[var(--header-height)] text-white"
      >
        <div
          onPointerMove={onCapsulePointer}
          className={cn(
            "group/capsule pointer-events-auto absolute inset-x-3 bottom-0 top-2 overflow-hidden rounded-full lg:inset-x-6 lg:top-3",
            "border bg-[#121118]/55 backdrop-blur-xl backdrop-saturate-150",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_14px_40px_-18px_rgba(0,0,0,0.8)] transition-[border-color] duration-700",
            "[border-color:color-mix(in_srgb,var(--accent-glow,#ffffff)_16%,rgba(255,255,255,0.08))]",
          )}
        >
          {/* Halo de la souris, reflet du contour, et lisière éclairée en bas. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/capsule:opacity-100 [background:radial-gradient(180px_circle_at_var(--spot-x,50%)_50%,rgba(255,255,255,0.08),transparent_70%)]"
          />
          {!motionPaused ? <span aria-hidden="true" className="capsule-sweep" /> : null}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[22%] bottom-0 h-px opacity-70 transition-colors duration-700 [background:linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent-glow,#ffffff)_55%,white),transparent)]"
          />
          <div className="relative flex h-full items-center justify-between pl-4 pr-2 lg:pl-5 lg:pr-4">
            {/* Le logo garde sa taille de dessin (61 × 70) et son effet au
                survol ; il est seulement réduit à l'affichage. */}
            <div className="relative h-[36px] w-[32px] shrink-0 lg:h-[42px] lg:w-[37px]">
              <LogoMark className="absolute left-0 top-0 origin-top-left scale-[0.52] lg:scale-[0.6]" />
            </div>

            <nav
              aria-label={t.site.nav.main}
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
            >
              {navigation.map((item) => (
                <HeaderNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>

            <div className="hidden items-center gap-6 lg:flex">
              <SocialLinks />
              <span aria-hidden="true" className="h-5 w-px bg-white/15" />
              <LanguageFlags />
              <span aria-hidden="true" className="h-5 w-px bg-white/15" />
              <SoundToggle />
              <MotionToggle />
            </div>

            <button
              type="button"
              aria-label={isOpen ? t.site.nav.closeMenu : t.site.nav.openMenu}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsOpen((current) => !current)}
              className="relative flex h-11 w-11 flex-col items-center justify-center gap-1.5 lg:hidden"
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
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isOpen ? (
          <>
            {/* Voile entre le menu et la page : assombrit le contenu et
                referme le menu au clic (clic « en dehors »). Voile et menu
                passent au-dessus des boutons flottants (retour, haut de
                page, en z-40), mais restent sous le header (z-50). */}
            <motion.button
              type="button"
              aria-label={t.site.nav.closeMenu}
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
              className="fixed inset-0 z-[41] h-full w-full cursor-default bg-black/60 backdrop-blur-[2px] lg:hidden"
            />

            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
              className="fixed inset-x-3 top-[calc(var(--header-height)+0.5rem)] z-[45] rounded-3xl border border-white/10 bg-[#121118]/90 px-6 py-8 shadow-2xl backdrop-blur-xl lg:hidden"
            >
              <nav aria-label={t.site.nav.mobile} className="flex flex-col gap-5">
                {mobileNavigation.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      aria-current={isActive ? "page" : undefined}
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
                {/* Réglages côte à côte, sans l'espacement des blocs. */}
                <div className="flex flex-col">
                  <SoundToggle labelled />
                  <MotionToggle labelled />
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/**
 * Lien du header grand écran : une pastille de verre s'allume au survol ; la
 * page active garde la sienne, en gras, avec un trait de lumière dessous.
 */
function HeaderNavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative rounded-full px-4 py-1.5 text-[0.8rem] uppercase tracking-[0.06em] transition-[color,background-color,box-shadow] duration-300",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/50",
        isActive
          ? "bg-white/[0.08] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]"
          : "font-medium text-white/75 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0.5 left-1/2 h-px w-5 -translate-x-1/2 rounded-full transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "[background-color:color-mix(in_srgb,var(--accent-glow,#ffffff)_70%,white)] shadow-[0_0_6px_var(--accent-glow,#ffffff)]",
          isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100",
        )}
      />
    </Link>
  );
}

/**
 * Met en pause les animations automatiques (tuiles, logos, séquences
 * d'arrivée) et mémorise le choix. Icône seule dans le header, icône et
 * libellé dans le menu mobile.
 */
/**
 * Musique d'ambiance et effets sonores : actifs par défaut (ils ne démarrent
 * qu'au premier clic, comme l'exigent les navigateurs), coupés d'un geste et
 * mémorisés. Même principe que la pause : libellé fixe, état par aria-pressed.
 */
function SoundToggle({ labelled = false }: { labelled?: boolean }) {
  const { t } = useTranslation();
  const [on, toggle] = useSoundOn();
  useEffect(() => initSound(), []);
  const label = t.site.sound.mute;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!on}
      aria-label={labelled ? undefined : label}
      title={labelled ? undefined : on ? label : t.site.sound.unmute}
      className={cn(
        "flex items-center gap-3 transition-colors duration-300 hover:text-white",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white/50",
        on ? "text-white/60" : "text-white",
        labelled ? "min-h-11 text-sm" : "-mx-1.5 h-11 w-11 justify-center",
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z" fill="currentColor" stroke="none" />
        {on ? (
          <>
            <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
            <path d="M18 6.8a7.4 7.4 0 0 1 0 10.4" />
          </>
        ) : (
          <path d="M16 9.5l5 5m0-5l-5 5" />
        )}
      </svg>
      {labelled ? <span>{label}</span> : null}
    </button>
  );
}

function MotionToggle({ labelled = false }: { labelled?: boolean }) {
  const { t } = useTranslation();
  const [paused, toggle] = useMotionPaused();
  // Libellé fixe : l'état (en pause ou non) est porté par aria-pressed, et
  // l'icône bascule entre pause et lecture.
  const label = t.site.motion.pause;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      aria-label={labelled ? undefined : label}
      title={labelled ? undefined : paused ? t.site.motion.resume : label}
      className={cn(
        "flex items-center gap-3 transition-colors duration-300 hover:text-white",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white/50",
        paused ? "text-white" : "text-white/60",
        labelled ? "min-h-11 text-sm" : "-mx-1.5 h-11 w-11 justify-center",
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
        {paused ? <path d="M8 5.5v13l10.5-6.5L8 5.5Z" /> : <path d="M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z" />}
      </svg>
      {labelled ? <span>{label}</span> : null}
    </button>
  );
}
