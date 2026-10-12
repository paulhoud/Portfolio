/**
 * Place du portail vers une autre dimension, en fraction de la scène (x, y
 * depuis le haut à gauche), et rayon de son ombre en pixels. Écran en
 * largeur : en haut à droite, loin du message ; en hauteur : à droite, au-dessus
 * du message (et sous celui de South Park, en haut).
 *
 * À part du moteur 3D (chargé à la demande) : la page s'en sert aussi pour
 * poser le bouton du portail exactement sur lui (cf. GalleryHome).
 */
export function portalAnchor(width: number, height: number) {
  return width >= height ? { x: 0.8, y: 0.32, radius: 26 } : { x: 0.74, y: 0.43, radius: 22 };
}
