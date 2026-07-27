import type { Project, ProjectMedia } from "@/content/projects";

/**
 * Aplati la liste ordonnée des médias visionnables d'un projet, dans le même
 * ordre que le rendu : les projets à blocs exposent les médias de leurs blocs
 * « media », les autres exposent `project.media`. Cet ordre alimente la
 * navigation précédent/suivant de la visionneuse.
 */
export function collectProjectMedia(project: Project): ProjectMedia[] {
  if (project.blocks?.length) {
    return project.blocks.flatMap((block) => (block.type === "media" ? block.media : []));
  }
  return project.media ?? [];
}
