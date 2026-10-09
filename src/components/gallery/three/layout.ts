/**
 * Géométrie de la galerie 3D — fonctions pures, sans three.js.
 *
 * Inspiration : l'accueil de spline.design. Les onze tuiles deviennent des
 * plaques arrondies et épaisses qui flottent dans le noir, au-dessus d'une
 * grille au sol. Elles s'échelonnent en profondeur, en quinconce, et la
 * caméra les traverse au défilement : le projet actif se tourne vers elle
 * pendant que les suivants attendent au loin, un peu de biais.
 *
 * Unités : mètres et radians. Repère : Y vers le haut, la visite s'enfonce
 * vers -Z.
 */

export const PIECE_SIZE = 1.6;
/** Le premier projet (UpikaJob) est plus grand que les autres. */
export const LEAD_PIECE_SIZE = 2;
/** Plaques épaisses aux angles très adoucis, comme les volumes de Spline. */
export const SLAB_DEPTH = 0.44;
/** Rayon de l'arrondi (three le limite à la moitié de l'épaisseur). */
export const SLAB_RADIUS = 0.22;
/** Hauteur moyenne des plaques au-dessus de la grille. */
export const FLOAT_Y = 1.7;
/** L'œil est un peu au-dessus des plaques : on voit la grille au sol, comme chez Spline. */
export const EYE_LIFT = 0.42;

/**
 * Quinconce dessiné à la main : deux plaques qui se suivent sont toujours
 * nettement décalées, pour que la suivante dépasse à côté de l'active au lieu
 * de se cacher derrière.
 */
const LANE_X = [0, -2.3, 1.5, -0.9, 2.3, -1.9, 0.4, 2.4, -1.2, 1.0, -2.2];
const LANE_Y = [0, 0.45, -0.35, 0.5, -0.3, 0.35, -0.45, 0.2, -0.4, 0.5, -0.2];

export type Vec3 = [number, number, number];

export type PieceLayout = {
  position: Vec3;
  /** Biais de la plaque quand elle n'est pas active (x, y, z). */
  tilt: Vec3;
  size: number;
  /** Décalage de phase du flottement, propre à chaque plaque. */
  phase: number;
};

/** Hasard déterministe : la même disposition à chaque visite. */
function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export type Spacing = {
  /** Recul de la caméra devant une plaque ordinaire. */
  view: number;
  /** Écart en profondeur entre deux plaques. */
  depth: number;
  /** Ampleur du quinconce. */
  spread: number;
  /**
   * Sur écran large, le texte occupe la gauche : les satellites restent à
   * droite (1). Sinon, ils se répartissent des deux côtés (0).
   */
  rightOnly: boolean;
  /** Écran en hauteur (téléphone) : rien au-dessus des plaques, où est le titre. */
  portrait: boolean;
};

/**
 * L'écart en profondeur suit la distance de vue : la plaque qu'on vient de
 * quitter doit être derrière la caméra une fois arrivé à la suivante.
 */
export function spacingFor(viewDistance: number, aspect: number): Spacing {
  const wide = aspect >= 1.25;
  return {
    view: viewDistance,
    depth: Math.max(6.2, viewDistance * 1.3 + 1.2),
    // Sur ordinateur, un quinconce resserré garde les voisines hors de la
    // colonne de texte : elles passent en partie derrière la plaque active.
    spread: wide ? 0.6 : aspect < 0.8 ? 0.8 : 1,
    rightOnly: wide,
    portrait: aspect < 0.8,
  };
}

