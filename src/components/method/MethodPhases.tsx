"use client";

import { useEffect, useRef, useState } from "react";
import { LucideIcon } from "@/components/icons/Lucide";
import type { MethodStep } from "@/i18n/types";
import { usePrefersReducedMotion } from "@/lib/reducedMotion";
import { cn } from "@/lib/utils";
import { StepGlyph, stepColor } from "./MethodTimeline";

// Le dessin, en unités : une roue de 1000 de large, et au-dessus la place du départ.
const WHEEL = 1000;
const HEAD = 130;
const MIDDLE = WHEEL / 2;
/** Le bord de la roue, où passe le jeton : il ne croise jamais un texte. */
const RIM = 485;
/** Le centre des étapes, et leur rayon : elles touchent presque le bord. */
const ORBIT = 335;
const STOP = 135;

/** Cinq temps, plus la solution : six étapes, à intervalles égaux. */
const STOPS = 6;
const LEG = 360 / STOPS;
/** Le temps d'une étape à la suivante : c'est la seule horloge de la carte. */
const LEG_MS = 3400;
/** Départ : le besoin reste affiché, puis le jeton descend sur la roue, à la même vitesse. */
const WAIT_MS = 1400;
const ENTRY = HEAD + (MIDDLE - RIM);
const SPEED = ((RIM * Math.PI) / 3) / LEG_MS;
const ENTRY_MS = ENTRY / SPEED;
/** Survol : le jeton rejoint l'étape par le plus court chemin, en douceur. */
const JOIN_MS = 160;

const polar = (radius: number, degrees: number) => {
  const angle = ((degrees - 90) * Math.PI) / 180;
  return { x: MIDDLE + radius * Math.cos(angle), y: MIDDLE + radius * Math.sin(angle) };
};
const xy = (point: { x: number; y: number }) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;

const percentX = (x: number) => `${(x / WHEEL) * 100}%`;
const percentY = (y: number) => `${((y + HEAD) / (WHEEL + HEAD)) * 100}%`;

/** Teinte d'une étape : celle de son temps, l'encre pour la solution. */
const stopColor = (index: number) => (index < STOPS - 1 ? stepColor(index) : ({ "--step": "var(--ink)" } as React.CSSProperties));

