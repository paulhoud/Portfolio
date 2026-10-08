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
import { cn } from "@/lib/utils";
import { OverviewSheet } from "./OverviewSheet";

/**
 * Hauteur de défilement consacrée à chaque projet, en part de la hauteur
 * d'écran. Doit rester égale à la variable CSS `--slot` posée sur la piste.
 */
const SLOT_DESKTOP = 0.35;
const SLOT_MOBILE = 0.4;
const DESKTOP_QUERY = "(min-width: 1024px)";

const pad = (value: number) => String(value).padStart(2, "0");

function slotHeight() {
  return window.innerHeight * (window.matchMedia(DESKTOP_QUERY).matches ? SLOT_DESKTOP : SLOT_MOBILE);
}

/**
 * Accueil en galerie (étape 2 du concept « L'Accrochage », sans 3D).
 *
 * Une longue piste de défilement porte une scène collée à l'écran. Chaque
 * projet occupe une tranche de la piste : on fait défiler normalement, et le
 * projet actif change à chaque tranche. La scène montre ce projet dans un
 * cadre (la tuile actuelle, avec son animation au survol), avec son cartel.
 * Le cadre est l'emplacement où viendra la salle 3D.
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
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const count = projects.length;

  // Le projet actif suit le défilement, tranche par tranche.
  useEffect(() => {
    const onScroll = () => {
      const track = trackRef.current;
      if (!track) return;
      const offset = window.scrollY - (track.getBoundingClientRect().top + window.scrollY);
      setActive(Math.min(count - 1, Math.max(0, Math.round(offset / slotHeight()))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);

  const scrollToPiece = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const top = track.getBoundingClientRect().top + window.scrollY + index * slotHeight();
      window.scrollTo({ top, behavior: calm ? "auto" : "smooth" });
    },
    [calm],
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
  const fade = { duration: calm ? 0.16 : 0.35, ease: "easeOut" as const };

  return (
    <>
      <a
        href="#galerie-liste"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[calc(var(--header-height)+0.75rem)] focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-black"
      >
        {t.site.gallery.skipToList}
      </a>

      <section
        ref={trackRef}
        className="relative [--slot:40svh] lg:[--slot:35svh]"
        style={{ height: `calc(115svh + ${count - 1} * var(--slot))` }}
      >
        {/* Ancres de chaque projet, à la hauteur de sa tranche. */}
        {projects.map((item, index) => (
          <div
            key={item.slug}
            id={`oeuvre-${item.slug}`}
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
            <div className="page-top relative mx-auto flex h-full max-w-7xl flex-col px-6 pb-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16 lg:px-12 lg:pb-12">
              {/* Colonne texte : identité, liste des projets, réglages. */}
              <div className="flex flex-col">
                <h1 className="text-xl font-medium tracking-[0.02em] text-white lg:text-5xl">
                  {profile.name}
                  <span className="mt-1 block text-[0.7rem] font-bold uppercase tracking-[0.24em] text-white/55 lg:mt-3 lg:text-sm">
                    {profile.jobTitle}
                  </span>
                </h1>
                <p className="copy mt-5 hidden max-w-md lg:block">{t.site.gallery.intro}</p>

                <nav id="galerie-liste" aria-label={t.site.gallery.listLabel} className="mt-10 hidden lg:block">
                  <ol className="flex flex-col gap-1">
                    {projects.map((item, index) => {
                      const isActive = index === shown;
                      return (
                        <li key={item.slug} className="relative">
                          {isActive ? (
                            <motion.span
                              layoutId="gallery-marker"
                              aria-hidden="true"
                              className="absolute -left-4 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white"
                              transition={{ duration: calm ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                            />
                          ) : null}
                          <Link
                            href={`/projects/${item.slug}`}
                            onMouseEnter={() => setPreview(index)}
                            onMouseLeave={() => setPreview(null)}
                            onFocus={onLinkFocus(index)}
                            onBlur={() => setPreview(null)}
                            className={cn(
                              "flex items-baseline gap-3 py-1 text-sm uppercase tracking-[0.06em] transition-colors duration-300",
                              "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white/50",
                              isActive ? "font-bold text-white" : "text-white/55 hover:text-white",
                            )}
                          >
                            <span aria-hidden="true" className="w-6 font-normal tabular-nums text-white/35">
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
                  className="mt-10 hidden lg:flex"
                  onOverview={() => setOverviewOpen(true)}
                  onGrid={switchToGrid}
                />
              </div>

              {/* Scène : le cadre du projet et son cartel. */}
              <div className="mt-6 flex flex-1 flex-col items-center lg:mt-0 lg:flex-none">
                <div className="relative aspect-square w-[min(78vw,44svh)] shadow-[0_2px_6px_rgba(0,0,0,0.3),0_30px_80px_-20px_rgba(0,0,0,0.75)] lg:w-[min(100%,56svh)]">
                  <AnimatePresence initial={false}>
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
                  </AnimatePresence>
                </div>

                {/* Cartel : doublon visuel, la liste porte l'information accessible. */}
                <div aria-hidden="true" className="mt-6 w-[min(78vw,44svh)] lg:w-[min(100%,56svh)]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={project.slug}
                      initial={{ opacity: 0, y: calm ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: calm ? 0.12 : 0.22, ease: "easeOut" }}
                    >
                      <p className="text-[0.65rem] tabular-nums uppercase tracking-[0.24em] text-white/45">
                        {pad(shown + 1)} / {pad(count)}
                      </p>
                      <p className="mt-2 text-2xl font-medium text-white lg:text-3xl">{project.title}</p>
                      <p className="mt-1 text-sm text-white/70">{project.eyebrow}</p>
                      {project.context ? (
                        <p className="mt-3 text-[0.62rem] uppercase tracking-[0.18em] text-white/45">
                          {project.context.replace(/ ([:·])/g, " $1")}
                        </p>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Mobile : bouton principal, puis pastilles des projets. */}
                <Link
                  href={`/projects/${project.slug}`}
                  className="mt-5 flex h-12 w-[min(78vw,44svh)] items-center justify-center rounded-full bg-white text-sm font-bold uppercase tracking-[0.12em] text-black lg:hidden"
                >
                  {t.site.gallery.viewProject}
                </Link>
              </div>

              <nav aria-label={t.site.gallery.listLabel} className="mt-auto pt-5 lg:hidden">
                <ol className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {projects.map((item, index) => (
                    <li key={item.slug}>
                      <Link
                        href={`/projects/${item.slug}`}
                        aria-label={`${pad(index + 1)}. ${item.title} — ${item.eyebrow}`}
                        className={cn(
                          "flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-xs tabular-nums transition-colors",
                          index === shown ? "border-white bg-white text-black" : "border-white/20 text-white/70",
                        )}
                      >
                        {pad(index + 1)}
                      </Link>
                    </li>
                  ))}
                </ol>
                <GalleryControls
                  className="mt-3 flex"
                  onOverview={() => setOverviewOpen(true)}
                  onGrid={switchToGrid}
                />
              </nav>
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
  const pill =
    "flex h-9 items-center rounded-full border px-3 text-[0.65rem] uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/60 lg:px-4 lg:text-[0.68rem] lg:tracking-[0.14em]";

  return (
    <div className={cn("flex-wrap items-center gap-2 lg:gap-3", className)}>
      <button type="button" onClick={onOverview} className={cn(pill, "border-white/20 text-white/80 hover:border-white/40 hover:text-white")}>
        {t.site.gallery.overview}
      </button>
      <div role="group" aria-label={t.site.gallery.viewSwitch} className="flex rounded-full border border-white/20 p-0.5">
        <button type="button" aria-pressed="true" className={cn(pill, "h-8 border-transparent bg-white/90 text-black")}>
          {t.site.gallery.showGallery}
        </button>
        <button type="button" aria-pressed="false" onClick={onGrid} className={cn(pill, "h-8 border-transparent text-white/70 hover:text-white")}>
          {t.site.gallery.showGrid}
        </button>
      </div>
    </div>
  );
}
