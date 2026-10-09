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
 *
 * Revu image par image le 9 oct. 2026 : les mouvements discrets du début
 * (trait du cygne d'Yves Delorme, écriture de « Capgemini », premier point de
 * Sanofi et du citron de Baio) étaient coupés.
 */
const motionStartAt: Partial<Record<MediaKey, number>> = {
  UPIKAJOB: 0.8,
  MEMENTO: 0.84,
  YDL: 0.5,
  JIVE: 0.44,
  SANOFI: 0.42,
  FIDESIO: 0.24,
  CAPGEMINI: 0,
  BAIO: 0.55,
  SAEGUS: 0.36,
  LGM: 0.36,
  PERSO: 0.52,
};

/**
 * Instant (en secondes) où arrêter une animation de tuile qui s'efface avant
 * la fin de son fichier. Celle d'UpikaJob garde son logo entier jusqu'à 8,8 s,
 * puis il disparaît et la tuile reste blanche jusqu'à 12 s (mesuré le 9 oct.
 * 2026) : comme le survol fige la dernière image, on s'arrête avant. Celle
 * d'Yves Delorme efface son cygne et son nom de 3,6 s à 4 s.
 */
const motionEndAt: Partial<Record<MediaKey, number>> = {
  UPIKAJOB: 8.8,
  YDL: 3.5,
};

/** Instant d'arrêt de l'animation d'une carte, ou `null` pour aller au bout. */
export function getMotionEnd(key: string | undefined | null): number | null {
  if (!key) return null;
  return motionEndAt[key.toUpperCase() as MediaKey] ?? null;
}

/** Instant de départ de l'animation d'une carte (0 si inconnu). */
export function getMotionStart(key: string | undefined | null): number {
  if (!key) return 0;
  return motionStartAt[key.toUpperCase() as MediaKey] ?? 0;
}

export function getProjectMedia(key: string | undefined | null): MediaEntry | null {
  if (!key) return null;
  return (mediaManifest as Record<string, MediaEntry>)[key.toUpperCase()] ?? null;
}