export function layoutPieces(count: number, spacing: Spacing): PieceLayout[] {
  const pieces: PieceLayout[] = [];
  for (let index = 0; index < count; index += 1) {
    const laneX = LANE_X[index] ?? (seeded(index, 1) - 0.5) * 4.6;
    const laneY = LANE_Y[index] ?? (seeded(index, 2) - 0.5) * 0.9;
    const x = laneX * spacing.spread;
    pieces.push({
      position: [x, FLOAT_Y + laneY, -index * spacing.depth],
      // Les plaques au repos se tournent vers l'allée, comme pour la regarder.
      tilt: [
        (seeded(index, 3) - 0.5) * 0.36,
        Math.max(-0.6, Math.min(0.6, -laneX * 0.2 + (seeded(index, 4) - 0.5) * 0.3)),
        (seeded(index, 5) - 0.5) * 0.3,
      ],
      size: index === 0 ? LEAD_PIECE_SIZE : PIECE_SIZE,
      phase: seeded(index, 6) * Math.PI * 2,
    });
  }
  return pieces;
}

/**
 * Position de défilement → position de visite, en « numéro de plaque »
 * fractionnaire. La caméra marque une pause devant chaque plaque : la
 * progression reste plate au début et à la fin de chaque tranche.
 */
export function scrollToStation(raw: number, count: number): number {
  const clamped = Math.min(count - 1, Math.max(0, raw));
  const base = Math.floor(clamped);
  if (base >= count - 1) return count - 1;
  const t = (clamped - base - 0.16) / 0.68;
  const eased = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  return base + eased;
}

export type Framing = {
  /** Ouverture verticale de la caméra, en degrés. */
  fov: number;
  /** Part du cadre HTML qu'occupe une plaque ordinaire. */
  fill: number;
};

/** Cadrage selon la forme de l'écran : plus ouvert en portrait. */
export function framingFor(aspect: number): Framing {
  if (aspect < 0.8) return { fov: 56, fill: 0.72 };
  if (aspect < 1.25) return { fov: 46, fill: 0.72 };
  return { fov: 38, fill: 0.72 };
}

/**
 * Distance de vue pour qu'une plaque ordinaire mesure `targetPx` pixels de
 * haut sur un écran de `viewportPx` pixels de haut.
 */
export function viewDistance(fovDeg: number, viewportPx: number, targetPx: number): number {
  const half = Math.tan((fovDeg * Math.PI) / 360);
  return (PIECE_SIZE * viewportPx) / (2 * half * Math.max(80, targetPx));
}

