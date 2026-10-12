"use client";

import type { ReactNode } from "react";
import { TextPage } from "@/components/layout/TextPage";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";
import { setOptOut, useOptOut } from "@/lib/stats/track";

/**
 * Mentions légales et confidentialité, dans les deux langues : qui édite et
 * héberge le site, à qui sont les contenus, et ce que mesure l'audience
 * (information exigée pour l'exemption de consentement de la CNIL), avec le
 * refus d'être compté. Texte validé par Paul avant publication.
 */

const UPDATED = { fr: "Mis à jour le 12 octobre 2026.", en: "Last updated on 12 October 2026." };

export function LegalPageView() {
  const { locale } = useTranslation();
  const en = locale === "en";
  const mail = (
    <a href={`mailto:${profile.email}`} className="underline underline-offset-2 hover:text-ink">
      {profile.email}
    </a>
  );
  const link = (href: string, label: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
      {label}
    </a>
  );

  return (
    <TextPage title={en ? "Legal notice" : "Mentions légales"} eyebrow={en ? "And privacy" : "Et confidentialité"} revealChildren={false}>
      <div className="flex flex-col gap-12">
        <Section title={en ? "Publisher" : "Éditeur"}>
          <p>
            {en
              ? "This website is the personal portfolio of Paul Houdebine, Product Designer, who is also its publication director. Contact: "
              : "Ce site est le portfolio personnel de Paul Houdebine, Product Designer, qui en est aussi le directeur de la publication. Contact : "}
            {mail}.
          </p>
        </Section>

        <Section title={en ? "Hosting" : "Hébergement"}>
          <p>
            {en ? "The site is hosted by " : "Le site est hébergé par "}
            {link("https://vercel.com", "Vercel Inc.")}, 440 N Barranca Avenue #4133, Covina, CA 91723,{" "}
            {en ? "United States." : "États-Unis."}{" "}
            {en ? "Visit statistics are stored in a " : "Les statistiques de visite sont enregistrées dans une base de données "}
            {link("https://neon.com", "Neon")}
            {en ? " database, subscribed through Vercel." : ", souscrite via Vercel."}
          </p>
        </Section>

        <Section title={en ? "Intellectual property" : "Propriété intellectuelle"}>
          <p>
            {en
              ? "The texts, visuals and creative work shown on this site belong to Paul Houdebine unless stated otherwise. The names, trademarks and logos of the companies and clients mentioned belong to their owners: they are only used to present the projects Paul contributed to."
              : "Les textes, visuels et créations présentés sur ce site appartiennent à Paul Houdebine, sauf mention contraire. Les noms, marques et logos des entreprises et clients cités appartiennent à leurs propriétaires : ils servent uniquement à présenter les projets auxquels Paul a contribué."}
          </p>
          <p>
            {en
              ? "The 3D objects on the home page come from Sketchfab and remain the property of their authors. The hidden dimensions are unofficial nods to Dofus (© Ankama) and South Park (© Comedy Central), non-commercial and not affiliated."
              : "Les objets 3D de l'accueil proviennent de Sketchfab et restent la propriété de leurs auteurs. Les dimensions cachées sont des clins d'œil non officiels à Dofus (© Ankama) et South Park (© Comedy Central), sans usage commercial ni affiliation."}
          </p>
        </Section>

        <Section title={en ? "Audience measurement" : "Mesure d'audience"}>
          <p>
            {en
              ? "To understand how this portfolio is used and improve it, the site measures its audience anonymously, without cookies."
              : "Pour comprendre comment ce portfolio est consulté et l'améliorer, le site mesure son audience, de façon anonyme et sans cookie."}
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {en
                ? "Recorded: pages viewed, time spent and share of each page read, interactions with the site (projects opened, 3D objects touched, dimensions visited, images enlarged, links to profiles, contact actions), type of device, browser and operating system, country, language, theme and referring site."
                : "Ce qui est enregistré : pages vues, temps passé et part de chaque page lue, interactions avec le site (projets ouverts, objets 3D touchés, dimensions visitées, images agrandies, liens vers les profils, prise de contact), type d'appareil, navigateur et système, pays, langue, thème et site de provenance."}
            </li>
            <li>
              {en
                ? "Not recorded: no tracking cookie, no IP address, no browser fingerprint. A visit is identified by a random number kept by the browser tab and erased when it closes: a visitor cannot be recognised from one visit to the next."
                : "Ce qui ne l'est pas : ni cookie de mesure, ni adresse IP, ni empreinte du navigateur. Une visite est identifiée par un numéro tiré au hasard, gardé par l'onglet et effacé à sa fermeture : un visiteur ne peut pas être reconnu d'une visite à l'autre."}
            </li>
            <li>
              {en
                ? "Only Paul Houdebine sees these data, which are deleted after 25 months."
                : "Seul Paul Houdebine consulte ces données, effacées au bout de 25 mois."}
            </li>
            <li>
              {en
                ? "Browsers that signal a refusal of tracking (Global Privacy Control, Do Not Track) are never counted."
                : "Les navigateurs qui signalent un refus du suivi (Global Privacy Control, Do Not Track) ne sont jamais comptés."}
            </li>
            <li>
              {en
                ? "Page loading times are measured anonymously, without cookies, by Vercel Speed Insights."
                : "Les temps de chargement des pages sont mesurés de façon anonyme, sans cookie, par Vercel Speed Insights."}
            </li>
          </ul>
          <OptOutChoice en={en} />
        </Section>

        <Section title={en ? "Stored on your device" : "Enregistré sur votre appareil"}>
          <p>
            {en
              ? "The theme (light or dark), the sound setting and your counting choice are kept in your browser's local storage so they apply on your next visit. They never leave your device. The only cookie on this site belongs to the statistics page, reserved for Paul."
              : "Le thème (clair ou sombre), le réglage du son et votre choix de comptage sont gardés dans le stockage local de votre navigateur, pour s'appliquer à votre prochaine visite. Ils ne quittent jamais votre appareil. Le seul cookie du site est celui de la page des statistiques, réservée à Paul."}
          </p>
        </Section>

        <Section title={en ? "Your rights" : "Vos droits"}>
          <p>
            {en
              ? "The measurement data are anonymous and do not identify you. For any question about this site or your data, write to "
              : "Les données de mesure sont anonymes et ne permettent pas de vous identifier. Pour toute question sur ce site ou vos données, écrivez à "}
            {mail}.{" "}
            {en ? "You can also lodge a complaint with the CNIL (" : "Vous pouvez aussi adresser une réclamation à la CNIL ("}
            {link("https://www.cnil.fr", "cnil.fr")}).
          </p>
        </Section>

        <p className="text-xs text-ink/55">{UPDATED[en ? "en" : "fr"]}</p>
      </div>
    </TextPage>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ScrollReveal>
      <section className="grid gap-2 md:grid-cols-[11rem_1fr] md:gap-10">
        <h2 className="text-[0.6875rem] font-bold uppercase leading-7 tracking-[0.14em] text-ink/65">{title}</h2>
        <div className="copy space-y-4">{children}</div>
      </section>
    </ScrollReveal>
  );
}

/** Refus d'être compté, ici aussi (comme dans le pied de page). */
function OptOutChoice({ en }: { en: boolean }) {
  const optedOut = useOptOut();
  if (optedOut === null) return null;
  return (
    <p className="rounded-2xl border border-ink/10 bg-glass px-5 py-4 text-sm text-ink/80">
      {optedOut
        ? en
          ? "This device is not counted. "
          : "Cet appareil n'est pas compté. "
        : en
          ? "This device is counted anonymously. "
          : "Cet appareil est compté, anonymement. "}
      <button
        type="button"
        onClick={() => setOptOut(!optedOut)}
        className="cursor-pointer font-bold text-ink underline underline-offset-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/50"
      >
        {optedOut ? (en ? "Count it again" : "Le compter à nouveau") : en ? "Do not count it" : "Ne plus le compter"}
      </button>
    </p>
  );
}
