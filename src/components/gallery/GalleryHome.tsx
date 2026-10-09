"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { PassiveAnimationProvider } from "@/components/projects/PassiveAnimationProvider";
import { ProjectThumbnail } from "@/components/projects/ProjectThumbnail";
import { getMotionEnd, getMotionStart, getProjectMedia, getTileEdge, getTileLight } from "@/content/projectMedia";
import type { Project } from "@/content/projects";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";
import { requestIdle } from "@/lib/idle";
import {
  clearGalleryReturn,
  hideVeil,
  peekGalleryReturn,
  revealWhenOn,
  setNextTransition,
  showVeil,
} from "@/lib/immersion";
import { useMotionPaused } from "@/lib/motionPause";
import { endOpening, isOpening, useOpening } from "@/lib/opening";
import { playSfx } from "@/lib/sound/sound";
import { snapshotText } from "./textSnapshot";
import { readScrollMemory } from "@/lib/useScrollMemory";
import { cn } from "@/lib/utils";
import type {
  FrameRect,
  GalleryFailure,
  GalleryPieceInput,
  GalleryRenderer,
  WorldPhase,
  DimensionKind,
} from "./three/galleryRenderer";

const pad = (value: number) => String(value).padStart(2, "0");

/** Mémoire de session : arrivée déjà jouée, 3D écartée (trop lente, indisponible). */
const ARRIVED_KEY = "portfolio-gallery-arrived";
/** Le visiteur a déjà fait défiler la galerie : plus d'invitation à le faire. */
const SCROLLED_KEY = "portfolio-gallery-scrolled";
/** L'indice de la fonction cachée n'est glissé qu'une fois par visite. */
const HINT_KEY = "portfolio-gallery-hint";
/** Code Konami : une autre façon de tout détruire. */
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
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

