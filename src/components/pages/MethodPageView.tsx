"use client";

import { TechGlyph } from "@/components/about/TechStack";
import { LucideIcon } from "@/components/icons/Lucide";
import { TextPage } from "@/components/layout/TextPage";
import { MethodPhases } from "@/components/method/MethodPhases";
import { MethodTimeline, toolLogo } from "@/components/method/MethodTimeline";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/motion/ScrollReveal";
import { useTranslation } from "@/i18n/context";

const LABEL = "text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink/55";

/**
 * Page « Ma méthode ». Contenu refait le 28 oct. 2026 (cinq temps qui se
 * chevauchent : comprendre, explorer, concevoir, expérimenter, valider, où
 * l'IA et les outils sont pris dans le déroulé), mise en scène refaite le
 * même jour (brief de Paul : plus visuelle, plus éditoriale, plus colorée) :
 *
 * - une ouverture en deux temps, l'idée en grand, la nuance à côté ;
 * - la carte d'ensemble, du besoin à la solution, les cinq temps qui se
 *   chevauchent ;
 * - les cinq temps, chacun avec sa teinte, son schéma et ses outils, et un
 *   repère qui suit la lecture ;
 * - l'IA comme partenaire, avec les logos de GPT et de Claude ;
 * - les outils, chacun avec son logo, sans niveau de maîtrise affiché.
 */
export function MethodPageView() {
  const { t } = useTranslation();
  const method = t.site.method;
  const steps = t.site.methodSteps;

  return (
    <TextPage title={method.title} wide revealChildren={false}>
      {/* L'idée en grand, la nuance à côté. */}
      <ScrollReveal>
        <div className="grid gap-6 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <h2 className={LABEL}>{method.introTitle}</h2>
            <p className="mt-5 text-balance text-xl leading-snug text-ink md:text-[1.625rem] md:leading-[1.35]">{method.introOne}</p>
          </div>
          <p className="copy md:col-span-5 md:self-end">{method.introTwo}</p>
        </div>
      </ScrollReveal>

      <MethodPhases steps={steps} map={method.map} loop={method.loop} />

      <MethodTimeline
        steps={steps}
        labels={{ ai: method.aiLabel, tools: method.toolsLabel, progress: method.progressLabel, figures: method.figures }}
      />

      {/* Après le dernier temps : la boucle. */}
      <ScrollReveal>
        <p className="mx-auto mt-20 max-w-2xl text-balance text-center text-sm italic leading-relaxed text-ink/65 md:mt-24">
          <LucideIcon name="refresh-ccw" className="mr-2 inline h-3.5 w-3.5 align-[-2px]" />
          {method.loopNote}
        </p>
      </ScrollReveal>

      {/* L'IA, partenaire de conception : le propos à gauche, les deux partenaires à droite. */}
      <section aria-labelledby="methode-ia" className="mt-24 border-t border-ink/10 pt-14 md:mt-32 md:pt-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <ScrollReveal className="md:col-span-5">
            <h2 id="methode-ia" className="text-balance text-2xl font-medium text-ink md:text-3xl">
              {method.ai.title}
            </h2>
            <p className="copy mt-5">{method.ai.intro}</p>
          </ScrollReveal>
          <ScrollRevealGroup className="divide-y divide-ink/10 border-y border-ink/10 md:col-span-7">
            {method.ai.partners.map((partner) => {
              const logo = toolLogo(partner.name);
              return (
                <ScrollRevealItem key={partner.name} className="flex gap-5 py-6">
                  <LogoTile>{logo ? <TechGlyph icon={logo} /> : null}</LogoTile>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-ink">{partner.name}</h3>
                    <p className="copy mt-1.5">{partner.use}</p>
                  </div>
                </ScrollRevealItem>
              );
            })}
          </ScrollRevealGroup>
        </div>
        {/* Ce qui reste à moi : en exergue. */}
        <ScrollReveal>
          <blockquote className="relative mx-auto mt-16 max-w-3xl text-balance pl-10 text-xl leading-snug text-ink md:mt-20 md:pl-14 md:text-2xl">
            <span aria-hidden="true" className="absolute left-0 top-[-0.35em] font-serif text-[3.5rem] leading-none text-ink/25 md:text-[4.5rem]">
              “
            </span>
            {method.ai.mine}
          </blockquote>
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
        <ScrollRevealGroup className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {method.tools.items.map((tool) => {
            const logo = toolLogo(tool.name);
            return (
              <ScrollRevealItem key={tool.name} className="flex gap-4">
                <LogoTile>{logo ? <TechGlyph icon={logo} /> : null}</LogoTile>
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-ink">{tool.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/70">{tool.use}</p>
                </div>
              </ScrollRevealItem>
            );
          })}
        </ScrollRevealGroup>
        <ScrollReveal>
          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-ink/65">{method.tools.note}</p>
        </ScrollReveal>
      </section>
    </TextPage>
  );
}

/** Tuile d'un logo, comme dans la grille des outils de la page À propos. */
function LogoTile({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-ink/[0.04] light:bg-[var(--glass)] light:shadow-[0_1px_2px_rgba(24,23,28,0.08)]"
    >
      {children}
    </span>
  );
}
