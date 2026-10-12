import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/content/profile";
import { projects } from "@/content/projects";
import { localePath } from "@/i18n/paths";

/**
 * Sitemap généré au build à partir du catalogue de projets : toute nouvelle
 * réalisation ajoutée dans `projects.ts` y apparaît automatiquement, sans
 * maintenance manuelle. Chaque page y figure dans ses deux langues, chacune
 * signalant l'autre (hreflang).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages: { path: string; changeFrequency: "monthly" | "yearly"; priority: number }[] = [
    { path: "/", changeFrequency: "monthly", priority: 1 },
    { path: "/about", changeFrequency: "yearly", priority: 0.8 },
    { path: "/method", changeFrequency: "yearly", priority: 0.6 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
    { path: "/legal", changeFrequency: "yearly", priority: 0.2 },
    ...projects.map((project) => ({ path: `/projects/${project.slug}`, changeFrequency: "yearly" as const, priority: 0.7 })),
  ];

  return pages.flatMap(({ path, changeFrequency, priority }) => {
    const languages = { fr: absoluteUrl(localePath(path, "fr")), en: absoluteUrl(localePath(path, "en")) };
    return (["fr", "en"] as const).map((locale) => ({
      url: languages[locale],
      lastModified,
      changeFrequency,
      // L'anglais, version secondaire, un cran sous le français.
      priority: locale === "fr" ? priority : Math.round(priority * 0.8 * 10) / 10,
      alternates: { languages },
    }));
  });
}
