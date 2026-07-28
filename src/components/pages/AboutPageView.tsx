"use client";

import Image from "next/image";
import { TechStack } from "@/components/about/TechStack";
import { TextPage } from "@/components/layout/TextPage";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/motion/ScrollReveal";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";

/**
 * Page « À propos » : présentation, parcours, puis panorama des outils.
 *
 * La mise en page reprend le principe du portfolio d'origine — texte et
 * portrait côte à côte, suivis de grilles d'outils par catégorie — tout en
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

          <div className="relative mx-auto md:mx-0">
            <span
              aria-hidden="true"
              className="absolute -inset-4 rounded-full bg-white/5 blur-2xl"
            />
            <Image
              src={profile.photo}
              alt={about.photoAlt}
              width={260}
              height={260}
              priority
              sizes="(min-width: 768px) 260px, 200px"
              className="relative h-[200px] w-[200px] rounded-full object-cover shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/15 md:h-[260px] md:w-[260px]"
            />
          </div>
        </div>
      </ScrollReveal>

      <ScrollRevealGroup className="mt-16 grid gap-8 md:mt-20 md:grid-cols-2 md:gap-x-12 md:gap-y-10">
        {about.sections.map((section) => (
          <ScrollRevealItem key={section.title} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.04em] text-white">
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
