import type { NextConfig } from "next";

/**
 * Domaine canonique du site (sans "www"), aligné sur `src/content/profile.ts`.
 * Pour basculer sur la version "www", inverser les deux constantes ci-dessous
 * ET mettre à jour `siteUrl` dans `profile.ts` — les deux doivent rester
 * cohérents, sinon les balises canonical désignent une URL redirigée.
 */
const CANONICAL_HOST = "paulhoudebine.com";
const REDIRECTED_HOST = "www.paulhoudebine.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // AVIF d'abord (env. 30 % plus léger que WebP à qualité perçue égale),
    // WebP en repli pour les navigateurs qui ne le gèrent pas.
    formats: ["image/avif", "image/webp"],
  },

  async redirects() {
    return [
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