/** Clic simple (ni nouvel onglet ni autre modificateur). */
const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/** Masque la barre d'une zone qui défile, sans retirer le défilement. */
const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * Accueil en galerie (étape 2 du concept « L'Accrochage », sans 3D).
 *
 * Une longue piste de défilement porte une scène collée à l'écran. Chaque
 * projet occupe une tranche de la piste (`--slot`) : on fait défiler
 * normalement, et le projet actif change à chaque tranche. Sur téléphone, une
 * tranche fait un écran entier et le défilement s'arrête sur chacune : un
 * geste mène au projet suivant ou précédent, jamais plus loin. La scène montre ce
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
  // Invitation à faire défiler : à l'arrivée, tant qu'on n'a pas bougé.
  const [scrolled, setScrolled] = useState(() => typeof window !== "undefined" && readSession(SCROLLED_KEY));
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
      if (window.scrollY > 24 && !readSession(SCROLLED_KEY)) {
        writeSession(SCROLLED_KEY);
        setScrolled(true);
      }
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

  // --- Entrée dans un projet ----------------------------------------------
  // La caméra rejoint la plaque du projet, puis s'avance jusqu'à ce qu'elle
  // remplisse l'écran ; un voile de sa couleur couvre alors le changement de
  // page, puis s'efface sur la page projet. Sans 3D, seul le voile joue.
  const enteringRef = useRef(false);
  // Pendant l'entrée (et le retour), le texte s'efface : seule la plaque compte.
  // (Sans 3D, il n'y a pas de recul à attendre : le texte reste affiché.)
  const [immersed, setImmersed] = useState(() => peekGalleryReturn() !== null && !readSession(NO_3D_KEY));
  const enterProject = useCallback(
    (index: number) => {
      if (enteringRef.current) return;
      enteringRef.current = true;
      setImmersed(true);
      const target = projects[index];
      const href = `/projects/${target.slug}`;
      // Le défilement se cale sur sa tranche : c'est là que le retour ramènera.
      window.scrollTo({ top: trackTop() + index * slotHeight(), behavior: "auto" });
      const go = async () => {
        await showVeil(getTileEdge(target.mediaKey, target.background), 200);
        setNextTransition(href, "cut");
        router.push(href);
        revealWhenOn(href, 520);
      };
      const renderer = rendererRef.current;
      const travel = renderer ? renderer.enter(index, () => void go()) : 0;
      if (!renderer) void go();
      // Un souffle accompagne le trajet, un scintillement l'entrée dans la plaque.
      if (travel > 0) playSfx("travel", travel);
      window.setTimeout(() => playSfx("enter"), travel * 1000);
    },
    [projects, router, slotHeight],
  );
  // De retour sur l'accueil (bouton précédent du navigateur…), on peut repartir.
  useEffect(() => {
    enteringRef.current = false;
  }, []);
  const onProjectClick = (index: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    enterProject(index);
  };

  // --- Scène 3D ------------------------------------------------------------
  // Lus au moment de créer la scène, sans la recréer quand ils changent (la
  // liste des projets est reconstruite à chaque rendu de la page parente).
  const calmRef = useRef(calm);
  const scrollToPieceRef = useRef(scrollToPiece);
  const projectsRef = useRef(projects);
  const enterProjectRef = useRef(enterProject);
  useEffect(() => {
    calmRef.current = calm;
    scrollToPieceRef.current = scrollToPiece;
    projectsRef.current = projects;
    enterProjectRef.current = enterProject;
  }, [calm, scrollToPiece, projects, enterProject]);

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

  // --- « Destroy the world » (fonction cachée) --------------------------------
  // Un trou noir aspire les plaques, le sol et le texte, se referme dans un
  // éclair ; on dérive alors dans une autre dimension, d'où le bouton
  // « Retour » fait renaître le monde. Se déclenche en tapant « destroy » (ou
  // le code Konami), ou par sept clics rapides dans le vide de la scène.
  const [doom, setDoom] = useState<WorldPhase | null>(null);
  const doomRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  /** Sans 3D : animations du texte aspiré, rejouées à l'envers à la renaissance. */
  const textPullRef = useRef<Animation[]>([]);
  /** Avec la 3D : le texte est remplacé par sa photographie, que le trou noir tord. */
  const [textAsImage, setTextAsImage] = useState(false);
  /** Sortie de l'autre dimension (bouton « Retour », touche Échap). */
  const leaveVoidRef = useRef<() => void>(() => {});
  /** Dimension où l'on a atterri (le treillis, ou une image animée). */
  const [landed, setLanded] = useState<DimensionKind>("lattice");
  const destroyWorld = useCallback(() => {
    if (doomRef.current || enteringRef.current) return;
    doomRef.current = true;
    const renderer = rendererRef.current;
    const stage = stageRef.current?.getBoundingClientRect();
    // Jamais deux fois de suite la même dimension.
    const previous = readDimension();
    const choices = DIMENSIONS.filter((kind) => kind !== previous);
    const next = choices[Math.floor(Math.random() * choices.length)];
    writeDimension(next);
    setLanded("lattice");
    playSfx("blackhole");
    let started = false;
    const finish = () => {
      doomRef.current = false;
      for (const animation of textPullRef.current) animation.cancel();
      textPullRef.current = [];
      setDoom(null);
      setTextAsImage(false);
      // La photographie s'efface une fois le vrai texte réaffiché dessous.
      if (started) requestAnimationFrame(() => requestAnimationFrame(() => renderer?.setTextLayer(null)));
    };
    const onPhase = (phase: WorldPhase) => {
      if (phase === "collapse") playSfx("collapse");
      if (phase === "rebirth") {
        playSfx("rebirth");
        // Le texte ressort du trou en se redressant.
        for (const animation of textPullRef.current) {
          animation.playbackRate = -2.6;
          animation.play();
        }
      }
      if (phase === "lost") setLanded(renderer?.shownDimension() ?? "lattice");
      if (phase === "done") finish();
      else setDoom(phase);
    };
    started = renderer?.destroyWorld(onPhase, next) ?? false;
    if (started && renderer) {
      leaveVoidRef.current = () => {
        renderer.returnFromVoid();
      };
      // Le texte est photographié tel qu'il est à l'écran : c'est la photo,
      // plaquée dans la scène, que le trou noir tord et avale.
      const content = contentRef.current;
      if (content && stage) {
        void snapshotText(content, stage, Math.min(window.devicePixelRatio || 1, 2)).then((canvas) => {
          if (!canvas || !doomRef.current) return;
          renderer.setTextLayer(canvas);
          setTextAsImage(true);
        });
      }
      return;
    }
    // Sans 3D, ou en mode calme : le texte s'étire en bloc vers le centre (ou
    // s'efface), puis la même dimension (le message seul) et le même retour.
    if (!calmRef.current && stage) {
      textPullRef.current = pullText(contentRef.current, stage.left + stage.width / 2, stage.top + stage.height / 2, [0, 0.9]);
    }
    onPhase("suck");
    window.setTimeout(() => onPhase("collapse"), 900);
    window.setTimeout(() => onPhase("lost"), 1100);
    let left = false;
    leaveVoidRef.current = () => {
      if (left) return;
      left = true;
      onPhase("rebirth");
      window.setTimeout(() => onPhase("done"), 1000);
    };
  }, []);
  const backFromVoidRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (doom !== "lost") return;
    backFromVoidRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") leaveVoidRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doom]);
  const destroyRef = useRef(destroyWorld);
  useEffect(() => {
    destroyRef.current = destroyWorld;
  }, [destroyWorld]);

  useEffect(() => {
    let typed = "";
    let keys: string[] = [];
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      keys = [...keys, event.key].slice(-KONAMI.length);
      typed = (typed + (event.key.length === 1 ? event.key.toLowerCase() : " ")).slice(-12);
      if (typed.endsWith("destroy") || keys.join() === KONAMI.join()) {
        typed = "";
        keys = [];
        destroyRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // Un indice pour les curieux qui ouvrent la console.
  const secretHint = t.site.gallery.secretHint;
  useEffect(() => {
    if (readSession(HINT_KEY)) return;
    writeSession(HINT_KEY);
    console.info("%c🕳  " + secretHint, "font: 600 13px system-ui; color: #ff8a2a;");
  }, [secretHint]);
  const clicksRef = useRef<number[]>([]);
  const onEmptyClick = () => {
    const now = performance.now();
    clicksRef.current = [...clicksRef.current.filter((at) => now - at < 2500), now];
    if (clicksRef.current.length >= 7) {
      clicksRef.current = [];
      destroyRef.current();
    }
  };
  const onEmptyClickRef = useRef(onEmptyClick);
  useEffect(() => {
    onEmptyClickRef.current = onEmptyClick;
  });

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
    // Retour d'un projet : la scène se crée tout de suite, la caméra part de
    // l'intérieur de sa plaque (sous le voile) et recule.
    const returningSlug = peekGalleryReturn();
    const returning = returningSlug ? projectsRef.current.findIndex((item) => item.slug === returningSlug) : -1;
    const create = () => {
      void import("./three/galleryRenderer").then(({ createGalleryRenderer }) => {
        const host = sceneHostRef.current;
        const frame = measureFrame();
        if (cancelled || !host || !frame) return;
        const arrival = !calmRef.current && !readSession(ARRIVED_KEY) && returning < 0;
        renderer = createGalleryRenderer(
          host,
          buildPieces(projectsRef.current),
          {
            onHover: setHovered3d,
            onActivate: (index, newTab) => {
              const href = `/projects/${projectsRef.current[index].slug}`;
              if (newTab) window.open(href, "_blank", "noopener");
              else enterProjectRef.current(index);
            },
            onSelect: (index) => scrollToPieceRef.current(index),
            onEmptyClick: () => onEmptyClickRef.current(),
            onReady: () => {
              if (arrival) writeSession(ARRIVED_KEY);
              if (returning >= 0) {
                clearGalleryReturn();
                hideVeil(450);
                // Le texte revient pendant que la caméra recule.
                window.setTimeout(() => setImmersed(false), 420);
              }
              setScene("ready");
            },
            onFail: (reason) => window.setTimeout(() => fail(reason), 0),
          },
          {
            calm: calmRef.current,
            arrival,
            progress: readProgress(),
            frame,
            returning: returning >= 0 ? returning : null,
            holdIntro: isOpening(),
          },
        );
        rendererRef.current = renderer;
      });
    };
    // Sous le rideau d'ouverture, rien d'autre n'est visible : on n'attend pas.
    const cancelIdle = returning >= 0 || isOpening() ? (create(), () => {}) : requestIdle(create, 1500);
    return () => {
      cancelled = true;
      cancelIdle();
      rendererRef.current = null;
      renderer?.dispose();
    };
  }, [synced, measureFrame, readProgress, attempt]);

  // Sans 3D (indisponible, écartée), le voile d'un retour se lève tout de suite.
  useEffect(() => {
    if (!synced) return;
    if (scene === "failed" || readSession(NO_3D_KEY)) {
      clearGalleryReturn();
      hideVeil(400);
    }
  }, [synced, scene]);

  // Rideau d'ouverture : il se lève quand la scène est prête (ou sans 3D),
  // et l'arrivée des plaques démarre au moment où il s'efface.
  const opening = useOpening();
  useEffect(() => {
    if (scene === "ready" || scene === "failed" || (synced && readSession(NO_3D_KEY))) endOpening();
  }, [synced, scene]);
  useEffect(() => {
    if (opening !== "loading") rendererRef.current?.releaseIntro();
  }, [opening, scene]);

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
        className="relative [--slot:100svh] lg:[--slot:35svh]"
        style={{ height: `calc(100lvh + ${count - 1} * var(--slot) + 1px)` }}
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

        {/* Téléphone : la scène prend la hauteur de l'écran barre d'adresse
            masquée (100lvh), pour ne laisser aucun vide en bas quand elle se
            cache au défilement ; le texte et les repères restent dans la
            hauteur toujours visible (100svh), et ne sautent donc jamais. */}
        <div ref={stageRef} className="sticky top-0 h-[100lvh] overflow-hidden bg-[#08080b]">
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
              // Effacé pendant l'entrée dans un projet et pendant le trou noir.
              live && !immersed && doom === null ? "opacity-100" : "opacity-0",
            )}
          />

          <AnimatePresence>
            {doom === "lost" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: calm ? 0 : 0.6, duration: 0.8 } }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                className={cn(
                  "pointer-events-none absolute inset-0 z-10 flex flex-col items-center gap-3 px-6 text-center",
                  // South Park : le message monte dans le ciel, pour ne pas cacher les enfants.
                  landed === "southpark" ? "justify-start pt-[calc(var(--header-height)+5svh)]" : "justify-end pb-[20svh]",
                )}
              >
                {/* Sur une image claire, le message se pose sur un voile sombre. */}
                <div
                  className={cn(
                    "flex flex-col items-center gap-3",
                    landed !== "lattice" && "rounded-2xl bg-[#0b0b10]/60 px-7 py-5 backdrop-blur-md",
                  )}
                >
                  <p role="status" className="text-sm uppercase tracking-[0.24em] text-white/85">
                    {t.site.gallery.lostTitle}
                  </p>
                  <p className={cn("text-[0.65rem] uppercase tracking-[0.24em]", landed === "lattice" ? "text-white/50" : "text-white/65")}>
                    {landed === "dofus"
                      ? t.site.gallery.lostHintDofus
                      : landed === "southpark"
                        ? t.site.gallery.lostHintSouthPark
                        : t.site.gallery.lostHint}
                  </p>
                  <button
                    ref={backFromVoidRef}
                    type="button"
                    onClick={() => leaveVoidRef.current()}
                    className="pointer-events-auto mt-5 flex h-11 items-center gap-2.5 rounded-full bg-white pl-4 pr-5 text-sm font-medium text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M11 6l-6 6 6 6" />
                    </svg>
                    {t.site.gallery.lostBack}
                  </button>
                </div>
                {/* Mention de non-affiliation, en petit en bas de l'image. */}
                {landed !== "lattice" ? (
                  <p className="absolute inset-x-0 bottom-3 flex justify-center px-4">
                    {/* Pastille sombre : lisible sur la neige comme sur l'herbe dorée. */}
                    <span className="rounded-full bg-[#0b0b10]/60 px-3 py-1 text-center text-[0.6rem] leading-snug text-white/85 backdrop-blur-sm">
                      {landed === "dofus" ? t.site.gallery.disclaimerDofus : t.site.gallery.disclaimerSouthPark}
                    </span>
                  </p>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <PassiveAnimationProvider>
            <div
              ref={contentRef}
              style={
                textAsImage
                  ? { opacity: 0, pointerEvents: "none" }
                  : doom === null
                  ? undefined
                  : doom === "rebirth"
                    ? { transition: "opacity 1s ease-out" }
                    : calm
                      ? { opacity: 0, pointerEvents: "none", transition: "opacity 0.8s ease-out" }
                      : { pointerEvents: "none" }
              }
              className={cn(
                "relative mx-auto flex h-[100svh] max-w-7xl flex-col px-5 pb-4 pt-[calc(var(--header-height)+0.75rem)] transition-opacity duration-300",
                // Avec la 3D, les clics traversent jusqu'aux plaques, sauf sur le texte et les boutons.
                live && "pointer-events-none",
                "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-12 lg:pb-10 lg:pt-[calc(var(--header-height)+2.5rem)]",
                synced && (!immersed || scene === "failed") ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {/* Colonne texte : identité, liste des projets, réglages. */}
              {/* Centrée en hauteur sur la plaque (qui se tient au-dessus du cartel),
                  et non sur l'écran entier : elle paraissait trop basse. */}
              <div className="pointer-events-auto flex min-h-0 flex-col lg:justify-center lg:pb-40">
                <h1 data-pull className="shrink-0 text-lg font-medium leading-tight tracking-[0.02em] text-white lg:text-5xl [@media(max-height:500px)]:sr-only">
                  {profile.name}
                  <span className="mt-0.5 block text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white/60 lg:mt-3 lg:text-sm">
                    {profile.jobTitle}
                  </span>
                </h1>
                <p data-pull className="copy mt-5 hidden max-w-md shrink-0 lg:block [@media(max-height:780px)]:hidden">
                  {t.site.gallery.intro}
                </p>

                <nav
                  aria-label={t.site.gallery.listLabel}
                  className={cn("mt-8 hidden min-h-0 overflow-y-auto pl-4 lg:block [@media(max-height:780px)]:mt-5", NO_SCROLLBAR)}
                >
                  <ol className="flex flex-col">
                    {projects.map((item, index) => {
                      const isActive = index === shown;
                      return (
                        <li key={item.slug} data-pull className="relative">
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
                            onClick={onProjectClick(index)}
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
                <div className="relative flex min-h-0 flex-1 items-center justify-center [container-type:size] [@media(max-height:500px)]:w-[min(40vw,calc(100svh-var(--header-height)-1.5rem))] [@media(max-height:500px)]:flex-none [@media(max-height:500px)]:self-stretch">
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
                            onClick={onProjectClick(shown)}
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

                  {/* Invitation à défiler : à l'arrivée seulement, jusqu'au premier défilement. */}
                  <AnimatePresence>
                    {synced && !scrolled && !immersed && active === 0 && doom === null ? (
                      <motion.div
                        aria-hidden="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: calm ? 0 : 1.6, duration: 0.6 } }}
                        exit={{ opacity: 0, transition: { duration: 0.3 } }}
                        className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 lg:bottom-3"
                      >
                        <span className="relative block h-7 w-px overflow-hidden bg-white/15">
                          <span className={cn("absolute left-1/2 top-1 block h-2 w-[3px] -translate-x-1/2 rounded-full bg-white/85", !calm && "scroll-cue-dot")} />
                        </span>
                        <span className="text-[0.6rem] uppercase tracking-[0.24em] text-white/60">{t.site.gallery.scrollHint}</span>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Mobile : repère vertical au bord droit, qui montre qu'on avance
                      en faisant défiler et où l'on en est (un point par projet,
                      l'actif allongé). Toucher un point y mène ; la flèche du bas
                      passe au projet suivant, et frémit tant qu'on n'a pas défilé. */}
                  <nav
                    aria-label={t.site.gallery.listLabel}
                    className="pointer-events-auto absolute -right-4 top-1/2 flex -translate-y-1/2 flex-col items-center lg:hidden"
                  >
                    <ol data-pull className="flex flex-col items-center">
                      {projects.map((item, index) => (
                        <li key={item.slug}>
                          <button
                            type="button"
                            onClick={() => scrollToPiece(index)}
                            aria-label={`${pad(index + 1)}. ${item.title} — ${item.eyebrow}`}
                            aria-current={index === active ? "true" : undefined}
                            className="flex h-6 w-8 items-center justify-center focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60"
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "block w-1.5 rounded-full transition-all duration-300",
                                index === shown ? "h-4 bg-white" : "h-1.5 bg-white/30",
                              )}
                            />
                          </button>
                        </li>
                      ))}
                    </ol>
                    <button
                      type="button"
                      data-pull
                      onClick={() => scrollToPiece(Math.min(count - 1, active + 1))}
                      aria-label={t.site.gallery.nextProject}
                      className={cn(
                        "mt-1 flex h-8 w-8 items-center justify-center text-white/70 transition-opacity duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60",
                        active >= count - 1 && "invisible opacity-0",
                      )}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className={cn("h-4 w-4", synced && !scrolled && !calm && "nudge-down")}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </nav>
                </div>

                {/* Cartel : doublon visuel, la liste porte l'information accessible. */}
                <div data-pull aria-hidden="true" className="mx-auto mt-4 grid w-full max-w-xl shrink-0 grid-cols-[minmax(0,1fr)] lg:mt-6 [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:w-auto [@media(max-height:500px)]:min-w-0 [@media(max-height:500px)]:flex-1">
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

                {/* Mobile : un bouton qui dit ce qu'il fait, pour entrer dans le
                    projet affiché (en plus d'un toucher sur la plaque). On passe
                    d'un projet à l'autre en faisant défiler (cf. le repère vertical). */}
                <div data-pull className="pointer-events-auto mx-auto mt-4 flex w-full max-w-xl shrink-0 lg:hidden [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:w-auto">
                  <Link
                    href={`/projects/${project.slug}`}
                    onClick={onProjectClick(shown)}
                    aria-label={`${t.site.gallery.viewProject} : ${project.title}`}
                    className="flex h-11 items-center gap-2.5 rounded-full bg-white pl-5 pr-4 text-sm font-medium text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                  >
                    {t.site.gallery.viewProject}
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Ordinateur : la mention de droits flotte en bas à gauche, sur la scène. */}
              <p data-pull className="pointer-events-auto absolute bottom-6 left-12 hidden text-[0.6rem] uppercase tracking-[0.06em] text-white/40 lg:block">
                {t.site.footer.copyright} {t.site.footer.rights}
              </p>
            </div>
          </PassiveAnimationProvider>
        </div>
      </section>
    </>
  );
}

/**
 * Les dimensions où l'on peut tomber (images dans public/dimensions).
 */
const DIMENSIONS: DimensionKind[] = ["lattice", "dofus", "southpark"];
const DIMENSION_KEY = "portfolio-dimension";
function readDimension(): DimensionKind | null {
  try {
    const value = window.sessionStorage.getItem(DIMENSION_KEY);
    return DIMENSIONS.find((kind) => kind === value) ?? null;
  } catch {
    return null;
  }
}
function writeDimension(value: DimensionKind) {
  try {
    window.sessionStorage.setItem(DIMENSION_KEY, value);
  } catch {
    /* stockage indisponible : le tirage reste au hasard */
  }
}

/**
 * Le texte aspiré par le trou noir : chaque bloc marqué `data-pull` s'étire
 * vers le trou (en `cx`, `cy` à l'écran), s'amincit en travers, tourne un peu
 * et s'y engouffre ; les plus proches partent les premiers. `span` : début et
 * fin de l'aspiration (s). Les animations restent sur leur dernière image
 * jusqu'à la renaissance, qui les rejoue à l'envers.
 */
function pullText(container: HTMLElement | null, cx: number, cy: number, span: [number, number]): Animation[] {
  if (!container || typeof container.animate !== "function") return [];
  const targets = [...container.querySelectorAll<HTMLElement>("[data-pull]")].filter(
    (element) => element.getClientRects().length > 0,
  );
  const spots = targets.map((element) => {
    const rect = element.getBoundingClientRect();
    const dx = cx - (rect.left + rect.width / 2);
    const dy = cy - (rect.top + rect.height / 2);
    return { element, dx, dy, distance: Math.hypot(dx, dy) };
  });
  const farthest = Math.max(1, ...spots.map((spot) => spot.distance));
  const [from, to] = span;
  return spots.map(({ element, dx, dy, distance }) => {
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const pose = (share: number, along: number, across: number, turn: number) =>
      `translate(${dx * share}px, ${dy * share}px) rotate(${angle + turn}deg) scale(${along}, ${across}) rotate(${-angle}deg)`;
    const delay = (from + (distance / farthest) * (to - from) * 0.3) * 1000;
    return element.animate(
      [
        { transform: "none", filter: "blur(0px)", opacity: 1 },
        { transform: pose(0.08, 1.4, 0.82, -6), filter: "blur(0px)", opacity: 1, offset: 0.35 },
        { transform: pose(0.5, 2.8, 0.32, -30), filter: "blur(1px)", opacity: 0.9, offset: 0.72 },
        { transform: pose(1, 3.6, 0.02, -75), filter: "blur(3px)", opacity: 0 },
      ],
      { delay, duration: to * 1000 - delay, easing: "cubic-bezier(0.55, 0, 0.85, 0.4)", fill: "both" },
    );
  });
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
