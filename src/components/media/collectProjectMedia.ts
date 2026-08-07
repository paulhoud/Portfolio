import type { Project, ProjectMedia, ProjectStoryShot } from "@/content/projects";

/**
 * Identifiant stable d'un média, indépendant de sa légende.
 *
 * Un même visuel peut apparaître à plusieurs endroits d'une page — la mise en
 * avant reprend des écrans que le récit montre aussi — parfois sous des
 * légendes différentes. Se repérer au fichier plutôt qu'au titre garantit qu'un
 * clic ouvre toujours la même diapositive, quel que soit l'endroit cliqué.
 */
export function mediaKeyOf(media: Pick<ProjectMedia, "title" | "image">) {
  return media.image?.src ?? media.title;
}

const toMedia = (shot: ProjectStoryShot): ProjectMedia => ({
  title: shot.caption,
  image: shot.image!,
});

/**
 * Aplati la liste ordonnée des médias visionnables d'un projet, dans l'ordre où
 * ils apparaissent à l'écran. Cet ordre alimente la navigation
 * précédent/suivant de la visionneuse : la n-ième vignette de la page doit
 * ouvrir la n-ième diapositive.
 *
 * Les doublons sont écartés : un visuel montré deux fois ne doit pas occuper
 * deux diapositives, sans quoi la navigation repasserait sur la même image.
 */
export function collectProjectMedia(project: Project): ProjectMedia[] {
  const story = project.story;

  // La mise en avant ouvre la page : ses visuels viennent donc en tête.
  const highlightShots = (story?.highlight?.shots ?? []).filter((shot) => shot.image).map(toMedia);

  const beatShots = (story?.beats ?? [])
    .flatMap((beat) => (beat.type === "stage" ? beat.shots : []))
    .filter((shot) => shot.image)
    .map(toMedia);

  const blockMedia = project.blocks?.length
    ? project.blocks.flatMap((block) => (block.type === "media" ? block.media : []))
    : [];

  const ordered = [...highlightShots, ...beatShots, ...blockMedia, ...(project.media ?? [])];

  const seen = new Set<string>();
  return ordered.filter((media) => {
    const key = mediaKeyOf(media);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
