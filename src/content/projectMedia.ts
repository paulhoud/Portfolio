import { mediaManifest, type MediaEntry, type MediaKey } from "./generated/media-manifest";

export { mediaManifest };
export type { MediaEntry, MediaKey };

/**
 * Résout les chemins média (image placeholder + animation .webm) d'une carte
 * à partir de sa clé. Insensible à la casse ; renvoie `null` si aucune paire
 * n'existe, ce qui permet aux composants de retomber proprement sur un rendu
 * sans média.
 */
export function getProjectMedia(key: string | undefined | null): MediaEntry | null {
  if (!key) return null;
  return (mediaManifest as Record<string, MediaEntry>)[key.toUpperCase()] ?? null;
}
