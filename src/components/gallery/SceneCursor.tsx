"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/context";
import { useSoundOn } from "@/lib/sound/sound";
import { cn } from "@/lib/utils";
import type { SceneCursorState } from "./three/galleryRenderer";

type Mode = Exclude<SceneCursorState, null> | "link";

/**
 * Taille du cercle selon ce qu'on survole (son plus grand diamètre : 112 px).
 * Sur un projet, il devient l'arc sur lequel tourne « Découvrir ».
 */
const RING_SCALE: Record<Mode, number> = { scene: 0.3, object: 0.42, grab: 0.24, link: 0.36, project: 0.75 };

/** Ombre très douce : le blanc reste lisible sur une plaque claire. */
const LEGIBLE = "[filter:drop-shadow(0_0_1.5px_rgba(0,0,0,0.5))]";

/**
 * Curseur de la galerie (souris seulement). Dans toute la zone de
 * l'expérience, il remplace celui du système et dit ce qu'on peut faire :
 * - dans le vide : un petit cercle où un point descend, comme l'invitation
 *   à faire défiler ;
 * - sur un projet : « Découvrir » tourne lentement sur un arc blanc, un
 *   second arc plus fin dessous, la flèche au centre ;
 * - sur un objet : un cercle à la couleur du projet, une note de musique (le
 *   son est actif) ou une main (on peut l'attraper) ; objet tenu : il se
 *   resserre ;
 * - sur un lien ou un bouton : un cercle plein, discret.
 * Hors de la zone (en-tête, pastilles, autres pages), le curseur du système
 * revient ; il reste aussi celui de secours si ce script ne tourne pas. Le
 * curseur ne capte jamais les clics. Au toucher, il n'existe pas : le bouton
 * « Voir le projet » et les objets qui sautillent à l'arrivée en tiennent lieu.
 */
