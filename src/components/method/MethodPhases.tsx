"use client";

import { useEffect, useRef, useState } from "react";
import { LucideIcon } from "@/components/icons/Lucide";
import type { MethodStep } from "@/i18n/types";
import { cn } from "@/lib/utils";
import { StepGlyph, stepColor } from "./MethodTimeline";
import { useFigureLoop } from "./useFigureLoop";

/** Départ, cinq temps, aboutissement, retour : la durée de chaque passage. */
const JOURNEY = [1500, 2000, 2000, 2000, 2000, 2000, 2400, 2400] as const;
/** Après le premier tour, la boucle reprend à Comprendre, pas au départ. */
const RESTART = 1;

type Point = { x: number; y: number };
type Box = { left: number; top: number; right: number; bottom: number };
type Route = { legs: string[]; track: string; arrow: string; apex: Point[] };

/**
 * Carte d'ensemble de la méthode, avant le détail (refaite le 28 oct. 2026,
 * brief de Paul : qu'elle explique le cheminement au lieu de le représenter).
 *
 * D'un besoin à une solution qui vit, cinq cercles qui se chevauchent comme
 * les temps eux-mêmes. Un jeton fait le chemin en boucle sur les bords mêmes
 * de la carte (revu le 28 oct. 2026, à la demande de Paul) : il suit le haut
 * de chaque cercle, passe de l'un à l'autre là où ils se croisent, fait le
 * tour de l'aboutissement, puis revient par la flèche du dessous jusqu'à
 * Comprendre. Chaque temps s'allume à son passage et sa phrase-clé s'affiche
 * dessous. Survoler ou parcourir au clavier un temps arrête le jeton dessus ;
 * le toucher ou le choisir mène à son étape.
 *
 * Ordinateur : en ligne, retour par-dessous. Téléphone et tablette : en
 * colonne, le jeton longe le côté droit des cercles et revient par la gauche.
 * Animations réduites : pas de jeton, la phrase d'un temps s'affiche à son
 * survol.
 */
