"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type { MethodStep } from "@/i18n/types";

/**
 * Pictogrammes des cinq temps de la méthode.
 *
 * Dessinés au trait dans une grammaire commune (même graisse, mêmes
 * arrondis, formes géométriques abstraites) pour illustrer chaque temps sans
 * détourner l'attention du texte : loupe et indices pour comprendre, points
 * reliés pour explorer, cadres superposés pour concevoir, cube pour
 * expérimenter et construire, boucle validée pour valider et itérer.
 *
 * L'ordre suit celui des temps ; un temps supplémentaire s'afficherait sans
 * pictogramme plutôt que d'en réutiliser un à contresens.
 */
const stepGlyphs = [
  // Comprendre : observer, réunir des indices dispersés.
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 L20.5 20.5" />
    <circle cx="8.4" cy="9.6" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="11.4" cy="12.4" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="12.6" cy="8.4" r="0.85" fill="currentColor" stroke="none" />
  </>,
  // Explorer : des pistes reliées, une encore ouverte.
  <>
    <path d="M6.2 16.2 L10.3 8.3" />
    <path d="M12.9 7.6 L17.4 10.2" />
    <path d="M18.4 12.6 L16 17" strokeDasharray="1.2 2" />
    <circle cx="5.4" cy="17.8" r="1.7" />
    <circle cx="11.4" cy="6.4" r="1.7" />
    <circle cx="18.9" cy="11" r="1.7" />
    <circle cx="15.2" cy="18.6" r="1.7" />
  </>,
  // Concevoir : versions successives qui se superposent.
  <>
    <rect x="3" y="3" width="13" height="13" rx="2.5" />
    <rect x="8" y="8" width="13" height="13" rx="2.5" />
  </>,
  // Expérimenter : un volume qu'on construit.
  <>
    <path d="M12 3.2 L19.8 7.6 V16.4 L12 20.8 L4.2 16.4 V7.6 Z" />
    <path d="M4.2 7.6 L12 12 L19.8 7.6" />
    <path d="M12 12 V20.8" />
  </>,
  // Valider : la boucle des itérations, et ce qui est acquis.
  <>
    <path d="M19.6 12a7.6 7.6 0 1 1-2.2-5.4" />
    <path d="M19.8 4.2 V8.4 H15.6" />
    <path d="M8.6 12.3 L11 14.7 L15.4 10" />
  </>,
];

export function StepGlyph({ index, className }: { index: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-[1.15rem] w-[1.15rem] md:h-[1.3rem] md:w-[1.3rem]"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {stepGlyphs[index]}
    </svg>
  );
}

/**
 * Hauteur à laquelle la frise avance : quand le centre d'une pastille passe
 * cette ligne de l'écran (62 % de sa hauteur), le fil l'atteint et elle
 * s'allume. Assez bas pour que la dernière étape s'allume avant la fin de la
 * page.
 */
const READ_LINE = "62%";
const READ_SPAN = ["center 65%", "center 59%"] as const;

type Labels = { ai: string; tools: string };

/**
 * Frise de la méthode, animée au défilement : un fil se remplit d'une pastille
 * à l'autre au rythme de la lecture, et chaque temps atteint passe à l'encre
 * pleine. Tout est lié au défilement (aucune minuterie) : on peut remonter, la
 * frise se vide d'autant. Chaque temps porte, dans son déroulé, ce que l'IA y
 * apporte et les méthodes ou outils qui peuvent y servir.
 */
export function MethodTimeline({ steps, labels }: { steps: MethodStep[]; labels: Labels }) {
  return (
    <ol className="relative mt-16 md:mt-20">
      {steps.map((step, index) => (
        <MethodTimelineStep key={step.id} step={step} index={index} last={index === steps.length - 1} labels={labels} />
      ))}
    </ol>
  );
}

function MethodTimelineStep({ step, index, last, labels }: { step: MethodStep; index: number; last: boolean; labels: Labels }) {
  const dotRef = useRef<HTMLSpanElement>(null);
  // La pastille s'allume en traversant la ligne de lecture (de part et
  // d'autre, sur quelques points de hauteur d'écran).
  const { scrollYProgress: lit } = useScroll({ target: dotRef, offset: [...READ_SPAN] });
  const litScale = useTransform(lit, [0, 1], [0.6, 1]);
  // Pas encore atteint, le numéro reste lisible (au moins 4,5:1 en thème clair).
  const numberOpacity = useTransform(lit, [0, 1], [0.72, 1]);

  return (
    <li id={step.id} className="relative scroll-mt-28 pb-16 last:pb-0 md:pb-20">
      {last ? null : <TimelineThread />}
      <ScrollReveal delay={index === 0 ? 0 : 0.04}>
        <div className="flex gap-5 md:gap-7">
          <span
            ref={dotRef}
            aria-hidden="true"
            className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-[var(--background)] text-ink/55 md:h-[3.3rem] md:w-[3.3rem]"
          >
            <StepGlyph index={index} />
            {/* Temps atteint : la pastille passe à l'encre pleine. */}
            <motion.span
              className="absolute -inset-px flex items-center justify-center rounded-full bg-ink text-page"
              style={{ opacity: lit, scale: litScale }}
            >
              <StepGlyph index={index} />
            </motion.span>
          </span>

          <div className="min-w-0 flex-1 pt-1 md:pt-2">
            <motion.span
              className="block text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink"
              style={{ opacity: numberOpacity }}
            >
              {String(index + 1).padStart(2, "0")} · {step.phase}
            </motion.span>
            <h2 className="mt-2 text-lg font-bold text-ink md:text-xl">{step.title}</h2>
            <p className="mt-3 text-balance text-base leading-snug text-ink md:text-lg">{step.lead}</p>

            <div className="mt-5 space-y-4">
              {step.body.map((paragraph) => (
                <p key={paragraph} className="copy">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Ce que l'IA apporte à ce temps : dans le déroulé, pas en annexe. */}
            <div className="mt-6 border-l border-ink/20 pl-4 md:pl-5">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink/65">{labels.ai}</p>
              <p className="copy mt-2">{step.ai}</p>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-ink/65">
              <span className="mb-1.5 block text-[0.625rem] font-semibold uppercase tracking-[0.28em]">{labels.tools}</span>
              {step.tools.join(" · ")}
            </p>
          </div>
        </div>
      </ScrollReveal>
    </li>
  );
}

/**
 * Fil jusqu'à la pastille suivante, de centre à centre : il se remplit
 * pendant qu'on lit le temps.
 */
function TimelineThread() {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress: filled } = useScroll({ target: ref, offset: [`start ${READ_LINE}`, `end ${READ_LINE}`] });
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="absolute left-[1.375rem] top-[1.375rem] -bottom-[1.375rem] w-px bg-ink/12 md:left-[1.65rem] md:top-[1.65rem] md:-bottom-[1.65rem]"
    >
      <motion.span className="absolute inset-0 origin-top bg-ink/55" style={{ scaleY: filled }} />
    </span>
  );
}
