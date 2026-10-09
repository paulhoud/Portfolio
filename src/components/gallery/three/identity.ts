import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  Euler,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Petits objets qui flottent autour des plaques : des choses qui racontent
 * Paul (liste donnée par Paul le 9 oct. 2026) — paire de sneakers, barre
 * chocolatée, maki, sushi, Star Drop de Brawl Stars, Pokéball, boîte de
 * kebab, burger, skate, chat, cartes Yu-Gi-Oh!, manette Xbox, BD.
 *
 * Ce sont des jouets stylisés, assemblés à partir de formes simples (aucun
 * modèle téléchargé) : chaque objet est fusionné en une seule géométrie dont
 * les couleurs sont portées par les sommets, pour un seul dessin par objet.
 * Chaque géométrie est centrée et tient dans un cube de côté 1.
 */

export const IDENTITY_MODELS = [
  "pokeball",
  "sneakers",
  "burger",
  "controller",
  "sushi",
  "starDrop",
  "skateboard",
  "cat",
  "maki",
  "cards",
  "chocolate",
  "kebab",
  "comic",
] as const;
export type IdentityModel = (typeof IDENTITY_MODELS)[number];

type Place = {
  at?: [number, number, number];
  rot?: [number, number, number];
  scale?: [number, number, number];
};

/** Une pièce colorée, mise en place, prête à fusionner. */
function part(geometry: BufferGeometry, color: string, place: Place = {}): BufferGeometry {
  const piece = geometry.index ? geometry.toNonIndexed() : geometry;
  if (piece !== geometry) geometry.dispose();
  const matrix = new Matrix4().compose(
    new Vector3(...(place.at ?? [0, 0, 0])),
    new Quaternion().setFromEuler(new Euler(...(place.rot ?? [0, 0, 0]))),
    new Vector3(...(place.scale ?? [1, 1, 1])),
  );
  piece.applyMatrix4(matrix);
  const tint = new Color(color);
  const count = piece.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }
  piece.setAttribute("color", new Float32BufferAttribute(colors, 3));
  // Seuls ces attributs sont communs à toutes les formes.
  for (const name of Object.keys(piece.attributes)) {
    if (!["position", "normal", "uv", "color"].includes(name)) piece.deleteAttribute(name);
  }
  return piece;
}

/** Fusionne les pièces, centre l'objet et le ramène dans un cube de côté 1. */
function assemble(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts, false);
  for (const piece of parts) piece.dispose();
  if (!merged) throw new Error("identity: fusion impossible");
  merged.computeBoundingBox();
  const box = merged.boundingBox!;
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);
  const scale = 1 / Math.max(size.x, size.y, size.z);
  merged.translate(-center.x, -center.y, -center.z);
  merged.scale(scale, scale, scale);
  merged.computeBoundingSphere();
  return merged;
}

const box = (w: number, h: number, d: number, r: number, segments = 3) =>
  new RoundedBoxGeometry(w, h, d, segments, Math.min(r, Math.min(w, h, d) / 2 - 1e-4));
const cylinder = (top: number, bottom: number, height: number, segments = 28, open = false) =>
  new CylinderGeometry(top, bottom, height, segments, 1, open);
const sphere = (radius: number, w = 24, h = 16) => new SphereGeometry(radius, w, h);

/** Tirage pseudo-aléatoire stable (les objets sont toujours les mêmes). */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function pokeball() {
  return assemble([
    part(new SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), "#e3350d"),
    part(new SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), "#f4f4f2"),
    part(cylinder(0.506, 0.506, 0.075, 40, true), "#1c1c1f"),
    part(cylinder(0.155, 0.155, 0.1, 28), "#1c1c1f", { at: [0, 0, 0.47], rot: [Math.PI / 2, 0, 0] }),
    part(cylinder(0.1, 0.1, 0.12, 28), "#f4f4f2", { at: [0, 0, 0.49], rot: [Math.PI / 2, 0, 0] }),
  ]);
}