export function SceneCursor({ scene, calm }: { scene: SceneCursorState; calm: boolean }) {
  const { t } = useTranslation();
  const [soundOn] = useSoundOn();
  const [enabled, setEnabled] = useState(false);
  const [target, setTarget] = useState<{ inZone: boolean; overScene: boolean; dom: Mode | null }>({
    inZone: false,
    overScene: false,
    dom: null,
  });
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Souris ou pavé tactile seulement : rien sur un écran tactile.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Le point suit la souris exactement, le cercle avec un léger retard.
  useEffect(() => {
    if (!enabled) return;
    const goal = { x: -200, y: -200 };
    const ring = { x: -200, y: -200 };
    let raf = 0;
    const place = () => {
      raf = 0;
      const follow = calm ? 1 : 0.32;
      ring.x += (goal.x - ring.x) * follow;
      ring.y += (goal.y - ring.y) * follow;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${goal.x}px, ${goal.y}px, 0)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
      if (Math.abs(goal.x - ring.x) > 0.3 || Math.abs(goal.y - ring.y) > 0.3) raf = requestAnimationFrame(place);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const first = goal.x < -100;
      goal.x = event.clientX;
      goal.y = event.clientY;
      // À l'entrée dans la page, le cercle part de la souris, pas d'un coin.
      if (first) Object.assign(ring, goal);
      if (!raf) raf = requestAnimationFrame(place);
      const element = event.target instanceof Element ? event.target : null;
      const inZone = element?.closest("[data-cursor-zone]") != null;
      const overScene = element instanceof HTMLCanvasElement && element.closest("[data-scene-host]") !== null;
      const control = element?.closest("a, button, [role='button'], [data-cursor]");
      const dom: Mode | null = control ? (control.getAttribute("data-cursor") === "discover" ? "project" : "link") : null;
      setTarget((current) =>
        current.inZone === inZone && current.overScene === overScene && current.dom === dom ? current : { inZone, overScene, dom },
      );
    };
    const onLeave = (event: PointerEvent) => {
      if (event.relatedTarget === null) setTarget({ inZone: false, overScene: false, dom: null });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, calm]);

  // Dans la zone, toujours un curseur : celui que la scène indique, ou le
  // curseur « vide » quand elle ne répond pas (entrée dans un projet, autre
  // dimension).
  const mode: Mode | null = !enabled || !target.inZone ? null : (target.dom ?? (target.overScene ? (scene ?? "scene") : "scene"));

  // Le curseur du système ne s'efface que dans la zone, et seulement quand
  // celui-ci est bien là pour le remplacer.
  useEffect(() => {
    const root = document.documentElement;
    if (mode) root.dataset.sceneCursor = "on";
    else delete root.dataset.sceneCursor;
    return () => {
      delete root.dataset.sceneCursor;
    };
  }, [mode]);

  if (!enabled) return null;
  const shown = mode ?? "scene";
  const word = t.site.gallery.discover.toUpperCase();

  return (
    <div
      aria-hidden="true"
      data-mode={mode ?? undefined}
      className={cn("pointer-events-none fixed inset-0 z-[70] transition-opacity duration-200", mode ? "opacity-100" : "opacity-0")}
    >
      <div ref={ringRef} className="absolute left-0 top-0 will-change-transform">
        <div
          className="absolute -left-14 -top-14 h-28 w-28 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `scale(${RING_SCALE[shown]})` }}
        >
          <span
            className={cn(
              "absolute inset-0 rounded-full transition-[background-color] duration-300",
              shown === "grab" ? "bg-white/15" : shown === "link" ? "bg-white/10" : "bg-transparent",
            )}
          />
          <svg viewBox="0 0 112 112" className={cn("absolute inset-0 h-full w-full overflow-visible", shown === "project" && LEGIBLE)}>
            <circle
              cx="56"
              cy="56"
              r="55"
              fill="none"
              strokeWidth={shown === "project" ? 1 : 1.25}
              vectorEffect="non-scaling-stroke"
              className={cn(
                "transition-[stroke] duration-500",
                shown === "object" ? "[stroke:var(--accent-glow,#ffffff)]" : shown === "project" ? "stroke-white" : "stroke-white/60",
              )}
            />
          </svg>
        </div>

        {/* Sur un projet : « Découvrir » posé sur l'arc blanc, un second arc
            fin dessous, qui tournent lentement ; la flèche reste au centre. */}
        <div
          className={cn(
            "absolute -left-14 -top-14 h-28 w-28 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            LEGIBLE,
            shown === "project" ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        >
          <svg viewBox="0 0 112 112" className={cn("absolute inset-0 h-full w-full", !calm && "cursor-spin")}>
            <defs>
              <path id="scene-cursor-path" d="M56,56 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
            </defs>
            <text className="fill-white text-[8.5px] font-medium uppercase tracking-[0.24em]">
              <textPath href="#scene-cursor-path" textLength="274" lengthAdjust="spacing">
                {`${word} · ${word} · `}
              </textPath>
            </text>
            {/* Second arc, ouvert : on voit qu'il tourne. */}
            <circle cx="56" cy="56" r="33" fill="none" stroke="white" strokeOpacity="0.75" strokeWidth="0.75" strokeDasharray="168 39.3" strokeLinecap="round" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </div>

        {/* Sur un objet : on peut le toucher (une note si le son est actif) ou l'attraper. */}
        <div
          className={cn(
            "absolute -left-2.5 -top-2.5 h-5 w-5 text-white transition-[opacity,transform] duration-300",
            LEGIBLE,
            shown === "object" ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        >
          {soundOn ? (
            <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor">
              <path d="M9 17.5V6.2l10-2.2v11.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="6.6" cy="17.6" r="2.6" />
              <circle cx="16.6" cy="15.4" r="2.6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5v-2a1.5 1.5 0 0 1 3 0V11m0-2a1.5 1.5 0 0 1 3 0v2m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L5.3 16a1.6 1.6 0 0 1 2.4-2l.3.4" />
            </svg>
          )}
        </div>
      </div>

      {/* Le centre, exactement sous la souris : dans le vide, un point descend le
          long d'un trait (on fait défiler) ; sur un lien ou un objet tenu, un
          simple point. */}
      <div ref={dotRef} className="absolute left-0 top-0">
        <span
          className={cn(
            "absolute -left-[2px] -top-[2px] h-1 w-1 rounded-full bg-white transition-opacity duration-200",
            shown === "grab" || shown === "link" ? "opacity-100" : "opacity-0",
          )}
        />
        <span
          className={cn(
            "absolute -left-px -top-1.5 block h-3 w-[2px] overflow-hidden rounded-full bg-white/15 transition-opacity duration-200",
            shown === "scene" ? "opacity-100" : "opacity-0",
          )}
        >
          <span className={cn("absolute left-0 top-0 block h-1 w-[2px] rounded-full bg-white/80", !calm && "cursor-scroll-dot")} />
        </span>
      </div>
    </div>
  );
}