/**
 * Carte d'ensemble de la méthode, « Du problème à la solution » (refaite le
 * 6 nov. 2026, à la demande de Paul : c'est un cycle, elle doit en avoir la
 * forme, et le point n'allait pas au même rythme que la progression).
 *
 * Une roue : le besoin y entre par le haut, à Comprendre, et de la solution on
 * revient à Comprendre, par le pointillé. Le jeton fait le tour sur le bord, à
 * vitesse constante. Tout se déduit de sa position, sur une seule horloge : le
 * bord se colore derrière lui, et une étape s'allume à l'instant où il arrive
 * à son sommet, avec sa phrase-clé au centre (sous la roue sur téléphone).
 *
 * Survoler ou parcourir au clavier une étape y amène le jeton et l'y arrête ;
 * la choisir mène à son temps, plus bas. Tourne seulement à l'écran. Animations
 * réduites : pas de jeton, la phrase d'une étape s'affiche à son survol.
 *
 * Le dessin est sous les étapes, et ne bouge que par ses attributs : aucun
 * calque animé au-dessus du texte.
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
  const still = usePrefersReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const dot = useRef<SVGGElement>(null);
  const fills = useRef<(SVGPathElement | null)[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  // Étape atteinte par le jeton : -1 tant qu'il n'est pas sur la roue.
  const [reached, setReached] = useState(-1);
  const at = picked ?? (still ? -1 : reached);
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);

  useEffect(() => {
    const wheel = box.current;
    if (still || !wheel) return;
    // Temps écoulé depuis le départ, puis angle parcouru sur la roue.
    let waited = 0;
    let turned: number | null = null;
    let last = 0;
    let frame = 0;

    const draw = (now: number) => {
      const elapsed = Math.min(now - (last || now), 100);
      last = now;
      const target = pickedRef.current;
      if (target !== null) {
        const goal = target * LEG;
        const from = turned ?? goal;
        const gap = ((goal - from + 540) % 360) - 180;
        turned = from + gap * (1 - Math.exp(-elapsed / JOIN_MS));
      } else if (turned !== null) {
        turned += (elapsed / LEG_MS) * LEG;
      } else {
        waited += elapsed;
        if (waited >= WAIT_MS + ENTRY_MS) turned = ((waited - WAIT_MS - ENTRY_MS) / LEG_MS) * LEG;
      }

      let position;
      if (turned === null) {
        const down = Math.max(0, waited - WAIT_MS) * SPEED;
        position = { x: MIDDLE, y: -HEAD + down };
      } else {
        position = polar(RIM, turned);
      }
      dot.current?.setAttribute("transform", `translate(${xy(position)})`);

      const angle = turned === null ? -1 : ((turned % 360) + 360) % 360;
      const leg = angle < 0 ? -1 : Math.floor(angle / LEG);
      const progress = angle < 0 ? 0 : (angle - leg * LEG) / LEG;
      fills.current.forEach((fill, index) => {
        if (!fill) return;
        if (index <= leg) {
          fill.style.transition = "none";
          fill.style.opacity = "1";
          fill.style.strokeDashoffset = String(index < leg ? 0 : 1 - progress);
        } else {
          // Le tour suivant efface doucement ce que le précédent a coloré.
          fill.style.transition = "opacity 0.9s ease";
          fill.style.opacity = "0";
        }
      });
      setReached(leg);
      frame = requestAnimationFrame(draw);
    };

    const run = (on: boolean) => {
      cancelAnimationFrame(frame);
      last = 0;
      if (on) frame = requestAnimationFrame(draw);
    };
    let onScreen = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        run(onScreen && !document.hidden);
      },
      { threshold: 0.2 },
    );
    observer.observe(wheel);
    const onVisibility = () => run(onScreen && !document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [still]);

  const pickOn = (index: number) => ({
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") setPicked(index);
    },
  });
  const stepAt = at >= 0 && at < steps.length ? at : -1;
  const solved = at === steps.length;

  return (
    <nav aria-label={map.label} className="mt-20 md:mt-28">
      <p className="text-center text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink/55">{map.label}</p>

      <div
        ref={box}
        className="relative mx-auto mb-28 mt-8 w-full max-w-[34rem] select-none sm:mb-0"
        style={{ aspectRatio: `${WHEEL} / ${WHEEL + HEAD}` }}
        onPointerLeave={(event) => event.pointerType === "mouse" && setPicked(null)}
      >
        <svg aria-hidden="true" viewBox={`0 ${-HEAD} ${WHEEL} ${WHEEL + HEAD}`} className="absolute inset-0 h-full w-full overflow-visible" fill="none">
          {/* L'entrée du besoin sur la roue. */}
          <path d={`M${MIDDLE} ${-HEAD}V${MIDDLE - RIM}`} strokeWidth="3" className="stroke-ink/25" />
          {Array.from({ length: STOPS }, (_, index) => {
            const start = index * LEG;
            const arc = `M${xy(polar(RIM, start))}A${RIM} ${RIM} 0 0 1 ${xy(polar(RIM, start + LEG))}`;
            const middle = start + LEG / 2;
            const back = index === STOPS - 1;
            return (
              <g key={index} style={stopColor(index)}>
                {/* Le bord, à la teinte de l'étape ; le retour, en pointillés. */}
                <path d={arc} strokeWidth="3" strokeDasharray={back ? "10 12" : undefined} className="stroke-[var(--step)] opacity-35" />
                <path
                  ref={(element) => {
                    fills.current[index] = element;
                  }}
                  d={arc}
                  pathLength={1}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="1 1"
                  className="stroke-[var(--step)]"
                  style={still ? { strokeDashoffset: 0 } : { strokeDashoffset: 1, opacity: 0 }}
                />
                {/* Le sens du cycle. */}
                <path
                  d="M-9 -15L9 0L-9 15"
                  transform={`translate(${xy(polar(RIM, middle))}) rotate(${middle})`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stroke-ink/40"
                />
              </g>
            );
          })}
          {still ? null : (
            <g ref={dot} transform={`translate(${MIDDLE} ${-HEAD})`} style={stopColor(Math.max(at, 0))} className="fill-[var(--step)] [&>circle]:transition-[fill] [&>circle]:duration-500">
              <circle r="25" opacity="0.22" />
              <circle r="13" />
            </g>
          )}
        </svg>

        {/* Le départ. */}
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <span
            className={cn(
              "flex items-center gap-2 rounded-full border bg-page px-3.5 py-1.5 text-[0.8125rem] leading-snug transition-colors duration-500",
              !still && reached < 0 && picked === null ? "border-ink/45 text-ink" : "border-ink/15 text-ink/70",
            )}
          >
            <LucideIcon name="circle-help" className="h-4 w-4 shrink-0" />
            {map.from}
          </span>
        </div>

        {/* Les cinq temps, et la solution. */}
        <ol className="contents">
          {[...steps, null].map((step, index) => {
            const center = polar(ORBIT, index * LEG);
            const lit = at === index;
            const passed = at > index;
            const face = cn(
              "flex h-full w-full flex-col items-center justify-center gap-1 rounded-full text-center transition-[background-color,border-color] duration-500 sm:gap-1.5",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60",
              lit
                ? "border-2 border-[color:var(--step)] bg-[color-mix(in_srgb,var(--step)_26%,var(--page))]"
                : passed
                  ? "border-[1.5px] border-[color:var(--step)] bg-[color-mix(in_srgb,var(--step)_12%,var(--page))]"
                  : "border-[1.5px] border-[color:color-mix(in_srgb,var(--step)_55%,transparent)] bg-[color-mix(in_srgb,var(--step)_6%,var(--page))]",
            );
            const label = cn("px-1 text-[0.6875rem] font-semibold leading-tight transition-colors duration-500 sm:text-[0.8125rem]", lit ? "text-ink" : "text-ink/75");
            return (
              <li
                key={step?.id ?? "solution"}
                className="absolute aspect-square"
                style={{ ...stopColor(index), left: percentX(center.x - STOP), top: percentY(center.y - STOP), width: percentX(STOP * 2) }}
              >
                {step ? (
                  <a
                    href={`#${step.id}`}
                    {...pickOn(index)}
                    onFocus={() => setPicked(index)}
                    onBlur={() => setPicked(null)}
                    aria-describedby={lit ? "methode-carte-legende" : undefined}
                    className={face}
                  >
                    <StepGlyph index={index} className={cn("h-5 w-5 transition-colors duration-500", lit || passed ? "text-[var(--step)]" : "text-ink/55", lit && "glyph-draw")} />
                    <span className={label}>{step.phase}</span>
                  </a>
                ) : (
                  <span {...pickOn(index)} className={face}>
                    <LucideIcon name="circle-check-big" className={cn("h-5 w-5 transition-colors duration-500", lit ? "text-ink" : "text-ink/55")} />
                    <span className={label}>{map.to}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {/* Ce que fait l'étape : au centre de la roue, sous la roue sur téléphone. */}
        <p
          id="methode-carte-legende"
          className="absolute inset-x-0 top-full mt-5 flex min-h-[5rem] flex-col items-center text-balance text-center text-sm leading-snug text-ink/80 sm:inset-x-[29%] sm:top-[36.5%] sm:mt-0 sm:h-[37%] sm:justify-center"
        >
          {stepAt >= 0 ? (
            <span key={at} className="caption-in" style={stepColor(stepAt)}>
              <span className="mb-1 block font-semibold text-[var(--step)]">{steps[stepAt].phase}</span>
              {steps[stepAt].lead}
            </span>
          ) : solved ? (
            <span key={at} className="caption-in">
              <span className="mb-1 block font-semibold text-ink">{map.to}</span>
              <LucideIcon name="refresh-ccw" className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
              {loop}
            </span>
          ) : still ? (
            <span className="text-ink/60">
              <LucideIcon name="refresh-ccw" className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />
              {loop}
            </span>
          ) : (
            <span key={at} className="caption-in">
              {map.from}
            </span>
          )}
        </p>
      </div>
    </nav>
  );
}
