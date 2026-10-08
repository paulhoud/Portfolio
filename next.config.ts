import type { NextConfig } from "next";

/**
 * Domaine canonique du site (sans "www"), aligné sur `src/content/profile.ts`.
 * Pour basculer sur la version "www", inverser les deux constantes ci-dessous
 * ET mettre à jour `siteUrl` dans `profile.ts` — les deux doivent rester
 * cohérents, sinon les balises canonical désignent une URL redirigée.
 */
const CANONICAL_HOST = "paulhoudebine.com";
const REDIRECTED_HOST = "www.paulhoudebine.com";

/** Ancien slug → nouveau slug (cf. `src/content/projects.ts`). */
const LEGACY_PROJECT_SLUGS: [string, string][] = [
  ["odyssey", "sanofi-espoir"],
  ["unicorn", "fidesio"],
  ["lemon", "baio"],
  ["alpha", "saegus"],
  ["studio", "le-grand-menage"],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // AVIF d'abord (env. 30 % plus léger que WebP à qualité perçue égale),
    // WebP en repli pour les navigateurs qui ne le gèrent pas.
    formats: ["image/avif", "image/webp"],
    // Next ne sert que les qualités déclarées ici, et n'en autorise qu'une seule
    // (75) par défaut. C'est insuffisant pour des captures d'interface, où le
    // texte et les aplats marquent vite la compression : 92 est réservé aux
    // visuels de projet, 75 reste le réglage courant.
    qualities: [75, 92],
  },

  async redirects() {
    return [
      // Anciennes adresses de projets, héritées du prototype et sans rapport
      // avec leur contenu (« /odyssey » pour Sanofi, etc.). Les liens déjà
      // partagés et les pages indexées sont renvoyés vers la nouvelle adresse.
      //
      // Sur « www », on vise directement l'adresse canonique : sans ces règles,
      // la règle relative ci-dessous s'appliquerait d'abord et la redirection
      // « www » ensuite, soit deux sauts au lieu d'un.
      ...LEGACY_PROJECT_SLUGS.map(([from, to]) => ({
        source: `/projects/${from}`,
        has: [{ type: "host" as const, value: REDIRECTED_HOST }],
        destination: `https://${CANONICAL_HOST}/projects/${to}`,
        permanent: true,
      })),
      ...LEGACY_PROJECT_SLUGS.map(([from, to]) => ({
        source: `/projects/${from}`,
        destination: `/projects/${to}`,
        permanent: true,
      })),
      {
        // "www" et le domaine nu servaient tous deux le site : deux URLs pour
        // un même contenu, ce qui divise les signaux de référencement et fait
        // diverger les balises canonical. Cette redirection permanente (301)
        // consolide tout sur le domaine canonique.
        //
        // ⚠️ Ne pas configurer en parallèle une redirection inverse
        // (domaine nu → www) chez l'hébergeur : cela créerait une boucle.
        source: "/:path*",
        has: [{ type: "host", value: REDIRECTED_HOST }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
