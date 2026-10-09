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

/**
 * Vitesse de lecture des animations de tuiles : un peu plus vive que l'export,
 * sans dénaturer le mouvement.
 */
export const PLAYBACK_RATE = 1.2;

/**
 * Lumière de chaque tableau dans la galerie 3D.
 *
 * - `glow` : couleur que le tableau projette sur le mur et le sol, prise dans
 *   la marque (le logo plutôt que le fond quand le fond est blanc ou noir).
 * - `exposure` : luminosité du tableau. Les tuiles à fond clair éblouissent
 *   dans la salle sombre : elles sont baissées, sans changer leur teinte.
 * - `accent` : couleur des petits volumes autour de la plaque, si elle
 *   diffère de la lumière au sol (Archive : lumière blanche, volumes rouges).
 *
 * Réglé à l'œil le 9 oct. 2026, à revoir avec Paul sur son écran.
 */
export type TileLight = { glow: string; exposure: number; accent?: string };

const tileLights: Partial<Record<MediaKey, TileLight>> = {
  UPIKAJOB: { glow: "#2f9bff", exposure: 0.8 },
  MEMENTO: { glow: "#3cc9b0", exposure: 1 },
  YDL: { glow: "#a9c7cc", exposure: 0.8 },
  JIVE: { glow: "#ffb800", exposure: 0.92 },
  SANOFI: { glow: "#d4ac7c", exposure: 0.8 },
  FIDESIO: { glow: "#ff3345", exposure: 0.95 },
  CAPGEMINI: { glow: "#1f8fd6", exposure: 0.8 },
  BAIO: { glow: "#7fe03a", exposure: 0.9 },
  SAEGUS: { glow: "#b9b9c8", exposure: 1 },
  LGM: { glow: "#d8603e", exposure: 0.85 },
  // Lumière blanche au sol (demande de Paul, 9 oct. 2026), volumes rouge piment.
  PERSO: { glow: "#eeeef2", exposure: 1, accent: "#ef5a4c" },
};

/** Lumière d'un tableau, avec un repli neutre. */
export function getTileLight(key: string | undefined | null): TileLight {
  const fallback = { glow: "#c8c8d0", exposure: 0.9 };
  if (!key) return fallback;
  return tileLights[key.toUpperCase() as MediaKey] ?? fallback;
}

/**
 * Couleur du pourtour de chaque image de tuile (moyenne d'une bande de 4 % le
 * long des bords, mesurée le 9 oct. 2026). C'est la couleur du voile qui
 * couvre l'écran quand on entre dans un projet depuis la galerie 3D : la
 * plaque qui remplit l'écran se prolonge sans saut. Elle diffère du fond
 * déclaré pour Archive, dont la tuile est sombre.
 */
const tileEdges: Partial<Record<MediaKey, string>> = {
  UPIKAJOB: "#ffffff",
  MEMENTO: "#1d1d23",
  YDL: "#e4eff1",
  JIVE: "#ffb800",
  SANOFI: "#f5f2ef",
  FIDESIO: "#fe373b",
  CAPGEMINI: "#e4eff1",
  BAIO: "#78da31",
  SAEGUS: "#171718",
  LGM: "#dad0c1",
  PERSO: "#272731",
};

/** Couleur du pourtour d'une tuile, ou `fallback` si elle n'est pas mesurée. */
export function getTileEdge(key: string | undefined | null, fallback: string): string {
  if (!key) return fallback;
  return tileEdges[key.toUpperCase() as MediaKey] ?? fallback;
}

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
