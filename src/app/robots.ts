import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/content/profile";

/**
 * robots.txt généré par Next. Autorise l'ensemble du site et déclare le
 * sitemap, ce qui donne aux moteurs un point d'entrée explicite vers toutes
 * les pages (auparavant : robots.txt absent, réponse 404).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
