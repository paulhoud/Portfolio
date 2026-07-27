import { absoluteUrl, activeSocialLinks, profile, siteUrl } from "@/content/profile";
import type { Project } from "@/content/projects";

/**
 * Schémas Schema.org du site.
 *
 * Objectif : donner à Google un modèle explicite « cette personne ↔ ce métier ↔
 * ce site ↔ ces réalisations ». Les champs non renseignés dans `profile.ts`
 * sont omis plutôt que produits vides, pour ne jamais générer de balisage
 * invalide.
 */

const PERSON_ID = `${siteUrl}/#person`;
const WEBSITE_ID = `${siteUrl}/#website`;

/** Retire les clés vides (chaîne vide, tableau vide, undefined). */
function compact<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim() !== "";
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }),
  ) as T;
}

/** Identité : le schéma central pour les recherches sur le nom. */
export function personSchema() {
  return compact({
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.name,
    url: siteUrl,
    // Plusieurs intitulés exercés : déclarés ensemble pour couvrir les deux
    // métiers sans imposer de choix dans l'interface.
    jobTitle: [profile.jobTitle, ...profile.alternateJobTitles],
    description: profile.description,
    email: profile.email ? `mailto:${profile.email}` : "",
    image: profile.photo ? absoluteUrl(profile.photo) : "",
    knowsAbout: [...profile.expertise],
    // `sameAs` relie ce site aux profils externes : signal déterminant pour
    // que Google consolide l'identité (nom → site → profils).
    sameAs: activeSocialLinks.map((link) => link.url),
    address: profile.localities[0]
      ? {
          "@type": "PostalAddress",
          addressLocality: profile.localities[0],
          addressCountry: profile.country,
        }
      : undefined,
    // Plusieurs villes d'exercice : déclarées comme lieux de travail.
    workLocation: profile.localities.map((city) => ({
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressCountry: profile.country,
      },
    })),
    worksFor: profile.worksFor
      ? { "@type": "Organization", name: profile.worksFor }
      : undefined,
    alumniOf: profile.alumniOf
      ? { "@type": "EducationalOrganization", name: profile.alumniOf }
      : undefined,
  });
}

/** Le site lui-même, rattaché à son auteur. */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteUrl,
    name: `${profile.name} — ${profile.jobTitle}`,
    description: profile.description,
    inLanguage: "fr-FR",
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
}

/** Page « À propos » déclarée comme page de profil. */
export function profilePageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl("/about"),
    name: `À propos — ${profile.name}`,
    inLanguage: "fr-FR",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": PERSON_ID },
  };
}

/** Une réalisation, attribuée à son auteur. */
export function creativeWorkSchema(project: Project) {
  const url = absoluteUrl(`/projects/${project.slug}`);

  return compact({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    url,
    name: project.title,
    headline: project.eyebrow,
    description: project.description,
    inLanguage: "fr-FR",
    creator: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
    keywords: [...profile.expertise].slice(0, 5).join(", "),
  });
}

/** Fil d'ariane d'une page projet (accueil → projet). */
export function projectBreadcrumbSchema(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: project.title,
        item: absoluteUrl(`/projects/${project.slug}`),
      },
    ],
  };
}
