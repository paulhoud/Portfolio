import { mediaManifest, type MediaEntry, type MediaKey } from "./generated/media-manifest";

export { mediaManifest };
export type { MediaEntry, MediaKey };

/**
 * Résout les chemins média (image placeholder + animation .webm) d'une carte
 * à partir de sa clé. Insensible à la casse ; renvoie `null` si aucune paire
 * n'existe, ce qui permet aux composants de retomber proprement sur un rendu
 * sans média.
 */
/**
 * Instant (en secondes) où démarre la lecture de chaque animation de tuile.
 *
 * Chaque vidéo commence par un plan fixe, identique à l'image placeholder, de
 * 0,3 à 1,4 s : au survol, la tuile semblait ne pas réagir. On démarre donc
 * juste avant le premier mouvement (mesuré le 8 oct. 2026, moins 80 ms de
 * marge), sans rien couper de l'animation. À remesurer si une vidéo change.
 */
const motionStartAt: Partial<Record<MediaKey, number>> = {
  UPIKAJOB: 0.8,
  MEMENTO: 0.84,
  YDL: 1.16,
  JIVE: 0.44,
  SANOFI: 0.56,
  FIDESIO: 0.24,
  CAPGEMINI: 1.28,
  BAIO: 0.72,
  SAEGUS: 0.36,
  LGM: 0.36,
  PERSO: 0.52,
};

/** Instant de départ de l'animation d'une carte (0 si inconnu). */
export function getMotionStart(key: string | undefined | null): number {
  if (!key) return 0;
  return motionStartAt[key.toUpperCase() as MediaKey] ?? 0;
}

export function getProjectMedia(key: string | undefined | null): MediaEntry | null {
  if (!key) return null;
  return (mediaManifest as Record<string, MediaEntry>)[key.toUpperCase()] ?? null;
}
