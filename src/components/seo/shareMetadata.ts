import type { Metadata } from "next";
import { profile } from "@/content/profile";
import type { Locale } from "@/i18n/types";

/** Nom du site : titre par défaut, `og:site_name` et texte alternatif de l'image. */
export const siteTitle = `${profile.name} - ${profile.jobTitle}`;

/**
 * Champs Open Graph communs à toutes les pages d'une langue. Le layout les
 * déclare, mais une page qui redéfinit `openGraph` les perd :
 * `shareMetadata` les répète. L'autre langue est signalée comme variante.
 */
export function siteOpenGraphFor(locale: Locale) {
  return {
    siteName: siteTitle,
    locale: locale === "en" ? "en_US" : "fr_FR",
    alternateLocale: locale === "en" ? ["fr_FR"] : ["en_US"],
  };
}

/**
 * Image de partage du site, servie par `src/app/share-image`, qui reprend ses
 * dimensions, son type et son texte alternatif d'ici : une seule source.
 */
export const shareImage = {
  url: "/share-image",
  width: 1200,
  height: 630,
  alt: siteTitle,
  type: "image/png",
};

type ShareMetadataInput = {
  title: string;
  description: string;
  url: string;
  type?: "website" | "article" | "profile";
  /** Langue de la page (français par défaut). */
  locale?: Locale;
  /**
   * Image propre à la page, au même format que `shareImage` (cf.
   * `src/app/share-image/[locale]/[slug]`). À défaut, celle du site.
   */
  image?: { url: string; alt: string };
};

/**
 * Métadonnées de partage (Open Graph + Twitter Card) d'une page.
 *
 * Next ne fusionne pas `openGraph` ni `twitter` en profondeur avec ceux du
 * layout : une page qui déclare son propre `openGraph` perd l'image, le nom
 * du site, la langue et le type déclarés par la mise en page racine, et sans
 * `twitter` propre elle hérite du titre et de la description de l'accueil.
 * Tout est donc redéclaré ici, avec le titre et la description de la page,
 * et l'image (celle du site, ou celle de la page avec son texte alternatif).
 */
export function shareMetadata({
  title,
  description,
  url,
  type = "website",
  locale = "fr",
  image,
}: ShareMetadataInput) {
  const images = [{ ...shareImage, ...image }];

  return {
    openGraph: {
      ...siteOpenGraphFor(locale),
      type,
      title,
      description,
      url,
      images,
    },
    twitter: {
      // À répéter : l'objet `twitter` du layout est remplacé, pas complété.
      card: "summary_large_image",
      title,
      description,
      images,
    },
  } satisfies Pick<Metadata, "openGraph" | "twitter">;
}
