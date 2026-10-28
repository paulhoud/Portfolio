"use client";

import { Portrait } from "@/components/about/Portrait";
import { TechStack } from "@/components/about/TechStack";
import { TextPage } from "@/components/layout/TextPage";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/motion/ScrollReveal";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";

/**
 * Page « À propos » : présentation, parcours, puis panorama des outils.
 *
 * La mise en page reprend le principe du portfolio d'origine - texte et
 * portrait côte à côte, suivis de grilles d'outils par catégorie - tout en
 * conservant l'identité sombre du site actuel.
 */
export function AboutPageView() {
  const { t } = useTranslation();
  const about = t.site.about;

  return (
    <TextPage title={about.title} wide revealChildren={false}>
      <ScrollReveal>
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div className="copy space-y-5">
            {about.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <Portrait src={profile.photo} alt={about.photoAlt} />
        </div>
      </ScrollReveal>

      <ScrollRevealGroup className="mt-16 grid gap-8 md:mt-20 md:grid-cols-2 md:gap-x-12 md:gap-y-10">
        {about.sections.map((section) => (
          <ScrollRevealItem key={section.title} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.04em] text-ink">
              {section.title}
            </h2>
            <p className="copy">{section.body}</p>
          </ScrollRevealItem>
        ))}
      </ScrollRevealGroup>

      <TechStack />
    </TextPage>
  );
}
