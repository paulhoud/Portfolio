"use client";

import { useEffect, useRef, useState } from "react";
import { LucideIcon } from "@/components/icons/Lucide";
import type { MethodStep } from "@/i18n/types";
import { cn } from "@/lib/utils";
import { StepGlyph, stepColor } from "./MethodTimeline";
import { useFigureLoop } from "./useFigureLoop";

/** Départ, cinq temps, aboutissement, retour : la durée de chaque passage. */
const JOURNEY = [1500, 1900, 1900, 1900, 1900, 1900, 2000, 2000] as const;

/**
 * Carte d'ensemble de la méthode, avant le détail (refaite le 28 oct. 2026,
 * brief de Paul : qu'elle explique le cheminement au lieu de le représenter).
 *
 * D'un besoin à une solution qui vit, cinq cercles qui se chevauchent comme
 * les temps eux-mêmes. Un jeton fait le chemin en boucle : chaque temps
 * s'allume à son passage, sa phrase-clé s'affiche dessous, puis la boucle
 * ramène au départ (« et on y revient »). Survoler ou parcourir au clavier un
 * temps l'arrête dessus ; le toucher ou le choisir mène à son étape.
 *
 * Ordinateur : en ligne. Téléphone et tablette : en colonne. Animations
 * réduites : pas de jeton, la phrase d'un temps s'affiche à son survol.
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
  const journey = useFigureLoop(ref, JOURNEY, picked !== null);
  // Passage en cours : 0 départ, 1 à 5 les temps, 6 l'aboutissement, 7 le retour.
  const at = picked !== null ? picked + 1 : journey.still ? -1 : journey.phase;
  const stops = useRef<(HTMLElement | null)[]>([]);
  const [token, setToken] = useState<{ x: number; y: number } | null>(null);

  // Le jeton se pose sur l'étape en cours ; au retour, il s'efface le temps
  // que la boucle se trace, puis reprend au départ.
  useEffect(() => {
    if (at < 0 || at > 6) return;
    const place = () => {
      const box = ref.current?.getBoundingClientRect();
      const stop = stops.current[at]?.getBoundingClientRect();
      // Posé sur le bord haut de l'étape : il ne cache ni son nom ni son pictogramme.
      if (box && stop) setToken({ x: stop.left - box.left + stop.width / 2, y: stop.top - box.top });
    };
    const frame = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
    };
  }, [at]);

  const stepAt = at >= 1 && at <= 5 ? at - 1 : -1;
  const returning = at === 7;
  const caption =
    at === 0 ? { title: null, text: map.from } : stepAt >= 0 ? { title: steps[stepAt].phase, text: steps[stepAt].lead } : at === 6 ? { title: null, text: map.to } : returning ? { title: null, text: loop } : null;

  return (
    <nav aria-label={map.label} className="mt-20 md:mt-28">
      <p className="text-center text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink/55">{map.label}</p>

      <div
        ref={ref}
        className="relative mt-10 flex flex-col items-center gap-5 lg:flex-row lg:justify-center lg:gap-6"
        onPointerLeave={(event) => event.pointerType === "mouse" && setPicked(null)}
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
                  onBlur={() => setPicked(null)}
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
            stops.current[6] = element;
          }}
          icon="circle-check-big"
          lit={at === 6}
          strong
        >
          {map.to}
        </End>

        {/* Le jeton qui fait le chemin, à la couleur du temps traversé. */}
        {token && at >= 0 && !returning ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--step)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--step)_22%,transparent)] transition-[left,top,background-color] duration-[1100ms] ease-in-out"
            style={{ ...stepColor(Math.max(0, Math.min(4, at - 1))), left: token.x, top: token.y }}
          />
        ) : null}
      </div>

      {/* Du dernier temps au premier : la boucle se trace au retour. */}
      <div aria-hidden="true" className="mx-auto mt-3 hidden max-w-[34rem] lg:block">
        <svg viewBox="0 0 1000 56" preserveAspectRatio="none" className={cn("block h-10 w-full overflow-visible transition-colors duration-500", returning ? "text-[var(--step-5)]" : "text-ink/30")}>
          <path d="M930 4 C930 40 900 48 850 48 L150 48 C100 48 70 40 70 6" fill="none" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" className={returning ? "flow-dash" : undefined} />
          <path d="M62 16 L70 4 L78 16" fill="none" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
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
