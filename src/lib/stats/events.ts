/**
 * Mesure d'audience du portfolio : ce que le navigateur envoie, et ce que le
 * serveur accepte. Commun aux deux côtés (aucune dépendance).
 *
 * Anonyme et sans cookie : une « visite » est un onglet ouvert (identifiant
 * tiré au hasard, gardé le temps de l'onglet dans sessionStorage), sans
 * adresse IP ni empreinte du navigateur. Le serveur n'ajoute que le type
 * d'appareil (déduit du navigateur, qui n'est pas gardé) et le pays (en-tête
 * de Vercel).
 */

export const EVENT_NAMES = [
  /** Page affichée ; `target` : la page d'où l'on vient, sur le site. */
  "view",
  /** Page quittée ; `value` : secondes passées, `target` : défilement atteint (%). */
  "leave",
  /** Accueil : projet atteint en défilant ; `value` : son rang dans la galerie (0 = le premier). */
  "reach",
  /** Objet 3D touché ou attrapé ; `target` : son nom au catalogue. */
  "object",
  /** Trou noir ouvert ; `target` : comment (clavier, clics, secousse). */
  "destroy",
  /** Arrivée dans une dimension ; `target` : laquelle. */
  "dimension",
  /** Passage par le portail (ou les flèches, ou une secousse) ; `target` : vers quelle dimension. */
  "portal",
  /** Contact ; `target` : write (messagerie), copy (adresse copiée). */
  "contact",
  /** Lien vers un autre site ; `target` : son domaine. */
  "outbound",
  /** Fichier téléchargé ; `target` : son nom (le CV). */
  "download",
  /** Image ou vidéo ouverte en grand ; `target` : sa légende. */
  "media",
  /** Projet précédent ou suivant, en bas d'une page projet ; `target` : previous, next. */
  "pager",
  /** Réglages changés ; `target` : la nouvelle valeur. */
  "theme",
  "lang",
  "sound",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

/** Un évènement tel que le navigateur l'envoie. */
export type SentEvent = {
  /** Nom (cf. EVENT_NAMES). */
  n: EventName;
  /** Page où il a eu lieu. */
  p: string;
  t?: string;
  v?: number;
  /** Instant, horloge du navigateur (ms). */
  at: number;
  /** Première page de la visite : domaine du site d'où l'on arrive. */
  r?: string;
};

/** Un envoi groupé. */
export type SentBatch = {
  /** Identifiant de la visite (cf. ci-dessus). */
  s: string;
  /** Horloge du navigateur à l'envoi : recale les instants sur celle du serveur. */
  now: number;
  locale?: string;
  theme?: string;
  e: SentEvent[];
};

/** Au plus, par envoi : au-delà, l'envoi est refusé. */
export const MAX_EVENTS = 40;
export const MAX_BODY = 16_000;
