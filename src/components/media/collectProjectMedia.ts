import type { Project, ProjectMedia } from "@/content/projects";

/**
 * Aplati la liste ordonnée des médias visionnables d'un projet, dans l'ordre où
 * ils apparaissent à l'écran : d'abord les captures du récit, puis les médias
 * des blocs ou du projet. Cet ordre alimente la navigation précédent/suivant de
 * la visionneuse.
 *
 * Les captures du récit sont converties en médias : sans cela, elles seraient
 * les seuls visuels du site à ne pas s'ouvrir en grand.
 */
export function collectProjectMedia(project: Project): ProjectMedia[] {
  const storyShots: ProjectMedia[] = (project.story?.beats ?? [])
    .flatMap((beat) => (beat.type === "stage" ? beat.shots : []))
    .filter((shot) => shot.image)
    .map((shot) => ({ title: shot.caption, image: shot.image! }));

  const blockMedia = project.blocks?.length
    ? project.blocks.flatMap((block) => (block.type === "media" ? block.media : []))
    : [];

  return [...storyShots, ...blockMedia, ...(project.media ?? [])];
}