export function MethodPhases({
  steps,
  map,
  loop,
}: {
  steps: MethodStep[];
  map: { label: string; from: string; to: string };
  loop: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const journey = useFigureLoop(ref, JOURNEY, picked !== null, RESTART);
  // Passage en cours : 0 départ, 1 à 5 les temps, 6 l'aboutissement, 7 le retour.
  const at = picked !== null ? picked + 1 : journey.still ? -1 : journey.phase;
  const stops = useRef<(HTMLElement | null)[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const legs = useRef<(SVGPathElement | null)[]>([]);
  const token = useRef<SVGGElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const position = useRef<Point | null>(null);
  // Fin d'un survol : le jeton repart du temps survolé, pas d'où il était.
  const release = () => {
    if (picked !== null && !journey.still) journey.setPhase(picked + 1);
    setPicked(null);
  };

  // Le parcours, mesuré sur la carte telle qu'elle s'affiche, et remesuré
  // quand elle ou ses étapes changent de taille (police chargée, fenêtre).
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const measure = () => {
      const origin = box.getBoundingClientRect();
      const boxes = stops.current.map((element) => {
        const rect = element?.getBoundingClientRect();
        return rect ? { left: rect.left - origin.left, top: rect.top - origin.top, right: rect.right - origin.left, bottom: rect.bottom - origin.top } : null;
      });
      if (boxes.length < 4 || boxes.some((item) => !item)) return;
      const all = boxes as Box[];
      setRoute(trace(all[0], all.slice(1, -1), all[all.length - 1]));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    stops.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  // Le jeton suit le tracé du passage en cours pendant toute sa durée ; au
  // survol d'un temps, il rejoint le sommet de son cercle. Déplacé point par
  // point dans le dessin (pas de calque animé au-dessus du texte).
  useEffect(() => {
    const dot = token.current;
    if (!dot) return;
    if (!route || at < 0 || journey.still) {
      dot.style.visibility = "hidden";
      return;
    }
    const leg = picked === null ? legs.current[at] : null;
    const length = leg?.getTotalLength() ?? 0;
    const duration = leg ? JOURNEY[at] : 450;
    const from = position.current;
    const target = picked !== null ? route.apex[picked] : null;
    const back = at === JOURNEY.length - 1;
    const begin = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const t = Math.min(1, (now - begin) / duration);
      let point = target ?? { x: 0, y: 0 };
      if (leg) {
        const along = leg.getPointAtLength(length * glide(t));
        point = { x: along.x, y: along.y };
        // Reprise après un survol : il rejoint le tracé en douceur.
        const join = Math.min(1, (now - begin) / 350);
        if (from && join < 1) point = mix(from, point, smooth(join));
        if (back) trail.current?.style.setProperty("stroke-dashoffset", String(1 - glide(t)));
      } else if (from && target) {
        point = mix(from, target, smooth(t));
      }
      position.current = point;
      dot.setAttribute("transform", `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`);
      dot.style.visibility = "visible";
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [at, picked, route, journey.still]);

  const stepAt = at >= 1 && at <= 5 ? at - 1 : -1;
  const returning = at === 7;
  const caption =
    at === 0 ? { title: null, text: map.from } : stepAt >= 0 ? { title: steps[stepAt].phase, text: steps[stepAt].lead } : at === 6 ? { title: null, text: map.to } : returning ? { title: null, text: loop } : null;

  return (
    <nav aria-label={map.label} className="mt-20 md:mt-28">
      <p className="text-center text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink/55">{map.label}</p>

      <div
        ref={ref}
        className="relative mt-10 flex flex-col items-center gap-5 lg:mb-11 lg:flex-row lg:justify-center lg:gap-6"
        onPointerLeave={(event) => event.pointerType === "mouse" && release()}
      >
        {/* Le chemin, d'un bout à l'autre, derrière les étapes. */}
        <span aria-hidden="true" className="absolute bottom-6 left-1/2 top-6 w-px -translate-x-1/2 bg-ink/12 lg:bottom-auto lg:left-16 lg:right-16 lg:top-1/2 lg:h-px lg:w-auto lg:translate-x-0" />

        <End
          ref={(element) => {
            stops.current[0] = element;
          }}
          icon="circle-help"
          lit={at === 0}
        >
          {map.from}
        </End>

        <ol className="relative flex flex-col items-center lg:flex-row">
          {steps.map((step, index) => {
            const lit = at === index + 1;
            const passed = at > index + 1 && at <= 6;
            return (
              <li key={step.id} className={cn("relative", index > 0 && "-mt-4 lg:-ml-5 lg:mt-0")} style={{ ...stepColor(index), zIndex: lit ? 10 : steps.length - index }}>
                <a
                  ref={(element) => {
                    stops.current[index + 1] = element;
                  }}
                  href={`#${step.id}`}
                  onPointerEnter={(event) => event.pointerType === "mouse" && setPicked(index)}
                  onFocus={() => setPicked(index)}
                  onBlur={release}
                  aria-describedby={lit ? "methode-carte-legende" : undefined}
                  className={cn(
                    "group flex h-[6.5rem] w-[6.5rem] flex-col items-center justify-center gap-1.5 rounded-full text-center transition-[background-color,border-color] duration-500 lg:h-28 lg:w-28",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60",
                    lit
                      ? "border-2 border-[color:var(--step)] bg-[color-mix(in_srgb,var(--step)_26%,var(--page))]"
                      : passed
                        ? "border-[1.5px] border-[color:var(--step)] bg-[color-mix(in_srgb,var(--step)_12%,var(--page))]"
                        : "border-[1.5px] border-[color:color-mix(in_srgb,var(--step)_60%,transparent)] bg-[color-mix(in_srgb,var(--step)_6%,var(--page))]",
                  )}
                >
                  <StepGlyph index={index} className={cn("h-5 w-5 transition-colors duration-500", lit || passed ? "text-[var(--step)]" : "text-ink/55", lit && "glyph-draw")} />
                  <span className={cn("text-[0.75rem] font-semibold transition-colors duration-500", lit ? "text-ink" : "text-ink/75")}>{step.phase}</span>
                </a>
              </li>
            );
          })}
        </ol>

        <End
          ref={(element) => {
            stops.current[steps.length + 1] = element;
          }}
          icon="circle-check-big"
          lit={at === 6}
          strong
        >
          {map.to}
        </End>

        {/* Le retour, le jeton et son parcours, dessinés sur la carte mesurée. */}
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
          {route ? (
            <>
              <path d={route.track} fill="none" stroke="currentColor" strokeWidth="1.25" className="text-ink/25" />
              <path
                ref={trail}
                d={route.track}
                pathLength={1}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="1 1"
                style={{ strokeDashoffset: 1 }}
                className={cn("text-[var(--step-5)] transition-opacity duration-700", returning ? "opacity-100" : "opacity-0")}
              />
              <path
                d={route.arrow}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn("transition-colors duration-500", returning ? "text-[var(--step-5)]" : "text-ink/35")}
              />
              {route.legs.map((leg, index) => (
                <path
                  key={index}
                  ref={(element) => {
                    legs.current[index] = element;
                  }}
                  d={leg}
                  fill="none"
                  stroke="none"
                />
              ))}
            </>
          ) : null}
          <g ref={token} style={{ visibility: "hidden" }}>
            <g style={stepColor(Math.max(0, Math.min(4, at - 1)))} className="fill-[var(--step)] [&>circle]:transition-[fill] [&>circle]:duration-500">
              <circle r="9.5" opacity="0.22" />
              <circle r="5" />
            </g>
          </g>
        </svg>
      </div>

      {/* Ce que fait le temps traversé : sa phrase-clé, sous la carte. */}
      <p id="methode-carte-legende" className="mx-auto mt-6 flex min-h-[3.5rem] max-w-xl items-start justify-center gap-2 text-balance text-center text-sm leading-snug text-ink/80 lg:mt-3">
        {caption ? (
          <span key={at} className="caption-in" style={stepAt >= 0 ? stepColor(stepAt) : undefined}>
            {caption.title ? <span className="font-semibold text-[var(--step)]">{caption.title} · </span> : null}
            {returning ? <LucideIcon name="refresh-ccw" className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" /> : null}
            {caption.text}
          </span>
        ) : (
          <span className="text-ink/60">
            <LucideIcon name="refresh-ccw" className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
            {loop}
          </span>
        )}
      </p>
    </nav>
  );
}

/** Le point de départ et l'aboutissement, de part et d'autre des cinq temps. */
function End({
  children,
  icon,
  lit,
  strong = false,
  ref,
}: {
  children: string;
  icon: "circle-help" | "circle-check-big";
  lit: boolean;
  strong?: boolean;
  ref: (element: HTMLElement | null) => void;
}) {
  return (
    <span
      ref={ref}
      className={cn(
        "relative z-10 flex max-w-[11rem] items-center gap-2 rounded-full border bg-page px-3.5 py-2 text-[0.8125rem] leading-snug transition-colors duration-500",
        lit ? "border-ink/45 text-ink" : "border-ink/15 text-ink/70",
        strong && "font-semibold",
      )}
    >
      <LucideIcon name={icon} className={cn("h-4 w-4 shrink-0 transition-colors duration-500", lit ? "text-ink" : "text-ink/50")} />
      {children}
    </span>
  );
}

/** Ralentit à l'approche de chaque étape sans jamais s'y arrêter. */
function glide(t: number) {
  return 0.5 * t + 0.5 * smooth(t);
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function mix(a: Point, b: Point, k: number): Point {
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

const xy = (point: Point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
/** Arc de cercle dans le sens des aiguilles d'une montre. */
const arc = (radius: number, to: Point) => `A${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${xy(to)}`;

/**
 * Le parcours du jeton, un tracé par passage, sur les bords mêmes de la
 * carte et dans le sens des aiguilles d'une montre : du départ au premier
 * cercle, le sommet de chaque cercle jusqu'au point où il croise le suivant,
 * le tour de l'aboutissement, puis le retour (la flèche) jusqu'au dessous de
 * Comprendre, et le bord de Comprendre jusqu'à son entrée.
 */
function trace(from: Box, circles: Box[], to: Box): Route {
  const center = circles.map((box) => ({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 }));
  // Sur le milieu de la bordure.
  const r = (circles[0].right - circles[0].left) / 2 - 0.75;
  const row = Math.abs(center[1].x - center[0].x) > Math.abs(center[1].y - center[0].y);
  const last = center.length - 1;
  const on = (i: number, dx: number, dy: number) => ({ x: center[i].x + dx * r, y: center[i].y + dy * r });
  // Entrée et sortie d'un cercle, son sommet (côté parcouru) et son dessous (côté du retour).
  const enter = (i: number) => (row ? on(i, -1, 0) : on(i, 0, -1));
  const leave = (i: number) => (row ? on(i, 1, 0) : on(i, 0, 1));
  const apex = (i: number) => (row ? on(i, 0, -1) : on(i, 1, 0));
  const under = row ? on(0, 0, 1) : on(0, -1, 0);
  // Là où deux cercles voisins se croisent, côté parcouru (rien s'ils ne se touchent pas).
  const meet = (i: number) => {
    const half = Math.hypot(center[i + 1].x - center[i].x, center[i + 1].y - center[i].y) / 2;
    if (half >= r) return null;
    const rise = Math.sqrt(r * r - half * half);
    const mid = { x: (center[i].x + center[i + 1].x) / 2, y: (center[i].y + center[i + 1].y) / 2 };
    return row ? { x: mid.x, y: mid.y - rise } : { x: mid.x + rise, y: mid.y };
  };

  const steps = center.map((_, i) => {
    const join = i > 0 ? meet(i - 1) : null;
    const start = i === 0 ? enter(0) : (join ?? leave(i - 1));
    const bridge = i > 0 && !join ? `L${xy(enter(i))}` : "";
    const end = i < last ? (meet(i) ?? leave(i)) : leave(i);
    return `M${xy(start)}${bridge}${arc(r, end)}`;
  });

  const cap = (to.bottom - to.top) / 2;
  const middle = { x: (to.left + to.right) / 2, y: (to.top + to.bottom) / 2 };
  let start: string;
  let solution: string;
  let track: string;
  let arrow: string;
  if (row) {
    start = `M${xy({ x: from.right, y: (from.top + from.bottom) / 2 })}L${xy(enter(0))}`;
    // Le tour de l'aboutissement : son bord haut, son bout arrondi, son bord bas.
    solution =
      `M${xy(leave(last))}L${xy({ x: to.left, y: middle.y })}${arc(cap, { x: to.left + cap, y: to.top })}` +
      `L${xy({ x: to.right - cap, y: to.top })}${arc(cap, { x: to.right - cap, y: to.bottom })}L${xy({ x: to.left + cap, y: to.bottom })}`;
    // Le retour, sous les cercles, jusqu'au dessous de Comprendre.
    const lane = Math.max(under.y, to.bottom) + 22;
    const drop = lane - to.bottom;
    const out = { x: to.left + cap, y: to.bottom };
    const rise = lane - under.y;
    const tip = { x: under.x + rise * 2, y: lane };
    track =
      `M${xy(out)}C${xy({ x: out.x - drop / 2, y: out.y })} ${xy({ x: out.x - drop / 2, y: lane })} ${xy({ x: out.x - drop, y: lane })}` +
      `L${xy(tip)}C${xy({ x: under.x + rise, y: lane })} ${xy({ x: under.x + rise, y: under.y })} ${xy(under)}`;
    arrow = `M${xy({ x: tip.x + 6, y: tip.y - 4.5 })}L${xy(tip)}L${xy({ x: tip.x + 6, y: tip.y + 4.5 })}`;
  } else {
    start = `M${xy({ x: (from.left + from.right) / 2, y: from.bottom })}L${xy(enter(0))}`;
    // Le tour de l'aboutissement : son bord haut, son bout arrondi, son bord bas, l'autre bout.
    solution =
      `M${xy(leave(last))}L${xy({ x: middle.x, y: to.top })}L${xy({ x: to.right - cap, y: to.top })}` +
      `${arc(cap, { x: to.right - cap, y: to.bottom })}L${xy({ x: to.left + cap, y: to.bottom })}${arc(cap, { x: to.left, y: middle.y })}`;
    // Le retour, à gauche des cercles, jusqu'au flanc de Comprendre.
    const lane = Math.min(to.left, under.x) - 18;
    const out = { x: to.left, y: middle.y };
    const lift = Math.max(24, (out.x - lane) * 1.1);
    const tip = { x: lane, y: under.y + (under.x - lane) * 2 };
    track =
      `M${xy(out)}C${xy({ x: out.x, y: out.y - lift / 2 })} ${xy({ x: lane, y: out.y - lift / 2 })} ${xy({ x: lane, y: out.y - lift })}` +
      `L${xy(tip)}C${xy({ x: lane, y: (tip.y + under.y) / 2 })} ${xy({ x: under.x, y: (tip.y + under.y) / 2 })} ${xy(under)}`;
    arrow = `M${xy({ x: tip.x - 4.5, y: tip.y + 6 })}L${xy(tip)}L${xy({ x: tip.x + 4.5, y: tip.y + 6 })}`;
  }

  return {
    legs: [start, ...steps, solution, `${track}${arc(r, enter(0))}`],
    track,
    arrow,
    apex: center.map((_, i) => apex(i)),
  };
}
