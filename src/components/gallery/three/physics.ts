import { Vector3 } from "three";

/**
 * Objet qu'on peut attraper et lancer : un décalage par rapport à sa place,
 * en position et en rotation, ramené par un ressort amorti. On le tire, on le
 * lâche avec de l'élan, il file puis revient de lui-même, après une ou deux
 * oscillations.
 */
export type Body = {
  /** Décalage de position et vitesse (m, m/s). */
  offset: Vector3;
  velocity: Vector3;
  /**
   * Décalage de rotation (vecteur rotation : axe dans la salle, longueur =
   * angle en rad) et vitesse de rotation (rad/s).
   */
  turn: Vector3;
  spin: Vector3;
  /** Tenu par le visiteur : le ressort ne s'applique pas. */
  held: boolean;
  /** Position de repos de l'image en cours (sans décalage). */
  rest: Vector3;
};

export function createBody(): Body {
  return {
    offset: new Vector3(),
    velocity: new Vector3(),
    turn: new Vector3(),
    spin: new Vector3(),
    held: false,
    rest: new Vector3(),
  };
}

/** Raideur et amortissement, en position puis en rotation. */
export type Spring = { stiffness: number; damping: number; turnStiffness: number; turnDamping: number };
export const SLAB_SPRING: Spring = { stiffness: 22, damping: 5.2, turnStiffness: 17.6, turnDamping: 4.7 };
// Les objets reprennent lentement leur orientation : on a le temps de voir la
// face qu'on a tournée vers soi en les attrapant.
export const SATELLITE_SPRING: Spring = { stiffness: 30, damping: 4.4, turnStiffness: 2.2, turnDamping: 2.4 };

const scratch = new Vector3();

/** Avance d'un pas ; renvoie vrai tant que l'objet n'est pas revenu au repos. */
export function stepBody(body: Body, dt: number, spring: Spring): boolean {
  if (!body.held) {
    // Ressort amorti (intégration semi-implicite, stable aux pas courts).
    scratch.copy(body.offset).multiplyScalar(-spring.stiffness).addScaledVector(body.velocity, -spring.damping);
    body.velocity.addScaledVector(scratch, dt);
    body.offset.addScaledVector(body.velocity, dt);
    // Jamais trop loin : un lancer violent ne perd pas l'objet hors du monde.
    if (body.offset.length() > 9) body.offset.setLength(9);
    // Tenu, l'objet garde l'orientation qu'on lui donne ; lâché, il la reprend.
    scratch.copy(body.turn).multiplyScalar(-spring.turnStiffness).addScaledVector(body.spin, -spring.turnDamping);
    body.spin.addScaledVector(scratch, dt);
    body.turn.addScaledVector(body.spin, dt);
  }

  const moving =
    body.held ||
    body.offset.lengthSq() > 1e-6 ||
    body.velocity.lengthSq() > 1e-6 ||
    body.turn.lengthSq() > 1e-6 ||
    body.spin.lengthSq() > 1e-6;
  if (!moving) {
    body.offset.set(0, 0, 0);
    body.velocity.set(0, 0, 0);
    body.turn.set(0, 0, 0);
    body.spin.set(0, 0, 0);
  }
  return moving;
}