/** Courbe de Catmull-Rom passant par les plaques : la caméra ondule entre elles. */
function pathPoint(pieces: PieceLayout[], station: number): Vec3 {
  const last = pieces.length - 1;
  if (last === 0) return [...pieces[0].position];
  const clamped = Math.min(last, Math.max(0, station));
  const i = Math.min(last - 1, Math.floor(clamped));
  const t = clamped - i;
  const p0 = pieces[Math.max(0, i - 1)].position;
  const p1 = pieces[i].position;
  const p2 = pieces[i + 1].position;
  const p3 = pieces[Math.min(last, i + 2)].position;
  const t2 = t * t;
  const t3 = t2 * t;
  const out: Vec3 = [0, 0, 0];
  for (let k = 0; k < 3; k += 1) {
    out[k] =
      0.5 *
      (2 * p1[k] +
        (-p0[k] + p2[k]) * t +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
        (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
  }
  return out;
}

/** Taille de plaque interpolée à la station (le recul s'adapte à la plaque). */
export function sizeAt(pieces: PieceLayout[], station: number): number {
  const last = pieces.length - 1;
  const clamped = Math.min(last, Math.max(0, station));
  const i = Math.floor(clamped);
  const j = Math.min(last, i + 1);
  return pieces[i].size + (pieces[j].size - pieces[i].size) * (clamped - i);
}

export type CameraPose = { position: Vec3; target: Vec3 };

/** Pose de la caméra : bien en face de la station, en retrait de `distance`. */
export function cameraPose(pieces: PieceLayout[], station: number, distance: number): CameraPose {
  const target = pathPoint(pieces, station);
  return {
    position: [target[0], target[1] + EYE_LIFT, target[2] + distance],
    target,
  };
}

/** Petit objet décoratif qui flotte autour d'une plaque, à la manière de Spline. */
export type SatelliteLayout = {
  owner: number;
  position: Vec3;
  /** Largeur, hauteur, profondeur de la place qu'il occupe (un cube). */
  size: Vec3;
  /** Vitesse de rotation propre (rad/s). */
  spin: Vec3;
  phase: number;
};

/**
 * Jusqu'à quatre satellites par plaque (des objets qui racontent Paul, cf.
 * identity.ts), sur trois plans comme chez Spline :
 * - un à l'extérieur de l'allée ;
 * - un au-dessus ou au-dessous (à côté sur téléphone, où le titre est en haut) ;
 * - une silhouette sombre au loin, que le brouillard estompe ;
 * - un plus gros au premier plan, coupé par le bord de l'écran, seulement si
 *   l'allée repart de l'autre côté (la caméra ne le traverse jamais).
 * Aucun ne recouvre la plaque qu'il accompagne ni la colonne de texte, et
 * aucun n'en touche un autre ni ne traverse une plaque. Sur ordinateur, ils
 * sont moins nombreux (pas de silhouette lointaine) et plus gros, et environ
 * une plaque sur deux en a un de l'autre côté, un peu en retrait : il occupe
 * la bande libre entre la colonne de texte et la plaque.
 */
export function layoutSatellites(pieces: PieceLayout[], spacing: Spacing): SatelliteLayout[] {
  const satellites: SatelliteLayout[] = [];
  const wide = !spacing.portrait;
  const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const placed: { position: Vec3; extent: number }[] = [];
  /** Ni contre un autre objet, ni à travers une plaque (bercements et rotations compris). */
  const roomy = (position: Vec3, extent: number) =>
    placed.every((other) => dist(position, other.position) > other.extent + extent + 0.25) &&
    pieces.every((other) => dist(position, other.position) > other.size * 0.75 + extent + 0.1);
  pieces.forEach((piece, owner) => {
    const [px, py, pz] = piece.position;
    const half = piece.size / 2;
    const out = spacing.rightOnly || owner === 0 ? 1 : px >= 0 ? 1 : -1;
    const next = pieces[owner + 1];
    const pathLeaves = !next || Math.sign(next.position[0] - px) === -out;

    for (let k = 0; k < 5; k += 1) {
      const salt = owner * 7 + k * 31;
      const r = (n: number) => seeded(salt, n);
      if (k === 3 && !pathLeaves) continue;
      if (k === 2 && wide) continue;
      // Côté texte : ordinateur seulement, une plaque sur deux environ.
      if (k === 4 && (!wide || r(0) > 0.55)) continue;

      // Assez grands pour qu'on reconnaisse l'objet : plus gros au loin (le
      // brouillard les estompe) et au premier plan.
      const s = [0.45 + 0.3 * r(1), 0.38 + 0.25 * r(1), 0.62 + 0.3 * r(1), 0.65 + 0.2 * r(1), 0.4 + 0.15 * r(1)][k] * (wide ? 1.35 : 1);
      const size: Vec3 = [s, s, s];

      let position: Vec3;
      if (k === 0) {
        position = [
          px + out * (half + 1.1 + 1.3 * r(3)) * spacing.spread,
          py + (r(4) - 0.5) * 1.6,
          pz + (r(5) - 0.5) * spacing.depth * 0.45,
        ];
      } else if (k === 1 && spacing.portrait) {
        position = [px - out * (half + 0.2 + 0.35 * r(4)), py + (r(5) - 0.5) * half, pz - 0.3 - r(6) * 0.6];
      } else if (k === 1) {
        const up = r(3) > 0.45 ? 1 : -1;
        const dx = spacing.rightOnly ? r(4) * 1.3 : (r(4) - 0.5) * 2.6;
        position = [px + dx * spacing.spread, py + up * (half + 0.55 + 0.5 * r(5)), pz - 0.6 - r(6) * spacing.depth * 0.3];
      } else if (k === 2) {
        // Silhouette lointaine, en hauteur : au-dessus du regard quand la
        // caméra passe dessous pour rejoindre la plaque suivante.
        const dx = spacing.rightOnly ? 0.5 + r(4) * 3 : (r(4) - 0.5) * 5;
        position = [px + dx * spacing.spread, py + 2.8 + r(5) * 0.8, pz - 2.5 - r(6) * 2.5];
      } else if (k === 3) {
        position = [px + out * (half + 0.35 + 0.3 * r(7)), py + (r(8) - 0.5) * half, pz + 1.2 + 0.6 * r(9)];
      } else {
        // De l'autre côté de la plaque, juste derrière son plan : à l'écran,
        // entre le texte et elle, sans jamais la masquer.
        position = [px - out * (half + 0.75 + 0.25 * r(7)), py + (r(8) - 0.5) * half * 1.2, pz - 0.8 - 0.5 * r(9)];
      }
      // Les objets tiennent dans un cube de côté `s` mais ne le remplissent pas.
      const extent = 0.6 * s;
      // Jamais à travers la grille, même en tournant sur lui-même.
      position[1] = Math.max(0.23 + extent, position[1]);
      // Ni sur le trajet de la caméra, ni devant une plaque qu'on regarde :
      // on l'écarte vers l'extérieur, ou on y renonce.
      const fits = () => satelliteClear(pieces, spacing, owner, position, extent) && roomy(position, extent);
      let tries = 0;
      while (!fits() && tries < 6) {
        position[0] += out * 0.6;
        tries += 1;
      }
      if (!fits()) continue;
      placed.push({ position, extent });

      satellites.push({
        owner,
        position,
        size,
        spin: [(r(10) - 0.5) * 0.5, (r(11) - 0.5) * 0.7, (r(12) - 0.5) * 0.4],
        phase: r(13) * Math.PI * 2,
      });
    }
  });
  return satellites;
}

/** Position de la caméra à une station (au repos ou en chemin), sans la parallaxe. */
function cameraAt(pieces: PieceLayout[], spacing: Spacing, station: number): Vec3 {
  return cameraPose(pieces, station, (spacing.view * sizeAt(pieces, station)) / PIECE_SIZE).position;
}

/**
 * Un satellite est bien placé s'il reste loin du trajet de la caméra autour
 * de sa plaque, et s'il ne masque aucune des plaques vues depuis les stations
 * voisines. La marge couvre la parallaxe de la souris (±0,32 m).
 */
function satelliteClear(pieces: PieceLayout[], spacing: Spacing, owner: number, position: Vec3, extent: number): boolean {
  const last = pieces.length - 1;
  const from = Math.max(0, owner - 1);
  const to = Math.min(last, owner + 2);
  const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  for (let station = from; station <= to + 1e-6; station += 0.05) {
    if (dist(position, cameraAt(pieces, spacing, station)) < extent + 0.9) return false;
  }

  for (let station = from; station <= to; station += 1) {
    const eye = cameraAt(pieces, spacing, station);
    const piece = pieces[station];
    const axis: Vec3 = [piece.position[0] - eye[0], piece.position[1] - eye[1], piece.position[2] - eye[2]];
    const length2 = axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2;
    const rel: Vec3 = [position[0] - eye[0], position[1] - eye[1], position[2] - eye[2]];
    const u = (rel[0] * axis[0] + rel[1] * axis[1] + rel[2] * axis[2]) / length2;
    if (u <= 0 || u >= 1) continue;
    const closest: Vec3 = [eye[0] + axis[0] * u, eye[1] + axis[1] * u, eye[2] + axis[2] * u];
    // Cône de vue vers la plaque : coins compris, survol et parallaxe aussi.
    const radius = (piece.size / 2) * 1.5 * u + 0.32 * (1 - u) + 0.12;
    if (dist(position, closest) < radius + extent) return false;
  }
  return true;
}