function shoe(offsetZ: number, turn: number): BufferGeometry[] {
  const place = (x: number, y: number, z: number, rot: [number, number, number] = [0, 0, 0]): Place => {
    const c = Math.cos(turn);
    const s = Math.sin(turn);
    return { at: [x * c + z * s, y, -x * s + z * c + offsetZ], rot: [rot[0], rot[1] + turn, rot[2]] };
  };
  // Sneaker blanche : semelle épaisse, talon haut et pointe arrondie, col
  // bleu nuit autour de l'ouverture, languette, bande et talon rouges, lacets.
  const white = "#f4f3ef";
  const red = "#e23b3b";
  const navy = "#1f2a44";
  return [
    part(box(1.02, 0.11, 0.36, 0.05), white, place(0, 0.055, 0)),
    part(box(1.03, 0.02, 0.365, 0.008), "#cfcfd4", place(0, 0.085, 0)),
    part(box(0.6, 0.3, 0.33, 0.14), white, place(-0.15, 0.25, 0)),
    part(box(0.5, 0.18, 0.33, 0.09), white, place(0.23, 0.18, 0, [0, 0, -0.08])),
    part(cylinder(0.12, 0.12, 0.03, 24), "#2a2a30", { ...place(-0.22, 0.395, 0), scale: [1.4, 1, 1] }),
    part(new TorusGeometry(0.125, 0.032, 8, 28), navy, { ...place(-0.22, 0.39, 0, [Math.PI / 2, 0, 0]), scale: [1.35, 1, 1] }),
    part(box(0.14, 0.16, 0.2, 0.05), navy, place(-0.04, 0.39, 0, [0, 0, -0.35])),
    part(box(0.46, 0.06, 0.337, 0.025), red, place(-0.04, 0.22, 0, [0, 0, 0.35])),
    part(box(0.06, 0.14, 0.13, 0.025), red, place(-0.46, 0.32, 0)),
    ...[0.06, 0.13, 0.2].map((x) => part(box(0.035, 0.025, 0.24, 0.01), "#c9c9cf", place(x, 0.29 - (x - 0.06) * 0.45, 0, [0, 0, -0.25]))),
  ];
}

function sneakers() {
  return assemble([...shoe(0.25, 0.1), ...shoe(-0.26, -0.14)]);
}

function burger() {
  const random = seeded(7);
  const seeds = Array.from({ length: 9 }, (_, i) => {
    const angle = i * 2.4;
    const polar = 0.35 + 0.45 * random();
    return part(sphere(0.028, 8, 6), "#fff4d6", {
      at: [0.5 * Math.sin(polar) * Math.cos(angle), 0.38 + 0.33 * Math.cos(polar), 0.5 * Math.sin(polar) * Math.sin(angle)],
      scale: [1, 0.55, 1.6],
      rot: [0, angle, 0],
    });
  });
  return assemble([
    part(cylinder(0.48, 0.44, 0.15), "#d8954a", { at: [0, 0.075, 0] }),
    part(cylinder(0.51, 0.5, 0.13), "#5b2f16", { at: [0, 0.21, 0] }),
    part(box(0.76, 0.03, 0.76, 0.01), "#ffc531", { at: [0, 0.29, 0], rot: [0, Math.PI / 4, 0] }),
    part(cylinder(0.45, 0.45, 0.05), "#e2392c", { at: [0, 0.32, 0] }),
    part(cylinder(0.54, 0.53, 0.04, 14), "#79c043", { at: [0, 0.355, 0] }),
    part(new SphereGeometry(0.5, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), "#e3a04f", { at: [0, 0.37, 0], scale: [1, 0.66, 1] }),
    ...seeds,
  ]);
}

