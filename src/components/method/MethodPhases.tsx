"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { MethodStep } from "@/i18n/types";
import { cn } from "@/lib/utils";
import { StepGlyph, stepColor } from "./MethodTimeline";

/**
 * Carte d'ensemble de la méthode, avant le détail (refaite le 28 oct. 2026) :
 * d'un besoin à une solution qui vit, cinq cercles de couleur qui se
 * chevauchent, comme les temps eux-mêmes, chacun menant à son étape. Une
 * boucle ramène du dernier au premier, tracée quand elle entre à l'écran. Au
 * survol d'un temps, son pictogramme se retrace.
 *
 * Ordinateur : en ligne. Téléphone et tablette : en colonne, les cercles
 * empilés.
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
  const reduceMotion = useReducedMotion();

  return (
    <nav aria-label={map.label} className="mt-20 md:mt-28">
      <p className="text-center text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink/55">{map.label}</p>

      <div className="mt-10 flex flex-col items-center gap-5 lg:flex-row lg:justify-center lg:gap-6">
        <End>{map.from}</End>
        <Arrow />
        <ol className="flex flex-col items-center lg:flex-row">
          {steps.map((step, index) => (
            <li key={step.id} className={cn("relative", index > 0 && "-mt-4 lg:-ml-5 lg:mt-0")} style={{ ...stepColor(index), zIndex: steps.length - index }}>
              <a
                href={`#${step.id}`}
                className={cn(
                  "group flex h-[6.5rem] w-[6.5rem] flex-col items-center justify-center gap-1.5 rounded-full border-[1.5px] text-center transition-colors duration-300 lg:h-28 lg:w-28",
                  "border-[color:var(--step)] bg-[color-mix(in_srgb,var(--step)_9%,transparent)] hover:bg-[color-mix(in_srgb,var(--step)_18%,transparent)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60",
                )}
              >
                <StepGlyph index={index} className="glyph-trace h-5 w-5 text-[var(--step)]" />
                <span className="text-[0.75rem] font-semibold text-ink">{step.phase}</span>
              </a>
            </li>
          ))}
        </ol>
        <Arrow />
        <End strong>{map.to}</End>
      </div>

      {/* Du dernier temps au premier : on y revient. */}
      <div aria-hidden="true" className="mx-auto mt-3 hidden max-w-[34rem] lg:block">
        <svg viewBox="0 0 1000 56" preserveAspectRatio="none" className="block h-10 w-full overflow-visible text-ink/35">
          <motion.path
            d="M930 4 C930 40 900 48 850 48 L150 48 C100 48 70 40 70 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            initial={reduceMotion ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
          <path d="M62 16 L70 4 L78 16" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <p className="mt-4 text-center text-xs italic text-ink/60 lg:mt-1">↺ {loop}</p>
    </nav>
  );
}

/** Le point de départ et l'aboutissement, de part et d'autre des cinq temps. */
function End({ children, strong = false }: { children: string; strong?: boolean }) {
  return (
    <span
      className={cn(
        "max-w-[9.5rem] text-balance text-center text-[0.8125rem] leading-snug",
        strong ? "font-semibold text-ink lg:text-left" : "text-ink/65 lg:text-right",
      )}
    >
      {children}
    </span>
  );
}

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 rotate-90 text-ink/35 lg:rotate-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h15M14 7l5 5-5 5" />
    </svg>
  );
}
