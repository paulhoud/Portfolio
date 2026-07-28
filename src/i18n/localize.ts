import type { Project, ProjectBlock, ProjectMedia, ProjectSection } from "@/content/projects";
import type { Locale, MethodStep, ProjectCopy, SiteCopy } from "./types";

function mergeSections(
  base: ProjectSection[],
  translated: ProjectSection[] | undefined,
): ProjectSection[] {
  if (!translated) {
    return base;
  }

  return base.map((section, index) => ({
    ...section,
    title: translated[index]?.title ?? section.title,
    body: translated[index]?.body ?? section.body,
  }));
}

function mergeMedia(
  base: ProjectMedia[] | undefined,
  translated: { title: string }[] | undefined,
): ProjectMedia[] | undefined {
  if (!base) {
    return base;
  }

  return base.map((item, index) => ({
    ...item,
    title: translated?.[index]?.title ?? item.title,
  }));
}

function mergeBlocks(
  base: ProjectBlock[] | undefined,
  translated: ProjectCopy["blocks"],
): ProjectBlock[] | undefined {
  if (!base || !translated) {
    return base;
  }

  return base.map((block, index) => {
    const overlay = translated[index];
    if (!overlay || overlay.type !== block.type) {
      return block;
    }

    if (block.type === "sections" && overlay.type === "sections") {
      return {
        type: "sections",
        sections: block.sections.map((section, sectionIndex) => ({
          title: overlay.sections[sectionIndex]?.title ?? section.title,
          body: overlay.sections[sectionIndex]?.body ?? section.body,
        })),
      };
    }

    if (block.type === "media" && overlay.type === "media") {
      return {
        ...block,
        caption: overlay.caption ?? block.caption,
        media: block.media.map((item, mediaIndex) => ({
          ...item,
          title: overlay.media[mediaIndex]?.title ?? item.title,
          link: item.link
            ? {
                ...item.link,
                label:
                  overlay.media[mediaIndex]?.title && item.link.label
                    ? item.link.label
                    : item.link.label,
              }
            : undefined,
        })),
      };
    }

    if (block.type === "links" && overlay.type === "links") {
      return {
        type: "links",
        links: block.links.map((link, linkIndex) => ({
          ...link,
          label: overlay.links[linkIndex]?.label ?? link.label,
        })),
      };
    }

    return block;
  });
}

/**
 * Applique les textes traduits au récit, chapitre par chapitre, en conservant
 * les captures du catalogue (elles ne dépendent pas de la langue). Un chapitre
 * ou une légende non traduits gardent leur version d'origine.
 */
function mergeStory(
  base: Project["story"],
  translated: ProjectCopy["story"],
): Project["story"] {
  if (!base || !translated) return base;

  return {
    lead: translated.lead ?? base.lead,
    closing: {
      ...base.closing,
      title: translated.closing?.title ?? base.closing.title,
      body: translated.closing?.body ?? base.closing.body,
      // Seul le libellé est traduit : l'adresse reste celle du catalogue.
      link: base.closing.link
        ? {
            ...base.closing.link,
            label: translated.closing?.link?.label ?? base.closing.link.label,
          }
        : undefined,
    },
    chapters: base.chapters.map((chapter, index) => {
      const copy = translated.chapters?.[index];
      if (!copy) return chapter;

      return {
        ...chapter,
        period: copy.period ?? chapter.period,
        role: copy.role ?? chapter.role,
        title: copy.title ?? chapter.title,
        body: copy.body ?? chapter.body,
        shots: chapter.shots.map((shot, shotIndex) => ({
          ...shot,
          caption: copy.shots?.[shotIndex]?.caption ?? shot.caption,
        })),
      };
    }),
  };
}

export function localizeProject(
  project: Project,
  locale: Locale,
  translations: Record<string, ProjectCopy>,
): Project {
  if (locale === "fr") {
    return project;
  }

  const copy = translations[project.slug];
  if (!copy) {
    return project;
  }

  return {
    ...project,
    title: copy.title ?? project.title,
    eyebrow: copy.eyebrow ?? project.eyebrow,
    description: copy.description ?? project.description,
    detailSubtitle: copy.detailSubtitle ?? project.detailSubtitle,
    introParagraphs: copy.introParagraphs ?? project.introParagraphs,
    sections: mergeSections(project.sections, copy.sections),
    story: mergeStory(project.story, copy.story),
    media: mergeMedia(project.media, copy.media),
    blocks: mergeBlocks(project.blocks, copy.blocks),
    gallery: copy.media?.map((item) => item.title) ?? project.gallery,
  };
}

export function localizeProjects(
  items: Project[],
  locale: Locale,
  translations: Record<string, ProjectCopy>,
): Project[] {
  return items.map((project) => localizeProject(project, locale, translations));
}

export function localizeMethodSteps(
  steps: MethodStep[],
  locale: Locale,
  englishSteps: MethodStep[],
): MethodStep[] {
  return locale === "en" ? englishSteps : steps;
}

export function localizeLinkLabels(
  project: Project,
  locale: Locale,
  linkLabels: SiteCopy["common"],
): Project {
  if (locale === "fr") {
    return project;
  }

  const labelMap: Record<string, string> = {
    "Voir la vidéo": linkLabels.seeVideo,
    "Voir le site": linkLabels.seeSite,
    "Voir sur Figma": linkLabels.viewOnFigma,
  };

  const localizeMedia = (media: ProjectMedia[] | undefined) =>
    media?.map((item) =>
      item.link
        ? {
            ...item,
            link: {
              ...item.link,
              label: labelMap[item.link.label] ?? item.link.label,
            },
          }
        : item,
    );

  const localizeBlocks = (blocks: ProjectBlock[] | undefined) =>
    blocks?.map((block) => {
      if (block.type === "links") {
        return {
          type: "links" as const,
          links: block.links.map((link) => ({
            ...link,
            label: labelMap[link.label] ?? link.label,
          })),
        };
      }

      if (block.type === "media") {
        return {
          ...block,
          media: block.media.map((item) =>
            item.link
              ? {
                  ...item,
                  link: {
                    ...item.link,
                    label: labelMap[item.link.label] ?? item.link.label,
                  },
                }
              : item,
          ),
        };
      }

      return block;
    });

  return {
    ...project,
    media: localizeMedia(project.media),
    blocks: localizeBlocks(project.blocks),
  };
}