function controller() {
  const body = "#eef0f2";
  const dark = "#27282c";
  return assemble([
    part(box(0.74, 0.17, 0.4, 0.08), body),
    ...[-1, 1].map((side) =>
      part(new CapsuleGeometry(0.12, 0.24, 6, 16), body, { at: [side * 0.29, -0.03, 0.2], rot: [Math.PI / 2, side * 0.38, 0] }),
    ),
    part(cylinder(0.055, 0.055, 0.07), dark, { at: [-0.21, 0.1, -0.03] }),
    part(cylinder(0.075, 0.07, 0.025), dark, { at: [-0.21, 0.14, -0.03] }),
    part(cylinder(0.055, 0.055, 0.07), dark, { at: [0.1, 0.1, 0.1] }),
    part(cylinder(0.075, 0.07, 0.025), dark, { at: [0.1, 0.14, 0.1] }),
    part(box(0.13, 0.035, 0.045, 0.012), dark, { at: [-0.09, 0.095, 0.1] }),
    part(box(0.045, 0.035, 0.13, 0.012), dark, { at: [-0.09, 0.095, 0.1] }),
    part(sphere(0.03, 12, 8), "#3dbb4c", { at: [0.24, 0.09, 0.065] }),
    part(sphere(0.03, 12, 8), "#e0403a", { at: [0.3, 0.09, 0] }),
    part(sphere(0.03, 12, 8), "#2f8de4", { at: [0.18, 0.09, 0] }),
    part(sphere(0.03, 12, 8), "#f2c23a", { at: [0.24, 0.09, -0.065] }),
    part(cylinder(0.045, 0.045, 0.02), "#b9bcc2", { at: [0, 0.09, -0.1] }),
    ...[-1, 1].map((side) => part(box(0.22, 0.05, 0.07, 0.02), dark, { at: [side * 0.24, 0.04, -0.21] })),
  ]);
}

function sushi() {
  return assemble([
    part(box(0.86, 0.3, 0.44, 0.14), "#f7f4ec"),
    part(box(1.0, 0.13, 0.5, 0.06), "#ff8656", { at: [0, 0.2, 0], rot: [0, 0, 0.04] }),
    ...[-0.28, -0.08, 0.12, 0.32].map((x) =>
      part(box(0.035, 0.135, 0.46, 0.012), "#ffd2bd", { at: [x, 0.205, 0], rot: [0, 0.55, 0.04] }),
    ),
    part(box(0.16, 0.47, 0.47, 0.02), "#1f3a2b", { at: [0, 0.07, 0] }),
  ]);
}

function starDrop() {
  const star = new Shape();
  for (let i = 0; i < 10; i += 1) {
    const angle = Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? 0.5 : 0.24;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) star.moveTo(x, y);
    else star.lineTo(x, y);
  }
  star.closePath();
  const extrude = (depth: number, bevel: number) =>
    new ExtrudeGeometry(star, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 1 });
  return assemble([
    part(extrude(0.16, 0.07), "#ffc21f", { at: [0, 0, -0.08] }),
    part(extrude(0.04, 0.02), "#ffe98a", { at: [0, 0.02, 0.13], scale: [0.55, 0.55, 1] }),
  ]);
}

function skateboard() {
  const deck = "#ff5d8f";
  const grip = "#1f1f23";
  const tail = (side: number) => [
    part(box(0.2, 0.03, 0.28, 0.012), deck, { at: [side * 0.44, 0.035, 0], rot: [0, 0, side * 0.35] }),
    part(box(0.19, 0.012, 0.27, 0.005), grip, { at: [side * 0.44 - side * 0.006, 0.056, 0], rot: [0, 0, side * 0.35] }),
  ];
  return assemble([
    part(box(0.72, 0.03, 0.28, 0.012), deck),
    part(box(0.72, 0.012, 0.27, 0.005), grip, { at: [0, 0.021, 0] }),
    ...tail(1),
    ...tail(-1),
    ...[-0.25, 0.25].map((x) => part(box(0.07, 0.06, 0.22, 0.02), "#b8bcc4", { at: [x, -0.045, 0] })),
    ...[-0.25, 0.25].flatMap((x) =>
      [-0.13, 0.13].map((z) => part(cylinder(0.055, 0.055, 0.05, 18), "#f3e15c", { at: [x, -0.09, z], rot: [Math.PI / 2, 0, 0] })),
    ),
  ]);
}

