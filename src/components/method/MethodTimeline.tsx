"use client";

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

export function MethodTimeline({ steps }: { steps: MethodStep[] }) {
  return (
    <ol className="relative mt-14 md:mt-20">
      {/* Fil conducteur reliant les étapes, estompé à ses extrémités. */}
      <span
        aria-hidden="true"
        className="absolute left-[1.4rem] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/12 to-transparent md:left-[1.65rem]"
      />

      {steps.map((step, index) => (
        <li key={step.title} className="relative pb-10 last:pb-0 md:pb-14">
          <ScrollReveal delay={index === 0 ? 0 : 0.04}>
            <div className="flex gap-5 md:gap-7">
              <span
                aria-hidden="true"
                className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[#191820] text-white/55 md:h-[3.3rem] md:w-[3.3rem]"
              >
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
              </span>

              <div className="pt-1 md:pt-2">
                <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-white/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-2 text-base font-bold text-white md:text-lg">{step.title}</h2>
                <p className="copy mt-2">{step.body}</p>
              </div>
            </div>
          </ScrollReveal>
        </li>
      ))}
    </ol>
  );
}
