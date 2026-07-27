"use client";

import { TextPage, TextPageSection } from "@/components/layout/TextPage";
import { ScrollRevealItem } from "@/components/motion/ScrollReveal";
import { useTranslation } from "@/i18n/context";

export function AboutPageView() {
  const { t } = useTranslation();

  return (
    <TextPage title={t.site.about.title}>
      <ScrollRevealItem className="space-y-6">
        {t.site.about.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </ScrollRevealItem>

      {t.site.about.sections.map((section) => (
        <TextPageSection key={section.title} title={section.title}>
          <p>{section.body}</p>
        </TextPageSection>
      ))}
    </TextPage>
  );
}