function cat() {
  const fur = "#f29b4b";
  const white = "#fff3e6";
  return assemble([
    part(sphere(0.32), fur, { at: [0, 0.3, 0], scale: [0.9, 1.08, 0.85] }),
    part(sphere(0.2), white, { at: [0, 0.32, 0.17], scale: [0.85, 1, 0.55] }),
    part(sphere(0.24), fur, { at: [0, 0.72, 0.05] }),
    part(sphere(0.1), white, { at: [0, 0.66, 0.23], scale: [1.25, 0.8, 0.8] }),
    part(sphere(0.032, 10, 8), "#ff8fa3", { at: [0, 0.71, 0.31] }),
    ...[-1, 1].map((side) => part(sphere(0.036, 10, 8), "#1c1c1f", { at: [side * 0.085, 0.77, 0.24] })),
    ...[-1, 1].map((side) => part(new ConeGeometry(0.085, 0.17, 14), fur, { at: [side * 0.13, 0.95, 0.03], rot: [0, 0, -side * 0.35] })),
    ...[-1, 1].map((side) => part(sphere(0.075, 12, 8), white, { at: [side * 0.1, 0.04, 0.22], scale: [1, 0.6, 1.3] })),
    part(new TorusGeometry(0.2, 0.05, 8, 24, Math.PI * 1.1), fur, { at: [0.22, 0.12, -0.12], rot: [Math.PI / 2, 0, 0.6] }),
    ...[0.08, 0, -0.08].map((x) => part(box(0.035, 0.02, 0.12, 0.008), "#d97a2b", { at: [x, 0.955, 0.02], rot: [0.3, 0, 0] })),
  ]);
}

function maki() {
  return assemble([
    part(cylinder(0.5, 0.5, 0.5, 36, true), "#1f3a2b"),
    part(cylinder(0.47, 0.47, 0.52, 36), "#f7f4ec"),
    part(cylinder(0.17, 0.17, 0.54, 20), "#ff7f50", { at: [-0.04, 0, 0] }),
    part(cylinder(0.08, 0.08, 0.545, 12), "#8cc63f", { at: [0.17, 0, 0.06] }),
  ]);
}

function card(face: boolean, place: Place): BufferGeometry[] {
  const lift = (z: number): Place => ({ ...place, at: [place.at![0], place.at![1], place.at![2] + z] });
  const local = (x: number, y: number, z: number, w: number, h: number, color: string) => {
    const rot = place.rot ?? [0, 0, 0];
    const c = Math.cos(rot[2]);
    const s = Math.sin(rot[2]);
    const [px, py, pz] = place.at!;
    return part(box(w, h, 0.004, 0.002), color, { at: [px + x * c - y * s, py + x * s + y * c, pz + z], rot });
  };
  const parts = [part(box(0.59, 0.86, 0.016, 0.03), face ? "#c99a45" : "#6b3e1f", lift(0))];
  if (face) {
    parts.push(local(0, 0.34, 0.009, 0.5, 0.07, "#f3e6c4"));
    parts.push(local(0, 0.06, 0.009, 0.48, 0.4, "#3d5fae"));
    parts.push(local(0.06, 0.1, 0.012, 0.18, 0.18, "#f2c23a"));
    parts.push(local(0, -0.27, 0.009, 0.5, 0.2, "#efe3c2"));
  } else {
    parts.push(local(0, 0, 0.009, 0.36, 0.56, "#3b2412"));
  }
  return parts;
}

function cards() {
  return assemble([
    ...card(false, { at: [-0.16, -0.02, -0.03], rot: [0, 0, 0.32] }),
    ...card(false, { at: [0, 0, 0], rot: [0, 0, 0.08] }),
    ...card(true, { at: [0.16, -0.03, 0.03], rot: [0, 0, -0.18] }),
  ]);
}

function chocolate() {
  return assemble([
    part(box(1.0, 0.1, 0.48, 0.03), "#5a3418"),
    ...[0.13, 0.37].flatMap((x) =>
      [-0.115, 0.115].map((z) => part(box(0.21, 0.06, 0.21, 0.03), "#6e401e", { at: [x, 0.065, z] })),
    ),
    part(box(0.56, 0.16, 0.54, 0.04), "#c8102e", { at: [-0.24, 0, 0] }),
    part(box(0.3, 0.012, 0.22, 0.004), "#f2c14e", { at: [-0.26, 0.085, 0] }),
    part(box(0.06, 0.165, 0.545, 0.02), "#cfd3da", { at: [0.06, 0, 0] }),
  ]);
}

