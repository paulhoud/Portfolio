"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { MethodStep } from "@/i18n/types";
import { StepGlyph } from "./MethodTimeline";

/**
 * Vue d'ensemble de la méthode, avant le détail : les cinq temps côte à côte,
 * chacun menant à son étape, et une boucle qui ramène du dernier au premier
 * (la méthode n'est pas une ligne droite). La boucle se trace quand elle
 * entre à l'écran ; au survol d'un temps, son pictogramme se retrace.
 * Tablette et ordinateur : sur téléphone, la frise détaillée
 * suffit.
 */
export function MethodPhases({ steps, label, loop }: { steps: MethodStep[]; label: string; loop: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <nav aria-label={label} className="mx-auto mt-14 hidden max-w-3xl sm:block md:mt-16">
      <ol className="relative grid grid-cols-5">
        {/* Le fil qui relie les cinq temps, de centre à centre. */}
        <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-6 h-px bg-ink/15" />
        {steps.map((step, index) => (
          <li key={step.id} className="relative flex justify-center">
            <a
              href={`#${step.id}`}
              className="group flex flex-col items-center gap-3 rounded-lg px-1 text-center focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink/50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 bg-[var(--background)] text-ink/70 transition-colors duration-300 group-hover:border-ink/40 group-hover:text-ink">
                <StepGlyph index={index} className="glyph-trace h-5 w-5" />
              </span>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink/70 transition-colors duration-300 group-hover:text-ink">
                {step.phase}
              </span>
            </a>
          </li>
        ))}
      </ol>

      {/* Du dernier temps au premier : on y revient. */}
      <div aria-hidden="true" className="relative mt-2">
        <svg viewBox="0 0 1000 56" preserveAspectRatio="none" className="block h-12 w-full overflow-visible text-ink/35">
          <motion.path
            d="M900 4 C900 40 870 48 820 48 L180 48 C130 48 100 40 100 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            initial={reduceMotion ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
          <path d="M92 16 L100 4 L108 16" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <p className="mt-1 text-center text-xs italic text-ink/60">{loop}</p>
      </div>
    </nav>
  );
}
