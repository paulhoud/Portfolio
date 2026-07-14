"use client";

import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { TextPage, TextPageSection } from "@/components/layout/TextPage";
import { ScrollRevealItem } from "@/components/motion/ScrollReveal";
import { useTranslation } from "@/i18n/context";

export function ContactPageView() {
  const { t } = useTranslation();

  return (
    <SiteShell>
      <TextPage title={t.site.contact.title}>
        <ScrollRevealItem>
          <p>{t.site.contact.intro}</p>
        </ScrollRevealItem>

        <TextPageSection title={t.site.nav.contact}>
          <div className="flex flex-col gap-3 pt-2 text-white md:flex-row">
            {t.site.contact.channels.map((channel) => (
              <Link
                key={channel.href}
                href={channel.href}
                target={channel.external ? "_blank" : undefined}
                rel={channel.external ? "noreferrer noopener" : undefined}
                className="rounded-full border border-white/15 px-5 py-3 text-sm uppercase tracking-[0.12em] transition hover:border-white/45 hover:bg-white/5"
              >
                {channel.label}
              </Link>
            ))}
          </div>
        </TextPageSection>
      </TextPage>
    </SiteShell>
  );
}
