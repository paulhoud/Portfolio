"use client";

import { SocialLinks } from "@/components/layout/SocialLinks";
import { TextPage } from "@/components/layout/TextPage";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";

/**
 * Page « Contact ».
 *
 * L'adresse e-mail est affichée en clair et constitue l'appel à l'action
 * principal — auparavant elle était masquée derrière une pastille « Email »,
 * obligeant à cliquer pour la découvrir. Les profils externes et les villes
 * proviennent de `profile.ts`, source unique déjà utilisée par le SEO.
 */
export function ContactPageView() {
  const { t } = useTranslation();
  const contact = t.site.contact;

  return (
    <TextPage title={contact.title} revealChildren={false}>
      <ScrollReveal>
        <p className="copy mx-auto max-w-2xl text-center">{contact.intro}</p>
      </ScrollReveal>

      <ScrollReveal delay={0.06}>
        <a
          href={`mailto:${profile.email}`}
          className="group mx-auto mt-12 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.035] px-6 py-10 text-center transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 md:py-12"
        >
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/40">
            {contact.emailLabel}
          </span>
          <span className="flex items-center gap-3 text-lg font-medium text-white md:text-2xl">
            {profile.email}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white md:h-5 md:w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </a>
      </ScrollReveal>

      <ScrollReveal delay={0.12}>
        <div className="mt-14 flex flex-col items-center gap-4">
          <h2 className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/40">
            {contact.socialLabel}
          </h2>
          <SocialLinks variant="labelled" className="flex justify-center" />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.18}>
        <p className="mt-14 text-center text-xs uppercase tracking-[0.18em] text-white/30">
          {contact.locationLabel} {profile.localities.join(" & ")}
        </p>
      </ScrollReveal>
    </TextPage>
  );
}
