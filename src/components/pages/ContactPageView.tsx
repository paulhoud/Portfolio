"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { brandIconPaths, type BrandIconId } from "@/components/layout/icons/brandIconPaths";
import { TextPage } from "@/components/layout/TextPage";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { activeSocialLinks, profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

/**
 * Page « Contact ».
 *
 * Deux colonnes sur grand écran : à gauche, qui écrit (portrait, nom,
 * invitation en grand, villes et heure locale) ; à droite, les moyens de le
 * joindre, de l'e-mail (écrire ou copier l'adresse) au CV et aux profils
 * externes, listés comme un index. Sur téléphone, les deux s'empilent.
 *
 * L'adresse reste affichée en clair : c'est l'appel à l'action principal. Les
 * profils et les villes viennent de `profile.ts`, source unique déjà utilisée
 * par le SEO.
 */
export function ContactPageView() {
  const { t, locale } = useTranslation();
  const contact = t.site.contact;

  return (
    <TextPage title={contact.title} wide revealChildren={false}>
      <div className="mx-auto grid max-w-5xl items-start gap-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-16 lg:gap-24">
        <ScrollReveal>
          <div className="flex items-center gap-4">
            <Image
              src={profile.photo}
              alt=""
              width={112}
              height={112}
              sizes="56px"
              className="h-14 w-14 rounded-full object-cover ring-1 ring-ink/15"
            />
            <div>
              <p className="text-base font-bold text-ink">{profile.name}</p>
              <p className="text-sm text-ink/60">{profile.jobTitle}</p>
            </div>
          </div>

          <p className="mt-8 text-balance text-2xl font-medium leading-snug text-ink md:text-[1.75rem]">
            {contact.intro}
          </p>

          <div className="mt-10 flex flex-col gap-1.5 border-t border-ink/10 pt-6 text-sm text-ink/65">
            <p>
              {contact.locationLabel} {profile.localities.join(" & ")}
            </p>
            <LocalTime locale={locale} label={contact.localTime} />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.06} className="flex flex-col gap-4">
          <EmailCard />

          {profile.cv ? (
            <a
              href={profile.cv}
              // `download` force l'enregistrement plutôt que l'ouverture dans
              // le navigateur ; le nom du fichier servi est déjà explicite.
              download
              className={cn(
                "group flex items-center gap-4 rounded-2xl border border-ink/12 px-5 py-4 text-sm text-ink/80 transition duration-300",
                "hover:-translate-y-0.5 hover:border-ink/30 hover:bg-ink/[0.04] hover:text-ink",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60",
              )}
            >
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] text-ink">
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />
                </svg>
              </span>
              <span className="font-medium">{contact.cvLabel}</span>
              <span className="ml-auto text-xs uppercase tracking-[0.14em] text-ink/45">PDF</span>
            </a>
          ) : null}

          {activeSocialLinks.length > 0 ? (
            <nav aria-label={contact.socialLabel} className="mt-6">
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-ink/55">{contact.socialLabel}</h2>
              <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
                {activeSocialLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="me noopener noreferrer"
                      className="group flex items-center gap-4 py-3.5 text-ink/75 transition-colors duration-300 hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/50"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
                        <path d={brandIconPaths[link.id as BrandIconId]} />
                      </svg>
                      <span className="text-sm font-medium">{link.label}</span>
                      <span className="ml-auto truncate text-sm text-ink/45">{handleOf(link.url)}</span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 shrink-0 text-ink/40 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 17L17 7M9 7h8v8" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </ScrollReveal>
      </div>
    </TextPage>
  );
}

/** Identifiant du profil, tiré de son adresse (« in/paul-houdebine » → « paul-houdebine »). */
function handleOf(url: string) {
  const last = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return last.startsWith("@") ? last : `@${last}`;
}

/**
 * Carte de l'e-mail : l'adresse en grand, puis deux gestes, l'écrire (client
 * de messagerie) ou la copier (pour qui écrit depuis un webmail).
 */
function EmailCard() {
  const { t } = useTranslation();
  const contact = t.site.contact;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : l'adresse reste
      // affichée et sélectionnable.
    }
  };

  return (
    <div
      className={cn(
        "rounded-3xl border p-6 md:p-8 [border-color:var(--glass-border)] shadow-[var(--glass-shadow)]",
        "[background:radial-gradient(120%_120%_at_0%_0%,color-mix(in_srgb,var(--ink)_7%,transparent),transparent_60%),var(--glass)]",
      )}
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-ink/55">{contact.emailLabel}</p>
      <a
        href={`mailto:${profile.email}`}
        className="mt-3 block break-all text-xl font-medium text-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink/50 md:text-2xl"
      >
        {profile.email}
      </a>
      <div className="mt-6 flex flex-wrap gap-2.5">
        <a
          href={`mailto:${profile.email}`}
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-page transition duration-300 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60"
        >
          {contact.write}
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink/80 transition duration-300 hover:-translate-y-0.5 hover:border-ink/35 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {copied ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M9 9h10v10H9zM5 15V5h10" />}
          </svg>
          {/* Le libellé change, et il est annoncé aux lecteurs d'écran. */}
          <span aria-live="polite">{copied ? contact.copied : contact.copy}</span>
        </button>
      </div>
    </div>
  );
}

/** Heure de Bordeaux et Paris (même fuseau), mise à jour chaque demi-minute. */
function LocalTime({ locale, label }: { locale: string; label: string }) {
  const time = useSyncExternalStore(
    (onChange) => {
      const timer = window.setInterval(onChange, 30_000);
      return () => window.clearInterval(timer);
    },
    () => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date()),
    // Côté serveur, l'heure n'a pas de sens : elle apparaît à l'hydratation.
    () => "",
  );
  if (!time) return null;
  return (
    <p className="tabular-nums">
      {time}, {label}
    </p>
  );
}
