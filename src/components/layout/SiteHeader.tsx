"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";
import { isHomePath, splitLocalePath } from "@/i18n/paths";
import { useFullscreen } from "@/lib/fullscreen";
import { initSound, setSoundVolume, useSoundOn, useSoundVolume } from "@/lib/sound/sound";
import { lockPageScroll } from "@/lib/scrollLock";
import { useTheme } from "@/lib/theme";
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

/** Pastille des réglages aux coins bas de l'écran : le verre de la capsule. */
const DOCK_PILL = cn(
  "pointer-events-auto flex h-11 items-center gap-1 rounded-full border px-1.5",
  "bg-glass/55 backdrop-blur-xl backdrop-saturate-150 transition-[border-color] duration-700",
  "shadow-[var(--glass-shadow)]",
  "[border-color:var(--glass-border)]",
);

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
 * - Grand écran (≥ 1024 px) : logo à gauche, liens au centre, réseaux à
 *   droite ; la langue, le son, le thème et le plein écran sont aux coins bas de l'écran
 *   (pastilles du même verre). Le rang est une grille à trois
 *   colonnes « 1fr auto 1fr » : les colonnes latérales sont égales tant qu'il
 *   y a la place (liens exactement au centre) et, quand la place manque, la
 *   colonne de droite garde sa largeur et les liens glissent vers le logo -
 *   jamais de chevauchement, sans point de rupture supplémentaire.
 * - Téléphone et tablette (demande de Paul, 28 oct. 2026) : plus de capsule,
 *   de contour ni de logo, seulement le nom et le métier à gauche (l'identité
 *   reste visible, et l'accueil ne la répète plus) et le bouton menu à droite,
 *   sur le fond même de la page, fondu en bas. Le menu déroule les liens (accueil
 *   compris), les réseaux et les réglages, sur un voile qui assombrit la page.
 *   Le son a aussi son bouton en bas à droite (cf. `SoundToggle` « quick »).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const { t, href } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollRef = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const isOpenRef = useRef(false);
  const settleUntilRef = useRef(0);

  const navigation = [
    { href: href("/method"), label: t.site.nav.method },
    { href: href("/about"), label: t.site.nav.about },
    { href: href("/contact"), label: t.site.nav.contact },
  ];
  const mobileNavigation = [{ href: href("/"), label: t.site.nav.home }, ...navigation];

  const close = () => setIsOpen(false);
  // Fermeture sans navigation (Échap, clic sur le voile) : le focus revient au
  // bouton du menu, sinon il tomberait sur la page avec le menu démonté.
  const dismiss = () => {
    setIsOpen(false);
    burgerRef.current?.focus();
  };

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
      if (event.key === "Escape") dismiss();
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

  const isHome = isHomePath(pathname);
  const visible = isOpen || !isHidden || isHome;
  const barTransition = { duration: reduceMotion ? 0 : 0.28, ease };

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
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[var(--header-height)] text-ink"
      >
        {/* Téléphone et tablette : le fond même de la page (comme le pied de
            page), qui se fond dans la page en bas, pour que le nom se lise
            sur le texte qui passe dessous. Il s'efface menu ouvert, le voile
            prenant le relais. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+1rem)] transition-opacity duration-300 [mask-image:linear-gradient(to_bottom,#000_calc(100%-1.5rem),transparent)] lg:hidden",
            isHome
              ? "bg-[var(--stage)]"
              : splitLocalePath(pathname).path.startsWith("/projects/")
                ? "bg-page"
                : "[background:var(--reading-surface)_fixed]",
            isOpen && "opacity-0",
          )}
        />
        <div
          onPointerMove={onCapsulePointer}
          className={cn(
            "group/capsule pointer-events-auto absolute inset-x-0 bottom-0 top-0 lg:inset-x-6 lg:top-3 lg:overflow-hidden lg:rounded-full",
            "lg:border lg:bg-glass/55 lg:backdrop-blur-xl lg:backdrop-saturate-150",
            "lg:shadow-[var(--glass-shadow)] lg:transition-[border-color] lg:duration-700",
            "lg:[border-color:var(--glass-border)]",
          )}
        >
          {/* Halo de la souris, reflet du contour et lisière éclairée en bas.
              Tout reste dans la capsule, lignes du logo comprises. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-full lg:block">
            <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/capsule:opacity-100 [background:radial-gradient(180px_circle_at_var(--spot-x,50%)_50%,color-mix(in_srgb,var(--ink)_8%,transparent),transparent_70%)]" />
            <span className="capsule-sweep" />
            <span className="absolute inset-x-[22%] bottom-0 h-px opacity-70 transition-colors duration-700 [background:linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent-glow,#ffffff)_55%,white),transparent)]" />
          </div>

          {/* Rang en grille « 1fr auto 1fr » sur grand écran (cf. doc du
              composant) ; en dessous, le nom et le bouton menu aux deux bouts. */}
          <div className="relative flex h-full items-center justify-between pl-5 pr-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6 lg:pl-6">
            {/* Le logo garde sa taille de dessin (61 × 70) et son effet au
                survol ; il est seulement réduit à l'affichage, assez pour
                garder de l'air jusqu'aux bouts arrondis de la capsule. */}
            <div className="relative hidden h-[36px] w-[32px] shrink-0 lg:block lg:justify-self-start">
              <LogoMark className="absolute left-0 top-0 origin-top-left scale-[0.52] rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60" />
            </div>

            {/* Téléphone et tablette : le nom et le métier, qui ramènent à
                l'accueil comme le logo (et, déjà sur l'accueil, au premier
                projet, cf. homeReset). */}
            <Link
              href={href("/")}
              className="min-w-0 rounded-lg leading-tight text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink/60 lg:hidden"
            >
              <span className="block truncate text-lg font-medium tracking-[0.02em]">{profile.name}</span>
              <span className="mt-0.5 block text-[0.625rem] font-bold uppercase tracking-[0.24em] text-ink/60 light:text-ink/75">
                {profile.jobTitle}
              </span>
            </Link>

            <nav aria-label={t.site.nav.main} className="hidden items-center gap-1 lg:flex lg:justify-self-center">
              {navigation.map((item) => (
                <HeaderNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>

            {/* Les réseaux ; langue et réglages sont aux coins bas de l'écran. */}
            <div className="hidden lg:flex lg:justify-self-end">
              <SocialLinks />
            </div>

            {/* Téléphone et tablette : le menu ; le son est en bas à droite. */}
            <div className="flex shrink-0 items-center lg:hidden">
              <button
                ref={burgerRef}
                type="button"
                aria-label={isOpen ? t.site.nav.closeMenu : t.site.nav.openMenu}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
                onClick={() => setIsOpen((current) => !current)}
                className="relative flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-full focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-ink/70"
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
        </div>
      </motion.header>

      {/* Grand écran : les réglages quittent la capsule pour les coins bas de
          l'écran, dans deux petites pastilles du même verre - la langue à
          gauche, le son, le thème et le plein écran à droite. En dessous, ils
          sont dans le menu. */}
      <div className="pointer-events-none fixed inset-x-6 bottom-6 z-40 hidden items-end justify-between text-ink lg:flex">
        <div className={cn(DOCK_PILL, "px-3")}>
          <LanguageFlags />
        </div>
        <div className={DOCK_PILL}>
          <SoundToggle />
          <ThemeToggle />
          <FullscreenToggle />
        </div>
      </div>

      {/* Téléphone et tablette : le son d'un toucher, en bas à droite (le
          bouton « haut de page » se range au-dessus). Sur l'accueil, il est
          à côté de « Voir le projet » (cf. GalleryHome). */}
      {isHome ? null : (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-6 z-40 lg:hidden">
          <SoundToggle variant="quick" />
        </div>
      )}

      <AnimatePresence>
        {isOpen ? (
          <>
            {/* Voile entre le menu et la page : assombrit le contenu et
                referme le menu au clic (clic « en dehors »). Voile et menu
                passent au-dessus des boutons flottants (retour, haut de
                page, en z-40), mais restent sous le header (z-50). */}
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label={t.site.nav.closeMenu}
              onClick={dismiss}
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
              // Jamais plus haut que l'écran : le panneau défile de lui-même
              // si la place manque (la page, elle, est verrouillée).
              className="fixed inset-x-3 top-[calc(var(--header-height)+0.5rem)] z-[45] max-h-[calc(100svh-var(--header-height)-1.25rem)] overflow-y-auto rounded-3xl border border-ink/10 bg-glass/90 p-3 shadow-2xl backdrop-blur-xl lg:hidden"
            >
              {/* Écran bas (téléphone en paysage) : liens à gauche, réseaux et
                  réglages à droite, pour que tout tienne sans défiler. */}
              <div className="[@media(max-height:520px)]:grid [@media(max-height:520px)]:grid-cols-2 [@media(max-height:520px)]:gap-x-3">
                <nav aria-label={t.site.nav.mobile} className="flex flex-col">
                  {mobileNavigation.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "relative flex min-h-11 items-center rounded-2xl px-3 text-base uppercase tracking-[0.04em] transition-colors",
                          "focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-ink/60",
                          isActive ? "bg-ink/[0.08] font-bold text-ink" : "font-medium text-ink/75 active:bg-ink/[0.06]",
                        )}
                      >
                        {isActive ? (
                          // Même repère que la liste des projets : un trait à la couleur d'accent.
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full [background-color:var(--accent-glow,#ffffff)] [box-shadow:0_0_8px_var(--accent-glow,#ffffff)]"
                          />
                        ) : null}
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-2 border-t border-ink/10 pt-2 [@media(max-height:520px)]:mt-0 [@media(max-height:520px)]:border-l [@media(max-height:520px)]:border-t-0 [@media(max-height:520px)]:pl-3 [@media(max-height:520px)]:pt-0">
                  <div className="flex min-h-11 items-center justify-between px-3">
                    <SocialLinks />
                    <LanguageFlags />
                  </div>
                  <SoundToggle variant="labelled" />
                  <ThemeToggle labelled />
                  <FullscreenToggle labelled />
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
 * page active garde la sienne, en gras, avec un trait de lumière dessous -
 * réservé à elle, pour qu'un lien survolé ne se confonde pas avec elle.
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
        "group relative rounded-full px-4 py-1.5 text-[0.8125rem] uppercase tracking-[0.06em] transition-[color,background-color,box-shadow] duration-300",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/50",
        isActive
          ? "bg-ink/[0.08] font-bold text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]"
          : "font-medium text-ink/75 hover:bg-ink/[0.06] hover:text-ink",
      )}
    >
      {label}
      {isActive ? (
        <span
          aria-hidden="true"
          className="absolute bottom-0.5 left-1/2 h-px w-5 -translate-x-1/2 rounded-full [background-color:color-mix(in_srgb,var(--accent-glow,var(--ink))_70%,var(--ink))] shadow-[0_0_6px_var(--accent-glow,#ffffff)]"
        />
      ) : null}
    </Link>
  );
}

/**
 * Apparence commune des deux réglages (son, pause). Dans la capsule : icône
 * seule dans une zone de clic ronde, même repos et même survol que les icônes
 * de réseaux ; enfoncé (son coupé, animations en pause), la pastille de verre
 * de la page active. Dans le menu mobile : rangée avec icône et libellé.
 */
function toggleClasses(labelled: boolean, pressed: boolean) {
  return cn(
    "flex cursor-pointer items-center gap-3 transition-colors duration-300 hover:text-ink",
    "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/50",
    labelled
      ? cn("min-h-11 rounded-2xl px-3 text-sm", pressed ? "text-ink" : "text-ink/70")
      : cn(
          "h-8 w-8 justify-center rounded-full hover:bg-ink/[0.06]",
          pressed ? "bg-ink/[0.08] text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]" : "text-ink/50",
        ),
  );
}

/**
 * Musique d'ambiance et effets sonores : coupés par défaut, activés d'un
 * geste et mémorisés. Un interrupteur (« Son », activé ou coupé) : l'icône
 * le dit (ondes ou croix), le menu l'écrit en toutes lettres.
 * - `icon` : pastille du bas de l'écran (ordinateur) ;
 * - `quick` : bouton de verre en bas à droite (téléphone, tablette), à côté
 *   de « Voir le projet » sur l'accueil ;
 * - `labelled` : ligne du menu, avec son état écrit.
 * Tous lisent et changent le même réglage (`useSoundOn`) : ils montrent
 * toujours le même état.
 */
/**
 * Curseur de volume : à côté du haut-parleur dans la pastille du bas (il se
 * déplie au survol ou au clavier), sous l'interrupteur dans le menu mobile.
 * Le monter réactive le son s'il était coupé.
 */
function VolumeSlider({ className }: { className?: string }) {
  const { t } = useTranslation();
  const volume = useSoundVolume();
  const [on] = useSoundOn();
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={on ? Math.round(volume * 100) : 0}
      onChange={(event) => setSoundVolume(Number(event.target.value) / 100)}
      aria-label={t.site.sound.volume}
      aria-valuetext={`${Math.round((on ? volume : 0) * 100)} %`}
      className={cn("h-1 cursor-pointer accent-[var(--ink)]", className)}
    />
  );
}

export function SoundToggle({ variant = "icon" }: { variant?: "icon" | "quick" | "labelled" }) {
  const { t } = useTranslation();
  const [on, toggle] = useSoundOn();
  useEffect(() => initSound(), []);
  const labelled = variant === "labelled";

  // Pastille du bas (ordinateur) : le curseur se déplie à gauche du bouton.
  if (variant === "icon") {
    return (
      <div className="group/volume flex items-center">
        <div className="w-0 overflow-hidden opacity-0 transition-[width,opacity] duration-300 group-hover/volume:w-24 group-hover/volume:opacity-100 group-focus-within/volume:w-24 group-focus-within/volume:opacity-100">
          <VolumeSlider className="ml-2 mr-1 w-[5.5rem]" />
        </div>
        <SoundSwitch variant={variant} on={on} toggle={toggle} />
      </div>
    );
  }
  if (labelled) {
    return (
      <div>
        <SoundSwitch variant={variant} on={on} toggle={toggle} />
        <div className="flex items-center gap-3 px-3 pb-2">
          <span className="text-xs text-ink/65">{t.site.sound.volume}</span>
          <VolumeSlider className="w-full" />
        </div>
      </div>
    );
  }
  return <SoundSwitch variant={variant} on={on} toggle={toggle} />;
}

function SoundSwitch({ variant, on, toggle }: { variant: "icon" | "quick" | "labelled"; on: boolean; toggle: () => void }) {
  const { t } = useTranslation();
  const labelled = variant === "labelled";

  return (
    <button
      type="button"
      role="switch"
      onClick={toggle}
      aria-checked={on}
      aria-label={labelled ? undefined : t.site.sound.label}
      title={labelled ? undefined : on ? t.site.sound.mute : t.site.sound.unmute}
      className={
        variant === "quick"
          ? cn(
              // Le verre des pastilles du bas (cf. DOCK_PILL), en rond.
              "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border transition-colors duration-300",
              "bg-glass/55 shadow-[var(--glass-shadow)] backdrop-blur-xl backdrop-saturate-150 [border-color:var(--glass-border)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/60",
              on ? "text-ink" : "text-ink/70",
            )
          : cn(toggleClasses(labelled, on), labelled && "w-full")
      }
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("shrink-0", variant === "quick" ? "h-5 w-5" : "h-4 w-4")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      {labelled ? (
        <>
          <span>{t.site.sound.label}</span>
          {/* L'état en toutes lettres, et un petit interrupteur. */}
          <span className="ml-auto flex items-center gap-2 text-xs text-ink/60">
            {on ? t.site.sound.on : t.site.sound.off}
            <span
              aria-hidden="true"
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors duration-300",
                on ? "[background-color:color-mix(in_srgb,var(--accent-glow,var(--ink))_70%,var(--ink))]" : "bg-ink/15",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] duration-300",
                  on ? "left-[18px]" : "left-0.5",
                )}
              />
            </span>
          </span>
        </>
      ) : null}
    </button>
  );
}

