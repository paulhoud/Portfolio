import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/content/profile";
import { projects } from "@/content/projects";

/**
 * Sitemap généré au build à partir du catalogue de projets : toute nouvelle
 * réalisation ajoutée dans `projects.ts` y apparaît automatiquement, sans
 * maintenance manuelle.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/about"), lastModified, changeFrequency: "yearly", priority: 0.8 },
    { url: absoluteUrl("/method"), lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/contact"), lastModified, changeFrequency: "yearly", priority: 0.6 },
  ];

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: absoluteUrl(`/projects/${project.slug}`),
    lastModified,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  return [...staticPages, ...projectPages];
}
