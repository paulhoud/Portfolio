"use client";

import { TextPage } from "@/components/layout/TextPage";
import { MethodTimeline } from "@/components/method/MethodTimeline";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { useTranslation } from "@/i18n/context";

/**
 * Page « Ma méthode ».
 *
 * Le contenu d'origine est conservé ; seule sa présentation change. Les étapes
 * sont rendues sous forme de frise reliée par un fil conducteur, chacune
 * associée à un pictogramme au trait : la progression du processus devient
 * lisible d'un coup d'œil, avant même la lecture du texte.
 */
export function MethodPageView() {
  const { t } = useTranslation();
  const method = t.site.method;

  return (
    <TextPage title={method.title} revealChildren={false}>
      <ScrollReveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/35">
            {method.introTitle}
          </h2>
          <p className="copy mt-5">{method.introOne}</p>
          <p className="copy mt-4">{method.introTwo}</p>
        </div>
      </ScrollReveal>

      <MethodTimeline steps={t.site.methodSteps} />
    </TextPage>
  );
}