function kebab() {
  const random = seeded(3);
  const box_ = "#f2efe8";
  const lidAngle = -1.9;
  const fries = Array.from({ length: 10 }, () =>
    part(box(0.055, 0.055, 0.3, 0.015), "#f4c542", {
      at: [-0.3 + random() * 0.3, 0.17 + random() * 0.05, -0.18 + random() * 0.36],
      rot: [random() * 0.3, random() * Math.PI, random() * 0.3],
    }),
  );
  const meat = Array.from({ length: 6 }, () =>
    part(box(0.17, 0.07, 0.12, 0.03), "#8b4a2b", {
      at: [0.12 + random() * 0.28, 0.18 + random() * 0.04, -0.2 + random() * 0.4],
      rot: [random() * 0.3, random() * Math.PI, random() * 0.2],
    }),
  );
  const salad = Array.from({ length: 4 }, () =>
    part(box(0.14, 0.02, 0.09, 0.008), "#7cc14b", { at: [0.05 + random() * 0.3, 0.23, -0.2 + random() * 0.4], rot: [0, random() * Math.PI, 0.2] }),
  );
  const tomato = Array.from({ length: 3 }, () =>
    part(cylinder(0.065, 0.065, 0.03, 14), "#e63b2e", { at: [0.1 + random() * 0.3, 0.235, -0.15 + random() * 0.3] }),
  );
  return assemble([
    part(box(1.0, 0.3, 0.7, 0.05), box_),
    part(box(1.0, 0.04, 0.7, 0.02), box_, {
      at: [0, 0.17 + 0.35 * Math.sin(-lidAngle), -0.35 + 0.35 * Math.cos(-lidAngle)],
      rot: [lidAngle, 0, 0],
    }),
    ...fries,
    ...meat,
    ...salad,
    ...tomato,
    part(sphere(0.12, 14, 10), "#fffaf0", { at: [0.3, 0.24, 0.12], scale: [1.6, 0.4, 1.2] }),
  ]);
}

function comic() {
  return assemble([
    part(box(0.72, 0.98, 0.012, 0.006), "#2f7dd1", { at: [0, 0, 0.034] }),
    part(box(0.72, 0.98, 0.012, 0.006), "#2f7dd1", { at: [0, 0, -0.034] }),
    part(box(0.024, 0.98, 0.08, 0.008), "#235fa0", { at: [-0.36, 0, 0] }),
    part(box(0.69, 0.95, 0.056, 0.004), "#fbf7ec", { at: [0.01, 0, 0] }),
    part(box(0.6, 0.15, 0.006, 0.003), "#ffe04a", { at: [0, 0.36, 0.042] }),
    part(cylinder(0.15, 0.15, 0.008, 24), "#ffffff", { at: [0.1, 0.04, 0.042], rot: [Math.PI / 2, 0, 0], scale: [1.25, 1, 0.85] }),
    part(new ConeGeometry(0.05, 0.12, 3), "#ffffff", { at: [0.01, -0.1, 0.042], rot: [0, 0, 2.6], scale: [1, 1, 0.08] }),
    part(sphere(0.09, 16, 12), "#ff8a3d", { at: [-0.16, -0.25, 0.042], scale: [1, 1, 0.12] }),
    part(box(0.4, 0.035, 0.006, 0.003), "#ffffff", { at: [0.05, -0.42, 0.042] }),
  ]);
}

const BUILDERS: Record<IdentityModel, () => BufferGeometry> = {
  pokeball,
  sneakers,
  burger,
  controller,
  sushi,
  starDrop,
  skateboard,
  cat,
  maki,
  cards,
  chocolate,
  kebab,
  comic,
};

/** Les treize objets, dans l'ordre de `IDENTITY_MODELS`. */
export function buildIdentityModels(): BufferGeometry[] {
  return IDENTITY_MODELS.map((name) => BUILDERS[name]());
}
