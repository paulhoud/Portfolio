import { projects } from "@/content/projects";
import {
  localizeLinkLabels,
  localizeProject,
  localizeProjects,
} from "./localize";
import type { Locale, Translations } from "./types";
import { enProjectTranslations } from "./translations/en-projects";
import { enSite } from "./translations/en-site";
import { frSite } from "./translations/fr-site";

function buildFrenchProjectTranslations() {
  return Object.fromEntries(
    projects.map((project) => [
      project.slug,
      {
        title: project.title,
        eyebrow: project.eyebrow,
        description: project.description,
        detailSubtitle: project.detailSubtitle,
        introParagraphs: project.introParagraphs,
        sections: project.sections,
        media: project.media?.map((item) => ({ title: item.title })),
        blocks: project.blocks,
      },
    ]),
  );
}

const frProjectTranslations = buildFrenchProjectTranslations();

export const translations: Record<Locale, Translations> = {
  fr: {
    site: frSite,
    projects: frProjectTranslations,
  },
  en: {
    site: enSite,
    projects: enProjectTranslations,
  },
};

export function getLocalizedProjects(locale: Locale) {
  return localizeProjects(projects, locale, translations[locale].projects).map(
    (project) => localizeLinkLabels(project, locale, translations[locale].site.common),
  );
}

export function getLocalizedProject(slug: string, locale: Locale) {
  const project = projects.find((item) => item.slug === slug);
  if (!project) {
    return undefined;
  }

  const localized = localizeProject(project, locale, translations[locale].projects);
  return localizeLinkLabels(localized, locale, translations[locale].site.common);
}
