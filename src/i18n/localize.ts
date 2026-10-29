import type { Project, ProjectBlock, ProjectMedia, ProjectSection } from "@/content/projects";
import type { Locale, ProjectCopy, SiteCopy } from "./types";

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

/** Textes traduits du chapitre du design system ; images, couleurs et chiffres restent ceux du catalogue. */
function mergeSystem(
  base: NonNullable<Project["story"]>["system"],
  translated: NonNullable<ProjectCopy["story"]>["system"],
): NonNullable<Project["story"]>["system"] {
  if (!base || !translated) return base;
  return {
    ...base,
    label: translated.label,
    title: translated.title,
    body: translated.body,
    cover: { ...base.cover, caption: translated.cover.caption },
    origins: {
      title: translated.origins.title,
      body: translated.origins.body,
      shots: base.origins.shots.map((shot, index) => ({ ...shot, caption: translated.origins.shots[index]?.caption ?? shot.caption })),
    },
    levelsTitle: translated.levelsTitle,
    levels: base.levels.map((level, index) => translated.levels[index] ?? level),
    foundations: base.foundations.map((shot, index) => ({ ...shot, caption: translated.foundations[index]?.caption ?? shot.caption })),
    zoomsTitle: translated.zoomsTitle,
    zooms: base.zooms.map((zoom, index) => ({ ...zoom, ...translated.zooms[index] })),
    decision: {
      ...base.decision,
      label: translated.decision.label,
      title: translated.decision.title,
      body: translated.decision.body,
      before: { ...base.decision.before, ...translated.decision.before },
      after: { ...base.decision.after, ...translated.decision.after },
      shot: { ...base.decision.shot, caption: translated.decision.shot.caption },
    },
    assembled: { ...base.assembled, caption: translated.assembled.caption },
  };
}

/** Chapitre de la mascotte : les textes traduits, les images, le modèle et les vidéos du catalogue. */
function mergeMascot(
  base: NonNullable<Project["story"]>["mascot"],
  translated: NonNullable<ProjectCopy["story"]>["mascot"],
): NonNullable<Project["story"]>["mascot"] {
  if (!base || !translated) return base;
  return {
    label: translated.label,
    title: translated.title,
    body: translated.body,
    compare: {
      ...translated.compare,
      states: base.compare.states.map((state, index) => ({ ...state, ...translated.compare.states[index] })),
    },
    viewer: {
      ...base.viewer,
      title: translated.viewer.title,
      body: translated.viewer.body,
      hint: translated.viewer.hint,
      skeleton: translated.viewer.skeleton,
      states: base.viewer.states.map((state, index) => ({ ...state, ...translated.viewer.states[index] })),
    },
    clips: {
      title: translated.clips.title,
      body: translated.clips.body,
      items: base.clips.items.map((item, index) => ({ ...item, ...translated.clips.items[index] })),
    },
  };
}

/** Chapitres de la galerie : les textes traduits, les images, couleurs et échantillons du catalogue. */
function mergeChapters(base: Project["chapters"], translated: ProjectCopy["chapters"]): Project["chapters"] {
  if (!base || !translated) return base;
  return base.map((chapter, index) => {
    const copy = translated[index];
    if (chapter.type === "walkthrough" && copy?.type === "walkthrough") {
      return {
        ...chapter,
        label: copy.label,
        title: copy.title,
        body: copy.body,
        steps: chapter.steps.map((step, stepIndex) => ({ ...step, ...copy.steps[stepIndex] })),
      };
    }
    if (chapter.type === "charter" && copy?.type === "charter") {
      return {
        ...chapter,
        label: copy.label,
        title: copy.title,
        body: copy.body,
        palettes: chapter.palettes.map((palette, paletteIndex) => ({ ...palette, ...copy.palettes[paletteIndex] })),
        fonts: chapter.fonts.map((font, fontIndex) => ({ ...font, ...copy.fonts[fontIndex] })),
      };
    }
    return chapter;
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
    bridge: translated.bridge ?? base.bridge,
    highlight:
      base.highlight && translated.highlight
        ? {
            ...base.highlight,
            label: translated.highlight.label ?? base.highlight.label,
            title: translated.highlight.title ?? base.highlight.title,
            body: translated.highlight.body ?? base.highlight.body,
            shots: base.highlight.shots.map((shot, index) => ({
              ...shot,
              caption: translated.highlight?.shots?.[index]?.caption ?? shot.caption,
            })),
          }
        : base.highlight,
    system: mergeSystem(base.system, translated.system),
    mascot: mergeMascot(base.mascot, translated.mascot),
    trackLabels: translated.trackLabels ?? base.trackLabels,
    beats: base.beats.map((beat, index) => {
      const copy = translated.beats?.[index];
      // Un temps fort dont la traduction est absente - ou d'un autre type -
      // garde sa version d'origine plutôt que de produire un contenu incohérent.
      if (!copy || copy.type !== beat.type) return beat;

      if (beat.type === "pivot" && copy.type === "pivot") {
        return { ...beat, label: copy.label ?? beat.label, statement: copy.statement ?? beat.statement };
      }

      if (beat.type === "stage" && copy.type === "stage") {
        return {
          ...beat,
          period: copy.period ?? beat.period,
          product: { ...beat.product, ...copy.product },
          role: { ...beat.role, ...copy.role },
          shots: beat.shots.map((shot, shotIndex) => ({
            ...shot,
            caption: copy.shots?.[shotIndex]?.caption ?? shot.caption,
          })),
        };
      }

      return beat;
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
    context: copy.context ?? project.context,
    introParagraphs: copy.introParagraphs ?? project.introParagraphs,
    sections: mergeSections(project.sections, copy.sections),
    story: mergeStory(project.story, copy.story),
    media: mergeMedia(project.media, copy.media),
    chapters: mergeChapters(project.chapters, copy.chapters),
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
