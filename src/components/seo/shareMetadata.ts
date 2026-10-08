import type { Metadata } from "next";
import { profile } from "@/content/profile";

/** Nom du site : titre par défaut, `og:site_name` et texte alternatif de l'image. */
export const siteTitle = `${profile.name} — ${profile.jobTitle}`;

/**
 * Champs Open Graph communs à toutes les pages. Le layout les déclare, mais une
 * page qui redéfinit `openGraph` les perd : `shareMetadata` les répète.
 */
export const siteOpenGraph = {
  siteName: siteTitle,
  locale: "fr_FR",
};

/**
 * Image de partage générée par `src/app/opengraph-image.tsx`, qui reprend ses
 * dimensions, son type et son texte alternatif d'ici : une seule source.
 */
export const shareImage = {
  url: "/opengraph-image",
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
  /**
   * Image propre à la page, au même format que `shareImage` (cf.
   * `src/app/projects/[slug]/opengraph-image.tsx`). À défaut, celle du site.
   */
  image?: { url: string; alt: string };
};

/**
 * Métadonnées de partage (Open Graph + Twitter Card) d'une page.
 *
 * Next ne fusionne pas `openGraph` ni `twitter` en profondeur avec ceux du
 * layout : une page qui déclare son propre `openGraph` perd l'image injectée
 * par `opengraph-image.tsx`, le nom du site, la langue et le type, et sans
 * `twitter` propre elle hérite du titre et de la description de l'accueil.
 * Tout est donc redéclaré ici, avec le titre et la description de la page.
 *
 * L'image est toujours déclarée explicitement : Next n'injecte celle d'un
 * fichier `opengraph-image` que si la page n'en déclare aucune, et ne permet
 * alors pas de lui donner un texte alternatif propre à la page.
 */
export function shareMetadata({
  title,
  description,
  url,
  type = "website",
  image,
}: ShareMetadataInput) {
  const images = [{ ...shareImage, ...image }];

  return {
    openGraph: {
      ...siteOpenGraph,
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
