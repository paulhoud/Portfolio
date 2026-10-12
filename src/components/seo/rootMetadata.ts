import type { Metadata } from "next";
import { shareImage, siteOpenGraphFor, siteTitle } from "@/components/seo/shareMetadata";
import { profile, siteUrl } from "@/content/profile";
import { EN_PREFIX, languageAlternates, localePath } from "@/i18n/paths";
import type { Locale } from "@/i18n/types";

/** Description de l'accueil en anglais (la française est dans profile.ts). */
export const EN_DESCRIPTION =
  "Paul Houdebine, end-to-end Product Designer: product vision, user research, UX/UI, design systems and front-end, from framing to production.";

/**
 * Métadonnées communes à toutes les pages d'une langue, déclarées par la mise
 * en page racine de cette langue (cf. app/(fr) et app/(en)).
 */
export function rootMetadata(locale: Locale): Metadata {
  const description = locale === "en" ? EN_DESCRIPTION : profile.description;
  return {
    // Indispensable pour que les URLs Open Graph / canonical soient absolues.
    metadataBase: new URL(siteUrl),
    title: {
      default: siteTitle,
      // Les pages ne déclarent que leur propre titre : le nom est ajouté ici.
      template: `%s - ${profile.name}`,
    },
    description,
    applicationName: siteTitle,
    authors: [{ name: profile.name, url: siteUrl }],
    creator: profile.name,
    publisher: profile.name,
    alternates: { canonical: localePath("/", locale), languages: languageAlternates("/") },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      // Nom du site et langue : partagés avec les pages qui redéfinissent
      // `openGraph` (cf. `shareMetadata`).
      ...siteOpenGraphFor(locale),
      url: siteUrl + (locale === "en" ? EN_PREFIX : ""),
      title: siteTitle,
      description,
      // L'accueil n'a pas de métadonnées propres : l'image du site est déclarée ici.
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      images: [shareImage],
    },
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        // Icône principale, sans condition de thème : c'est celle que Google
        // retient pour les résultats de recherche. Ses exigences sont d'être
        // carrée, d'au moins 48 px (multiple de 48) et déclarée sans ambiguïté -
        // les variantes 16/32 px conditionnées par `prefers-color-scheme` ne les
        // satisfaisaient pas, d'où l'icône générique affichée jusqu'ici.
        { url: "/favicon/brand/icon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon/brand/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon/brand/icon-512.png", sizes: "512x512", type: "image/png" },
        // Variantes claires/sombres conservées pour l'onglet du navigateur.
        {
          url: "/favicon/black/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/favicon/white/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
          media: "(prefers-color-scheme: dark)",
        },
        {
          url: "/favicon/black/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/favicon/white/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
          media: "(prefers-color-scheme: dark)",
        },
      ],
      // L'icône Apple sert aussi de repli à Google : elle doit rester lisible
      // quel que soit le fond, d'où la version sur fond de marque.
      apple: [{ url: "/favicon/brand/apple-touch-icon.png", sizes: "180x180" }],
    },
  };
}
