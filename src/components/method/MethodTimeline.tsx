"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type { MethodStep } from "@/i18n/types";

/**
 * Pictogrammes des étapes de la méthode.
 *
 * Dessinés au trait dans une grammaire commune (même graisse, mêmes
 * arrondis, formes géométriques abstraites) pour illustrer chaque étape sans
 * détourner l'attention du texte : cible pour le cadrage, loupe et données
 * éparses pour la recherche, lignes convergentes pour la synthèse, cadres
 * superposés pour les itérations, flèche ascendante pour la livraison.
 *
 * L'ordre suit celui des étapes ; une étape supplémentaire s'afficherait sans
 * pictogramme plutôt que d'en réutiliser un à contresens.
 */
const stepGlyphs = [
  // Cadrage : comprendre l'objectif.
  <>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </>,
  // Recherche : observer, collecter des signaux dispersés.
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 L20.5 20.5" />
    <circle cx="8.4" cy="9.6" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="11.4" cy="12.4" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="12.6" cy="8.4" r="0.85" fill="currentColor" stroke="none" />
  </>,
  // Synthèse : faire converger vers une direction unique.
  <>
    <path d="M3 5.5c6 0 6 6.5 12 6.5" />
    <path d="M3 12h12" />
    <path d="M3 18.5c6 0 6-6.5 12-6.5" />
    <circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </>,
  // Prototypage : versions successives qui se superposent.
  <>
    <rect x="3" y="3" width="13" height="13" rx="2.5" />
    <rect x="8" y="8" width="13" height="13" rx="2.5" />
  </>,
  // Livraison : ce qui est remis aux équipes et prend son envol.
  <>
    <path d="M4 20.5h16" />
    <path d="M12 17V5.5" />
    <path d="M7.5 10 L12 5.5 L16.5 10" />
  </>,
];

/**
 * Hauteur à laquelle la frise avance : quand le centre d'une pastille passe
 * cette ligne de l'écran (62 % de sa hauteur), le fil l'atteint et elle
 * s'allume. Assez bas pour que la dernière étape s'allume avant la fin de la
 * page.
 */
const READ_LINE = "62%";
const READ_SPAN = ["center 65%", "center 59%"] as const;

/**
 * Frise de la méthode, animée au défilement : un fil se remplit d'une pastille
 * à l'autre au rythme de la lecture, et chaque étape atteinte passe à l'encre
 * pleine. Tout est lié au défilement (aucune minuterie) : on peut remonter, la
 * frise se vide d'autant.
 */
export function MethodTimeline({ steps }: { steps: MethodStep[] }) {
  return (
    <ol className="relative mt-14 md:mt-20">
      {steps.map((step, index) => (
        <MethodTimelineStep key={step.title} step={step} index={index} last={index === steps.length - 1} />
      ))}
    </ol>
  );
}

function MethodTimelineStep({ step, index, last }: { step: MethodStep; index: number; last: boolean }) {
  const dotRef = useRef<HTMLSpanElement>(null);
  // La pastille s'allume en traversant la ligne de lecture (de part et
  // d'autre, sur quelques points de hauteur d'écran).
  const { scrollYProgress: lit } = useScroll({ target: dotRef, offset: [...READ_SPAN] });
  const litScale = useTransform(lit, [0, 1], [0.6, 1]);
  const numberOpacity = useTransform(lit, [0, 1], [0.55, 1]);

  return (
    <li className="relative pb-10 last:pb-0 md:pb-14">
      {last ? null : <TimelineThread />}
      <ScrollReveal delay={index === 0 ? 0 : 0.04}>
        <div className="flex gap-5 md:gap-7">
          <span
            ref={dotRef}
            aria-hidden="true"
            className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-[var(--background)] text-ink/55 md:h-[3.3rem] md:w-[3.3rem]"
          >
            <StepGlyph index={index} />
            {/* Étape atteinte : la pastille passe à l'encre pleine. */}
            <motion.span
              className="absolute -inset-px flex items-center justify-center rounded-full bg-ink text-page"
              style={{ opacity: lit, scale: litScale }}
            >
              <StepGlyph index={index} />
            </motion.span>
          </span>

          <div className="pt-1 md:pt-2">
            <motion.span
              className="block text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink"
              style={{ opacity: numberOpacity }}
            >
              {String(index + 1).padStart(2, "0")}
            </motion.span>
            <h2 className="mt-2 text-base font-bold text-ink md:text-lg">{step.title}</h2>
            <p className="copy mt-2">{step.body}</p>
          </div>
        </div>
      </ScrollReveal>
    </li>
  );
}

/**
 * Fil jusqu'à la pastille suivante, de centre à centre : il se remplit
 * pendant qu'on lit l'étape.
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

function StepGlyph({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.15rem] w-[1.15rem] md:h-[1.3rem] md:w-[1.3rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {stepGlyphs[index]}
    </svg>
  );
}
