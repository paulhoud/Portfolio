"use client";

import { TextPage, TextPageSection } from "@/components/layout/TextPage";
import { useTranslation } from "@/i18n/context";

export function MethodPageView() {
  const { t } = useTranslation();

  return (
    <TextPage title={t.site.method.title}>
      <TextPageSection title={t.site.method.introTitle}>
        <p>{t.site.method.introOne}</p>
        <p className="mt-6">{t.site.method.introTwo}</p>
      </TextPageSection>

      {t.site.methodSteps.map((step, index) => (
        <TextPageSection key={step.title} title={`${index + 1}. ${step.title}`}>
          <p>{step.body}</p>
        </TextPageSection>
      ))}
    </TextPage>
  );
}
