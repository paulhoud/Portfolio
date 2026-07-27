"use client";

import { animate, motion, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectMedia } from "@/content/projects";
import { useTranslation } from "@/i18n/context";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.4;
const EASE = [0.22, 1, 0.36, 1] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type MediaViewerProps = {
  media: ProjectMedia[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
};

/**
 * Visionneuse plein écran unique pour images et vidéos.
 * - Images : zoom (molette, double-clic, boutons) et déplacement au glisser.
 * - Vidéos : lecteur natif avec contrôles, lecture automatique.
 * - Commun : navigation ◀▶ (+ flèches clavier), fermeture (Échap / clic hors
 *   média / bouton ✕), légende et compteur toujours visibles en bas à gauche.
 */
export function MediaViewer({ media, index, onNavigate, onClose }: MediaViewerProps) {
  const { locale } = useTranslation();
  const en = locale === "en";

  const current = media[index];
  const isVideo = Boolean(current.video);
  const count = media.length;

  const stageRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pointerState = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false });

  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [zoomed, setZoomed] = useState(false);

  const goPrev = useCallback(() => onNavigate((index - 1 + count) % count), [index, count, onNavigate]);
  const goNext = useCallback(() => onNavigate((index + 1) % count), [index, count, onNavigate]);

  // Réinitialise le zoom à chaque changement de média.
  useEffect(() => {
    scale.set(1);
    x.set(0);
    y.set(0);
  }, [index, scale, x, y]);

  // Reflète l'état zoomé (pour le curseur) sans re-render à chaque pixel.
  useEffect(() => scale.on("change", (value) => setZoomed(value > 1.01)), [scale]);

  // Verrouille le scroll de la page pendant l'ouverture.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Focus initial sur le bouton de fermeture (accessibilité).
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Raccourcis clavier.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") goPrev();
      else if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  const applyZoom = useCallback(
    (targetScale: number, cx?: number, cy?: number, animated = false) => {
      const element = stageRef.current;
      const previousScale = scale.get();
      const target = clamp(targetScale, MIN_SCALE, MAX_SCALE);
      const rect = element?.getBoundingClientRect();

      let nextX = x.get();
      let nextY = y.get();

      // Zoom centré sur le pointeur si des coordonnées sont fournies.
      if (rect && cx != null && cy != null && previousScale > 0) {
        const px = cx - (rect.left + rect.width / 2);
        const py = cy - (rect.top + rect.height / 2);
        nextX = px - ((px - x.get()) / previousScale) * target;
        nextY = py - ((py - y.get()) / previousScale) * target;
      }

      const maxX = rect ? Math.max(0, (rect.width * (target - 1)) / 2) : 0;
      const maxY = rect ? Math.max(0, (rect.height * (target - 1)) / 2) : 0;
      nextX = target === 1 ? 0 : clamp(nextX, -maxX, maxX);
      nextY = target === 1 ? 0 : clamp(nextY, -maxY, maxY);

      if (animated) {
        animate(scale, target, { duration: 0.26, ease: EASE });
        animate(x, nextX, { duration: 0.26, ease: EASE });
        animate(y, nextY, { duration: 0.26, ease: EASE });
      } else {
        scale.set(target);
        x.set(nextX);
        y.set(nextY);
      }
    },
    [scale, x, y],
  );

  // Zoom molette (listener natif pour pouvoir préempter le scroll).
  useEffect(() => {
    const element = stageRef.current;
    if (!element || isVideo) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      applyZoom(scale.get() * factor, event.clientX, event.clientY, false);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [isVideo, applyZoom, scale]);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (isVideo || scale.get() <= 1) return;
    pointerState.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: x.get(),
      originY: y.get(),
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const state = pointerState.current;
    if (!state.dragging) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) state.moved = true;
    const rect = stageRef.current?.getBoundingClientRect();
    const currentScale = scale.get();
    const maxX = rect ? Math.max(0, (rect.width * (currentScale - 1)) / 2) : 0;
    const maxY = rect ? Math.max(0, (rect.height * (currentScale - 1)) / 2) : 0;
    x.set(clamp(state.originX + dx, -maxX, maxX));
    y.set(clamp(state.originY + dy, -maxY, maxY));
  };

  const handlePointerUp = () => {
    pointerState.current.dragging = false;
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    if (isVideo) return;
    if (scale.get() > 1) applyZoom(1, undefined, undefined, true);
    else applyZoom(2.5, event.clientX, event.clientY, true);
  };

  // Un clic sur le média ne ferme pas ; un vrai clic dehors, si.
  const handleMediaClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const label = {
    close: en ? "Close" : "Fermer",
    prev: en ? "Previous" : "Précédent",
    next: en ? "Next" : "Suivant",
    zoomIn: en ? "Zoom in" : "Zoom avant",
    zoomOut: en ? "Zoom out" : "Zoom arrière",
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      onClick={onClose}
    >
      {/* Bouton fermer */}
      <button
        ref={closeButtonRef}
        type="button"
        aria-label={label.close}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation */}
      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label={label.prev}
            onClick={(event) => {
              event.stopPropagation();
              goPrev();
            }}
            className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 md:left-6"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={label.next}
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 md:right-6"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      ) : null}

      {/* Scène média */}
      <div
        ref={stageRef}
        className="absolute inset-0 flex touch-none items-center justify-center overflow-hidden px-4 py-16 md:px-24"
      >
        {isVideo ? (
          <video
            key={current.video}
            src={current.video}
            poster={current.image.src}
            controls
            autoPlay
            playsInline
            onClick={handleMediaClick}
            className="max-h-full max-w-full rounded-[0.35rem] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          />
        ) : (
          <motion.div
            style={{ scale, x, y, cursor: zoomed ? "grab" : "zoom-in" }}
            onClick={handleMediaClick}
            onDoubleClick={handleDoubleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="flex items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image.src}
              alt={current.title}
              draggable={false}
              className="max-h-[82vh] max-w-[90vw] select-none object-contain shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
        )}
      </div>

      {/* Légende + compteur (bas gauche, toujours visible) */}
      <figcaption className="pointer-events-none absolute bottom-5 left-5 z-10 max-w-[min(90vw,520px)] md:bottom-6 md:left-[calc(var(--sidebar-width)+2rem)]">
        {count > 1 ? (
          <span className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            {index + 1} / {count}
          </span>
        ) : null}
        <span className="block text-balance text-sm text-white/85 md:text-base">{current.title}</span>
      </figcaption>

      {/* Contrôles de zoom (images) */}
      {!isVideo ? (
        <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 md:bottom-6 md:right-8">
          <button
            type="button"
            aria-label={label.zoomOut}
            onClick={(event) => {
              event.stopPropagation();
              applyZoom(scale.get() / ZOOM_STEP, undefined, undefined, true);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={label.zoomIn}
            onClick={(event) => {
              event.stopPropagation();
              applyZoom(scale.get() * ZOOM_STEP, undefined, undefined, true);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