/**
 * Thème clair ou sombre du site (cf. src/lib/theme.ts). Un interrupteur
 * « Thème clair » : enfoncé en thème clair, l'icône passe de la lune au soleil.
 */
function ThemeToggle({ labelled = false }: { labelled?: boolean }) {
  const { t } = useTranslation();
  const [theme, toggle] = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      role="switch"
      onClick={toggle}
      aria-checked={light}
      aria-label={labelled ? undefined : t.site.theme.label}
      title={labelled ? undefined : light ? t.site.theme.toDark : t.site.theme.toLight}
      className={cn(toggleClasses(labelled, light), labelled && "w-full")}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {light ? (
          <>
            <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
          </>
        ) : (
          <path d="M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.8 7.8 0 1 0 10.1 10.1Z" fill="currentColor" stroke="none" />
        )}
      </svg>
      {labelled ? <span>{t.site.theme.label}</span> : null}
    </button>
  );
}

/**
 * Plein écran (cf. src/lib/fullscreen.ts). Un interrupteur, enfoncé en plein
 * écran : les coins de l'icône s'ouvrent ou se rentrent (tracés Lucide
 * « maximize » et « minimize »). Absent là où le navigateur ne le permet pas.
 */
function FullscreenToggle({ labelled = false }: { labelled?: boolean }) {
  const { t } = useTranslation();
  const [supported, active, toggle] = useFullscreen();
  if (!supported) return null;

  return (
    <button
      type="button"
      role="switch"
      onClick={toggle}
      aria-checked={active}
      aria-label={labelled ? undefined : t.site.fullscreen.label}
      title={labelled ? undefined : active ? t.site.fullscreen.exit : t.site.fullscreen.enter}
      className={cn(toggleClasses(labelled, active), labelled && "w-full")}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
        ) : (
          <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
        )}
      </svg>
      {labelled ? <span>{t.site.fullscreen.label}</span> : null}
    </button>
  );
}
