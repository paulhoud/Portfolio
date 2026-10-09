"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FocusEvent } from "react";
import { PassiveAnimationProvider } from "@/components/projects/PassiveAnimationProvider";
import { ProjectThumbnail } from "@/components/projects/ProjectThumbnail";
import { getMotionEnd, getMotionStart, getProjectMedia, getTileLight } from "@/content/projectMedia";
import type { Project } from "@/content/projects";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";
import { requestIdle } from "@/lib/idle";
import { useMotionPaused } from "@/lib/motionPause";
import { readScrollMemory } from "@/lib/useScrollMemory";
import { cn } from "@/lib/utils";
import type { FrameRect, GalleryFailure, GalleryPieceInput, GalleryRenderer } from "./three/galleryRenderer";

const pad = (value: number) => String(value).padStart(2, "0");

/** Mémoire de session : arrivée déjà jouée, 3D écartée (trop lente, indisponible). */
const ARRIVED_KEY = "portfolio-gallery-arrived";
const NO_3D_KEY = "portfolio-gallery-3d-off";

function readSession(key: string) {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeSession(key: string) {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Réglage système « réduire les animations », suivi en direct : s'il change
 * pendant la visite, la scène 3D passe aussitôt en mode calme (ou en sort).
 */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(listener: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Une perte passagère de la 3D est retentée, deux fois au plus par visite de l'accueil. */
const MAX_SCENE_RETRIES = 2;

/** Plaques de la scène 3D : images à la taille utile, animations, lumières. */
function buildPieces(projects: Project[]): GalleryPieceInput[] {
  const width = window.innerWidth < 768 ? 640 : window.devicePixelRatio > 1.25 ? 1080 : 828;
  return projects.map((project) => {
    const media = getProjectMedia(project.mediaKey);
    const light = getTileLight(project.mediaKey);
    return {
      image: media ? `/_next/image?url=${encodeURIComponent(media.placeholder)}&w=${width}&q=75` : null,
      video: media?.video ?? null,
      motionStart: getMotionStart(project.mediaKey),
      motionEnd: getMotionEnd(project.mediaKey),
      background: project.background,
      glow: light.glow,
      exposure: light.exposure,
    };
  });
}

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
 *
 * Quand le navigateur le permet, une scène 3D (inspirée de spline.design) se
 * glisse sous ce texte : les tuiles deviennent des plaques qui flottent dans
 * le noir, et la caméra les traverse au défilement. Le cadre HTML reste en
 * place, invisible, pour lui indiquer où poser le projet actif ; il reprend
 * sa tuile si la 3D n'est pas disponible.
 */
export function GalleryHome({ projects }: { projects: Project[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [motionPaused] = useMotionPaused();
  const calm = prefersReducedMotion || motionPaused;

  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneHostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GalleryRenderer | null>(null);
  // « ready » : la scène 3D est affichée ; sinon le cadre HTML montre la tuile.
  const [scene, setScene] = useState<"off" | "ready" | "failed">("off");
  const [hovered3d, setHovered3d] = useState<number | null>(null);
  // Un aperçu venu du clavier survit au défilement qu'il provoque, jusqu'à
  // l'arrivée sur son projet ; un défilement suivant l'efface comme un survol.
  const previewFromFocusRef = useRef(false);
  const focusTargetRef = useRef<number | null>(null);
  const [attempt, setAttempt] = useState(0);
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
  const count = projects.length;

  /** Hauteur d'une tranche, lue sur les ancres pour rester fidèle au CSS. */
  const slotHeight = useCallback(() => {
    const anchors = trackRef.current?.querySelectorAll<HTMLElement>("[data-slot]");
    if (!anchors || anchors.length < 2) return window.innerHeight * 0.35;
    return anchors[1].offsetTop - anchors[0].offsetTop;
  }, []);

  const trackTop = () => (trackRef.current ? trackRef.current.getBoundingClientRect().top + window.scrollY : 0);

  /** Position de défilement en « numéro de projet » fractionnaire. */
  const readProgress = useCallback(
    () => (trackRef.current ? -trackRef.current.getBoundingClientRect().top / slotHeight() : 0),
    [slotHeight],
  );

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
      rendererRef.current?.setProgress(readProgress());
      if (index !== activeRef.current) {
        setJumped(Math.abs(index - activeRef.current) > 1);
        activeRef.current = index;
        setActive(index);
        // La liste reste sous le curseur pendant le défilement : un survol en
        // cours ne doit pas figer la scène.
        if (!previewFromFocusRef.current) setPreview(null);
        else if (index === focusTargetRef.current) previewFromFocusRef.current = false;
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
  }, [count, projects, slotHeight, readProgress]);

  const scrollToPiece = useCallback(
    (index: number) => {
      window.scrollTo({ top: trackTop() + index * slotHeight(), behavior: calm ? "auto" : "smooth" });
    },
    [calm, slotHeight],
  );

  // Au clavier, un lien de la liste qui reçoit le focus amène son projet en
  // scène. Au clic, on laisse simplement le lien s'ouvrir.
  const onLinkFocus = (index: number) => (event: FocusEvent<HTMLAnchorElement>) => {
    if (!event.currentTarget.matches(":focus-visible")) return;
    // Comme un survol : la plaque s'éclaire et joue son animation.
    previewFromFocusRef.current = index !== activeRef.current;
    focusTargetRef.current = index;
    setPreview(index);
    scrollToPiece(index);
  };
  const clearPreview = () => {
    previewFromFocusRef.current = false;
    setPreview(null);
  };

  // --- Scène 3D ------------------------------------------------------------
  // Lus au moment de créer la scène, sans la recréer quand ils changent (la
  // liste des projets est reconstruite à chaque rendu de la page parente).
  const calmRef = useRef(calm);
  const scrollToPieceRef = useRef(scrollToPiece);
  const projectsRef = useRef(projects);
  useEffect(() => {
    calmRef.current = calm;
    scrollToPieceRef.current = scrollToPiece;
    projectsRef.current = projects;
  }, [calm, scrollToPiece, projects]);

  /** Emplacement du cadre HTML dans la scène, que la 3D reprend. */
  const measureFrame = useCallback((): FrameRect | null => {
    const stage = stageRef.current?.getBoundingClientRect();
    const frame = frameRef.current?.getBoundingClientRect();
    if (!stage || !frame) return null;
    return {
      cx: frame.left + frame.width / 2 - stage.left,
      cy: frame.top + frame.height / 2 - stage.top,
      size: Math.min(frame.width, frame.height),
    };
  }, []);

  // La 3D se charge après l'affichage, quand le navigateur est libre.
  useEffect(() => {
    if (!synced || readSession(NO_3D_KEY)) return;
    let cancelled = false;
    let renderer: GalleryRenderer | null = null;
    const fail = (reason: GalleryFailure) => {
      rendererRef.current = null;
      renderer?.dispose();
      renderer = null;
      setHovered3d(null);
      if (reason === "context-lost" && attempt < MAX_SCENE_RETRIES) {
        // Perte passagère (onglet en arrière-plan, pilote graphique) : le
        // cadre HTML reprend le temps de recréer la scène.
        setScene("off");
        setAttempt((value) => value + 1);
        return;
      }
      if (reason !== "context-lost") writeSession(NO_3D_KEY);
      setScene("failed");
    };
    const cancelIdle = requestIdle(() => {
      void import("./three/galleryRenderer").then(({ createGalleryRenderer }) => {
        const host = sceneHostRef.current;
        const frame = measureFrame();
        if (cancelled || !host || !frame) return;
        const arrival = !calmRef.current && !readSession(ARRIVED_KEY);
        renderer = createGalleryRenderer(
          host,
          buildPieces(projectsRef.current),
          {
            onHover: setHovered3d,
            onActivate: (index, newTab) => {
              const href = `/projects/${projectsRef.current[index].slug}`;
              if (newTab) window.open(href, "_blank", "noopener");
              else router.push(href);
            },
            onSelect: (index) => scrollToPieceRef.current(index),
            onReady: () => {
              if (arrival) writeSession(ARRIVED_KEY);
              setScene("ready");
            },
            onFail: (reason) => window.setTimeout(() => fail(reason), 0),
          },
          { calm: calmRef.current, arrival, progress: readProgress(), frame },
        );
        rendererRef.current = renderer;
      });
    }, 1500);
    return () => {
      cancelled = true;
      cancelIdle();
      rendererRef.current = null;
      renderer?.dispose();
    };
  }, [synced, router, measureFrame, readProgress, attempt]);

  // Le cadre change de place ou de taille : la scène suit. Sa boîte et celle
  // qui le contient sont observées, et la fenêtre aussi : il peut se déplacer
  // sans changer de taille (fenêtre élargie, cartel plus ou moins haut).
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || scene !== "ready") return;
    const sync = () => {
      const rect = measureFrame();
      if (rect) rendererRef.current?.setFrame(rect);
    };
    const observer = new ResizeObserver(sync);
    observer.observe(frame);
    if (frame.parentElement) observer.observe(frame.parentElement);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [scene, measureFrame]);

  // Pas de rendu quand la scène est hors de l'écran ou l'onglet masqué.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || scene !== "ready") return;
    let onScreen = true;
    const apply = () => rendererRef.current?.setRunning(onScreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      apply();
    });
    observer.observe(stage);
    document.addEventListener("visibilitychange", apply);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, [scene]);

  useEffect(() => rendererRef.current?.setCalm(calm), [calm, scene]);
  useEffect(() => rendererRef.current?.setHighlight(preview), [preview, scene]);
  const live = scene === "ready";

  const shown = preview ?? (live ? hovered3d : null) ?? active;
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

        <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden bg-[#08080b]">
          {/* Lueur de la couleur du projet, derrière le cadre. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            animate={{
              background: `radial-gradient(50% 55% at 68% 52%, ${project.background}2e 0%, transparent 70%)`,
            }}
            transition={fade}
          />

          {/* Scène 3D : purement visuelle, la liste porte les liens. */}
          <div
            ref={sceneHostRef}
            aria-hidden="true"
            className={cn("absolute inset-0 touch-pan-y touch-pinch-zoom", live ? "opacity-100" : "pointer-events-none opacity-0")}
          />
          {/* Voile qui garde le texte lisible par-dessus la scène. */}
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 transition-opacity duration-700",
              "bg-[linear-gradient(0deg,#08080b_0%,rgba(8,8,11,0.9)_32%,transparent_44%),linear-gradient(180deg,rgba(8,8,11,0.85)_0%,transparent_20%)]",
              "lg:bg-[linear-gradient(90deg,#08080b_0%,rgba(8,8,11,0.9)_40%,transparent_52%),linear-gradient(0deg,rgba(8,8,11,0.85)_0%,rgba(8,8,11,0.55)_20%,transparent_34%)]",
              "[@media(max-height:500px)]:bg-[linear-gradient(90deg,transparent_0%,transparent_44%,rgba(8,8,11,0.88)_58%,#08080b_100%)]",
              live ? "opacity-100" : "opacity-0",
            )}
          />

          <PassiveAnimationProvider>
            <div
              className={cn(
                "relative mx-auto flex h-full max-w-7xl flex-col px-5 pb-4 pt-[calc(var(--header-height)+0.75rem)] transition-opacity duration-150",
                // Avec la 3D, les clics traversent jusqu'aux plaques, sauf sur le texte et les boutons.
                live && "pointer-events-none",
                "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-12 lg:pb-10 lg:pt-[calc(var(--header-height)+2.5rem)]",
                synced ? "opacity-100" : "opacity-0",
              )}
            >
              {/* Colonne texte : identité, liste des projets, réglages. */}
              <div className="pointer-events-auto flex min-h-0 flex-col">
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
                            onMouseLeave={clearPreview}
                            onFocus={onLinkFocus(index)}
                            onBlur={clearPreview}
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
              </div>

              {/* Scène : le cadre du projet, puis son cartel. */}
              <div className="mt-3 flex min-h-0 flex-1 flex-col lg:mt-0 lg:h-full [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-5">
                {/* Le cadre prend la plus grande taille carrée que permet la place restante. */}
                <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size] [@media(max-height:500px)]:w-[min(40vw,calc(100svh-var(--header-height)-1.5rem))] [@media(max-height:500px)]:flex-none [@media(max-height:500px)]:self-stretch">
                  <div
                    ref={frameRef}
                    className={cn(
                      "relative aspect-square w-[min(100cqw,100cqh)]",
                      !live && "shadow-[0_2px_6px_rgba(0,0,0,0.3),0_30px_80px_-20px_rgba(0,0,0,0.75)]",
                    )}
                  >
                    {/* Rien n’est monté avant que la position soit connue : le bon
                        projet apparaît directement, sans sortie animée du premier. */}
                    {/* Quand la 3D prend le relais, la tuile disparaît d'un coup :
                        la plaque est déjà à sa place et à sa taille. */}
                    <AnimatePresence initial={false} custom={live}>
                      {synced && !live ? (
                        <motion.div
                          key={project.slug}
                          className="absolute inset-0 overflow-hidden"
                          custom={live}
                          variants={{
                            hidden: { opacity: 0 },
                            shown: { opacity: 1, transition: fade },
                            gone: (handedOver: boolean) => ({ opacity: 0, transition: handedOver ? { duration: 0 } : fade }),
                          }}
                          initial="hidden"
                          animate="shown"
                          exit="gone"
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
                <div aria-hidden="true" className="mx-auto mt-4 grid w-full max-w-xl shrink-0 grid-cols-[minmax(0,1fr)] lg:mt-6 [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:w-auto [@media(max-height:500px)]:min-w-0 [@media(max-height:500px)]:flex-1">
                  {/* Les onze cartels, invisibles et superposés, réservent la
                      hauteur du plus long : le cadre (et la scène 3D qui s'y
                      cale) ne bouge pas d'un projet à l'autre. */}
                  {projects.map((item, index) => (
                    <div key={item.slug} className="invisible [grid-area:1/1]">
                      <CartelContent project={item} index={index} count={count} />
                    </div>
                  ))}
                  <div className="[grid-area:1/1]">
                    <AnimatePresence mode="wait" initial={false}>
                      {synced ? (
                        <motion.div
                          key={project.slug}
                          initial={{ opacity: 0, y: instant ? 0 : 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: instant ? 0 : 0.22, ease: "easeOut" }}
                        >
                          <CartelContent project={project} index={shown} count={count} />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Mobile : bouton principal et pastilles des projets. */}
                <div className="pointer-events-auto mx-auto mt-3 w-full max-w-xl shrink-0 lg:hidden [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:w-auto [@media(max-height:500px)]:min-w-0 [@media(max-height:500px)]:flex-1">
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
                </div>
              </div>
            </div>
          </PassiveAnimationProvider>
        </div>
      </section>
    </>
  );
}

/** Cartel d'un projet, comme au musée : numéro, titre, accroche, cadre et période. */
function CartelContent({ project, index, count }: { project: Project; index: number; count: number }) {
  return (
    <>
      <p className="text-[0.65rem] tabular-nums uppercase tracking-[0.24em] text-white/60">
        {pad(index + 1)} / {pad(count)}
      </p>
      <p className="mt-1 text-xl font-medium text-white lg:mt-2 lg:text-3xl">{project.title}</p>
      <p className="mt-0.5 truncate text-sm text-white/75 lg:mt-1 lg:whitespace-normal">{project.eyebrow}</p>
      {project.context ? (
        <p className="mt-2 text-[0.62rem] uppercase tracking-[0.18em] text-white/60 lg:mt-3">
          {project.context.replace(/ ([:·])/g, " $1")}
        </p>
      ) : null}
    </>
  );
}
