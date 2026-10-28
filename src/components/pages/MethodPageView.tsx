"use client";

import { TextPage } from "@/components/layout/TextPage";
import { MethodPhases } from "@/components/method/MethodPhases";
import { MethodTimeline } from "@/components/method/MethodTimeline";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/motion/ScrollReveal";
import { useTranslation } from "@/i18n/context";

/**
 * Page « Ma méthode », refaite le 28 oct. 2026 (brief de Paul) : une méthode
 * de Product Designer d'aujourd'hui, en cinq temps qui se chevauchent
 * (comprendre, explorer, concevoir, expérimenter, valider), où l'IA et les
 * outils sont pris dans le déroulé plutôt que présentés en annexe.
 *
 * - une vue d'ensemble des cinq temps, avec la boucle qui ramène au début ;
 * - la frise détaillée, animée au défilement : pour chaque temps, ce que je
 *   fais, ce que l'IA y apporte, les méthodes et outils qui peuvent servir ;
 * - l'IA comme partenaire (GPT pour structurer, Claude pour construire, et ce
 *   qui reste à moi) ;
 * - les outils, choisis pour l'expérience visée, sans niveau de maîtrise
 *   affiché (Blender et Unity : des explorations ponctuelles).
 */
export function MethodPageView() {
  const { t } = useTranslation();
  const method = t.site.method;
  const steps = t.site.methodSteps;

  return (
    <TextPage title={method.title} revealChildren={false}>
      <ScrollReveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink/55">{method.introTitle}</h2>
          <p className="mt-5 text-balance text-lg leading-snug text-ink md:text-xl">{method.introOne}</p>
          <p className="copy mt-5">{method.introTwo}</p>
        </div>
      </ScrollReveal>

      <MethodPhases steps={steps} label={method.phasesLabel} loop={method.loop} />

      <MethodTimeline steps={steps} labels={{ ai: method.aiLabel, tools: method.toolsLabel }} />

      {/* Après le dernier temps : la boucle. */}
      <ScrollReveal>
        <p className="mx-auto mt-14 max-w-2xl text-balance text-center text-sm italic leading-relaxed text-ink/65 md:mt-16">
          {method.loopNote}
        </p>
      </ScrollReveal>

      {/* L'IA, partenaire de conception. */}
      <section aria-labelledby="methode-ia" className="mt-24 border-t border-ink/10 pt-14 md:mt-32 md:pt-20">
        <ScrollReveal>
          <h2 id="methode-ia" className="text-balance text-2xl font-medium text-ink md:text-3xl">
            {method.ai.title}
          </h2>
          <p className="copy mt-5 max-w-2xl">{method.ai.intro}</p>
        </ScrollReveal>
        <ScrollRevealGroup className="mt-10 grid gap-10 md:grid-cols-2 md:gap-12">
          {method.ai.partners.map((partner) => (
            <ScrollRevealItem key={partner.name}>
              <h3 className="border-t border-ink/15 pt-5 text-base font-bold text-ink">{partner.name}</h3>
              <p className="copy mt-3">{partner.use}</p>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
        <ScrollReveal>
          <p className="mt-12 max-w-3xl text-balance border-l-2 border-ink/40 pl-5 text-lg leading-snug text-ink md:pl-6 md:text-xl">
            {method.ai.mine}
          </p>
        </ScrollReveal>
      </section>

      {/* Les outils, choisis pour l'expérience visée. */}
      <section aria-labelledby="methode-outils" className="mt-24 border-t border-ink/10 pt-14 md:mt-32 md:pt-20">
        <ScrollReveal>
          <h2 id="methode-outils" className="text-balance text-2xl font-medium text-ink md:text-3xl">
            {method.tools.title}
          </h2>
          <p className="copy mt-5 max-w-2xl">{method.tools.intro}</p>
        </ScrollReveal>
        <ScrollReveal>
          <dl className="mt-10 border-t border-ink/10">
            {method.tools.items.map((tool) => (
              <div key={tool.name} className="grid gap-1 border-b border-ink/10 py-4 md:grid-cols-[13rem_1fr] md:gap-6">
                <dt className="text-base font-medium text-ink">{tool.name}</dt>
                <dd className="copy">{tool.use}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink/65">{method.tools.note}</p>
        </ScrollReveal>
      </section>
    </TextPage>
  );
}
