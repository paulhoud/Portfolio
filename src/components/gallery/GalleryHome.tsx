"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import { PassiveAnimationProvider } from "@/components/projects/PassiveAnimationProvider";
import { ProjectThumbnail } from "@/components/projects/ProjectThumbnail";
import type { Project } from "@/content/projects";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";
import { setHomeView } from "@/lib/homeView";
import { useMotionPaused } from "@/lib/motionPause";
import { readScrollMemory } from "@/lib/useScrollMemory";
import { cn } from "@/lib/utils";
import { OverviewSheet } from "./OverviewSheet";

const pad = (value: number) => String(value).padStart(2, "0");

/** Masque la barre d'une zone qui défile, sans retirer le défilement. */
const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * Accueil en galerie (étape 2 du concept « L'Accrochage », sans 3D).
 *
 * Une longue piste de défilement porte une scène collée à l'écran. Chaque
 * projet occupe une tranche de la piste (`--slot`) : on fait défiler
 * normalement, et le projet actif change à chaque tranche. La scène montre ce
 * projet dans un cadre (la tuile actuelle, animée au survol) avec son cartel.
 * Le cadre est l'emplacement où viendra la salle 3D.
 *
 * La scène fait exactement la hauteur de l'écran, quelle qu'elle soit : le
 * cadre se dimensionne sur la place qui reste, et la liste défile d'elle-même
 * si l'écran est trop bas. Aucun réglage n'est donc jamais hors d'atteinte.
 *
 * Tout est en HTML : nom, métier, présentation et liste numérotée des onze
 * liens restent lisibles par les lecteurs d'écran et les moteurs de recherche.
 */
export function GalleryHome({ projects }: { projects: Project[] }) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [motionPaused] = useMotionPaused();
  const calm = prefersReducedMotion || motionPaused;

  const trackRef = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  // Faux tant que la position de défilement (restaurée au retour d'un projet,
  // ou donnée par une ancre) n'a pas été lue : la scène reste alors invisible
  // plutôt que de montrer un instant le premier projet.
  const [synced, setSynced] = useState(false);
  // Vrai quand le projet change de plus d'un cran d'un coup (ancre, retour
  // d'un projet, saut dans la liste) : la bascule est alors instantanée.
  const [jumped, setJumped] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const count = projects.length;

  /** Hauteur d'une tranche, lue sur les ancres pour rester fidèle au CSS. */
  const slotHeight = useCallback(() => {
    const anchors = trackRef.current?.querySelectorAll<HTMLElement>("[data-slot]");
    if (!anchors || anchors.length < 2) return window.innerHeight * 0.35;
    return anchors[1].offsetTop - anchors[0].offsetTop;
  }, []);

  const trackTop = () => (trackRef.current ? trackRef.current.getBoundingClientRect().top + window.scrollY : 0);

  useEffect(() => {
    // Au retour d’un projet, la position de la grille est restaurée sur
    // quelques images : la scène attend d’y être (ou 450 ms au plus) pour se
    // montrer, plutôt que d’afficher un instant le premier projet.
    const pendingTarget = window.location.hash ? null : readScrollMemory("/");
    const startedAt = performance.now();
    const settled = () =>
      pendingTarget === null ||
      Math.abs(window.scrollY - pendingTarget) <= 2 ||
      performance.now() - startedAt > 450;

    const onScroll = () => {
      if (!trackRef.current) return;
      const index = Math.min(count - 1, Math.max(0, Math.round((window.scrollY - trackTop()) / slotHeight())));
      if (index !== activeRef.current) {
        setJumped(Math.abs(index - activeRef.current) > 1);
        activeRef.current = index;
        setActive(index);
        // La liste reste sous le curseur pendant le défilement : un survol en
        // cours ne doit pas figer la scène.
        setPreview(null);
      }
      if (settled()) setSynced(true);
    };

    // Une ancre #oeuvre-… dans l'adresse place directement sur son projet.
    const fromHash = window.location.hash.startsWith("#oeuvre-")
      ? projects.findIndex((item) => `#oeuvre-${item.slug}` === window.location.hash)
      : -1;
    if (fromHash >= 0) window.scrollTo({ top: trackTop() + fromHash * slotHeight() });

    onScroll();
    // Filet : si la restauration n’aboutit pas, la scène s’affiche quand même.
    const fallback = window.setTimeout(() => {
      onScroll();
      setSynced(true);
    }, 460);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count, projects, slotHeight]);

  const scrollToPiece = useCallback(
    (index: number) => {
      window.scrollTo({ top: trackTop() + index * slotHeight(), behavior: calm ? "auto" : "smooth" });
    },
    [calm, slotHeight],
  );

  // Au clavier, un lien de la liste qui reçoit le focus amène son projet en
  // scène. Au clic, on laisse simplement le lien s'ouvrir.
  const onLinkFocus = (index: number) => (event: FocusEvent<HTMLAnchorElement>) => {
    if (event.currentTarget.matches(":focus-visible")) scrollToPiece(index);
  };

  const closeOverview = useCallback(() => setOverviewOpen(false), []);
  const switchToGrid = () => {
    setHomeView("grid");
    window.scrollTo({ top: 0 });
  };

  const shown = preview ?? active;
  const project = projects[shown];
  const instant = calm || jumped;
  const fade = { duration: instant ? 0 : 0.35, ease: "easeOut" as const };

  return (
    <>
      <section
        ref={trackRef}
        className="relative [--slot:40svh] lg:[--slot:35svh]"
        style={{ height: `calc(100svh + ${count - 1} * var(--slot) + 1px)` }}
      >
        {/* Ancres de chaque projet, à la hauteur de sa tranche. */}
        {projects.map((item, index) => (
          <div
            key={item.slug}
            id={`oeuvre-${item.slug}`}
            data-slot={index}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 h-px w-px"
            style={{ top: `calc(${index} * var(--slot))` }}
          />
        ))}

        <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#111015]">
          {/* Lueur de la couleur du projet, derrière le cadre. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            animate={{
              background: `radial-gradient(50% 55% at 68% 52%, ${project.background}2e 0%, transparent 70%)`,
            }}
            transition={fade}
          />

          <PassiveAnimationProvider>
            <div
              className={cn(
                "relative mx-auto flex h-full max-w-7xl flex-col px-5 pb-4 pt-[calc(var(--header-height)+0.75rem)] transition-opacity duration-150",
                "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-12 lg:pb-10 lg:pt-[calc(var(--header-height)+2.5rem)]",
                synced ? "opacity-100" : "opacity-0",
              )}
            >
              {/* Colonne texte : identité, liste des projets, réglages. */}
              <div className="flex min-h-0 flex-col">
                <h1 className="shrink-0 text-lg font-medium leading-tight tracking-[0.02em] text-white lg:text-5xl [@media(max-height:500px)]:sr-only">
                  {profile.name}
                  <span className="mt-0.5 block text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white/60 lg:mt-3 lg:text-sm">
                    {profile.jobTitle}
                  </span>
                </h1>
                <p className="copy mt-5 hidden max-w-md shrink-0 lg:block [@media(max-height:780px)]:hidden">
                  {t.site.gallery.intro}
                </p>

                <nav
                  aria-label={t.site.gallery.listLabel}
                  className={cn("mt-8 hidden min-h-0 flex-1 overflow-y-auto pl-4 lg:block [@media(max-height:780px)]:mt-5", NO_SCROLLBAR)}
                >
                  <ol className="flex flex-col">
                    {projects.map((item, index) => {
                      const isActive = index === shown;
                      return (
                        <li key={item.slug} className="relative">
                          {isActive ? (
                            <motion.span
                              layoutId="gallery-marker"
                              aria-hidden="true"
                              className="absolute -left-4 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white"
                              transition={{ duration: instant ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                            />
                          ) : null}
                          <Link
                            href={`/projects/${item.slug}`}
                            onMouseEnter={() => setPreview(index)}
                            onMouseLeave={() => setPreview(null)}
                            onFocus={onLinkFocus(index)}
                            onBlur={() => setPreview(null)}
                            className={cn(
                              "flex items-baseline gap-3 py-1 text-sm uppercase tracking-[0.06em] transition-colors duration-300 [@media(max-height:780px)]:py-0.5",
                              "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white/50",
                              isActive ? "font-bold text-white" : "text-white/60 hover:text-white",
                            )}
                          >
                            <span aria-hidden="true" className="w-6 font-normal tabular-nums text-white/55">
                              {pad(index + 1)}
                            </span>
                            {item.title}
                            <span className="sr-only"> — {item.eyebrow}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </nav>

                <GalleryControls
                  className="mt-6 hidden shrink-0 lg:flex"
                  onOverview={() => setOverviewOpen(true)}
                  onGrid={switchToGrid}
                />
              </div>

              {/* Scène : le cadre du projet, puis son cartel. */}
              <div className="mt-3 flex min-h-0 flex-1 flex-col lg:mt-0 lg:h-full [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-5">
                {/* Le cadre prend la plus grande taille carrée que permet la place restante. */}
                <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size] [@media(max-height:500px)]:w-[min(40vw,calc(100svh-var(--header-height)-1.5rem))] [@media(max-height:500px)]:flex-none [@media(max-height:500px)]:self-stretch">
                  <div className="relative aspect-square w-[min(100cqw,100cqh)] shadow-[0_2px_6px_rgba(0,0,0,0.3),0_30px_80px_-20px_rgba(0,0,0,0.75)]">
                    {/* Rien n’est monté avant que la position soit connue : le bon
                        projet apparaît directement, sans sortie animée du premier. */}
                    <AnimatePresence initial={false}>
                      {synced ? (
                        <motion.div
                          key={project.slug}
                          className="absolute inset-0 overflow-hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={fade}
                        >
                          {/* Doublon visuel du lien de la liste : hors du parcours clavier. */}
                          <Link
                            href={`/projects/${project.slug}`}
                            tabIndex={-1}
                            aria-hidden="true"
                            className="relative block h-full w-full"
                            style={{ backgroundColor: project.background }}
                          >
                            <ProjectThumbnail
                              id={`galerie-${project.slug}`}
                              mediaKey={project.mediaKey}
                              alt=""
                              background={project.background}
                              priority={shown === 0}
                            />
                          </Link>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Cartel : doublon visuel, la liste porte l'information accessible. */}
                <div aria-hidden="true" className="mx-auto mt-4 w-full max-w-xl shrink-0 lg:mt-6 [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:w-auto [@media(max-height:500px)]:min-w-0 [@media(max-height:500px)]:flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    {synced ? (
                      <motion.div
                        key={project.slug}
                        initial={{ opacity: 0, y: instant ? 0 : 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: instant ? 0 : 0.22, ease: "easeOut" }}
                      >
                        <p className="text-[0.65rem] tabular-nums uppercase tracking-[0.24em] text-white/60">
                          {pad(shown + 1)} / {pad(count)}
                        </p>
                        <p className="mt-1 text-xl font-medium text-white lg:mt-2 lg:text-3xl">{project.title}</p>
                        <p className="mt-0.5 truncate text-sm text-white/75 lg:mt-1 lg:whitespace-normal">{project.eyebrow}</p>
                        {project.context ? (
                          <p className="mt-2 text-[0.62rem] uppercase tracking-[0.18em] text-white/60 lg:mt-3">
                            {project.context.replace(/ ([:·])/g, " $1")}
                          </p>
                      ) : null}
                    </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Mobile : bouton principal, pastilles des projets, réglages. */}
                <div className="mx-auto mt-3 w-full max-w-xl shrink-0 lg:hidden [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:w-auto [@media(max-height:500px)]:min-w-0 [@media(max-height:500px)]:flex-1">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="flex h-11 items-center justify-center rounded-full bg-white text-sm font-bold uppercase tracking-[0.12em] text-black"
                  >
                    {t.site.gallery.viewProject}
                  </Link>
                  <nav aria-label={t.site.gallery.listLabel} className="mt-3">
                    <ol className={cn("-mx-5 flex gap-2 overflow-x-auto px-5", NO_SCROLLBAR)}>
                      {projects.map((item, index) => (
                        <li key={item.slug}>
                          <Link
                            href={`/projects/${item.slug}`}
                            aria-label={`${pad(index + 1)}. ${item.title} — ${item.eyebrow}`}
                            className={cn(
                              "flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-xs tabular-nums transition-colors",
                              index === shown ? "border-white bg-white text-black" : "border-white/25 text-white/75",
                            )}
                          >
                            {pad(index + 1)}
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </nav>
                  <GalleryControls
                    className="mt-2 flex"
                    onOverview={() => setOverviewOpen(true)}
                    onGrid={switchToGrid}
                  />
                </div>
              </div>
            </div>
          </PassiveAnimationProvider>
        </div>
      </section>

      <OverviewSheet open={overviewOpen} onClose={closeOverview} projects={projects} />
    </>
  );
}

/** « Vue d'ensemble » et choix de l'affichage de l'accueil (galerie ou grille). */
function GalleryControls({
  className,
  onOverview,
  onGrid,
}: {
  className?: string;
  onOverview: () => void;
  onGrid: () => void;
}) {
  const { t } = useTranslation();
  const label =
    "flex items-center rounded-full px-3 text-[0.65rem] uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/60 lg:px-4 lg:text-[0.68rem] lg:tracking-[0.14em]";

  return (
    <div className={cn("flex-wrap items-center gap-2 lg:gap-3", className)}>
      <button
        type="button"
        onClick={onOverview}
        className={cn(label, "h-11 border border-white/25 text-white/85 hover:border-white/45 hover:text-white lg:h-9")}
      >
        {t.site.gallery.overview}
      </button>
      <div role="group" aria-label={t.site.gallery.viewSwitch} className="flex rounded-full border border-white/25 p-0.5">
        <button type="button" aria-pressed="true" className={cn(label, "h-10 bg-white/90 text-black lg:h-8")}>
          {t.site.gallery.showGallery}
        </button>
        <button type="button" aria-pressed="false" onClick={onGrid} className={cn(label, "h-10 text-white/75 hover:text-white lg:h-8")}>
          {t.site.gallery.showGrid}
        </button>
      </div>
    </div>
  );
}
