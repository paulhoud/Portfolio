import {
  BufferGeometry,
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
import type { ModelDecal } from "./identityFiles";
import type { SatelliteHint } from "./layout";

/**
 * Petits objets qui flottent autour des plaques : des choses qui racontent
 * Paul (listes données par Paul le 9 oct. 2026).
 *
 * Ce sont des modèles 3D trouvés par Paul (fichiers de public/models, cf.
 * identityFiles.ts) : chiot, sneaker, burger, Pokéball, sushi, Power Cube,
 * skate, chat, Rondoudou, ours en peluche.
 *
 * Certains ont ici un équivalent construit en code à partir de formes
 * simples, affiché seulement si leur fichier ne se charge pas. Chacun est
 *   fusionné en une seule géométrie dont les couleurs sont portées par les
 *   sommets, centrée et tenant dans un cube de côté 1.
 */

/** Un objet du catalogue : un fichier, une construction, ou les deux (secours). */
export type IdentityEntry = {
  name: string;
  /** Fichier de public/models. */
  file?: string;
  /** Construction en code : l'objet lui-même, ou son secours. */
  build?: () => BufferGeometry;
  /** Agrandissement, pour les objets longs et fins qui paraîtraient petits. */
  size?: number;
  /** Couleurs imposées à certaines pièces du fichier (nom du matériau ou de la pièce → couleur). */
  tints?: Record<string, string>;
  /** Images posées sur certaines pièces (écran, dessous de planche). */
  decals?: ModelDecal[];
  /** Textures en pixels apparents (Minecraft). */
  pixelated?: boolean;
  /** Rotation de départ (radians) qui tourne la face de l’objet vers nous. */
  turn?: [number, number, number];
  /**
   * Toujours de face : l’objet se balance doucement au lieu de tourner sur
   * lui-même (un animal qu’on verrait sinon de dos).
   */
  front?: boolean;
  /** Écran allumé : la pièce devient blanche et lumineuse, avec un halo. */
  screen?: { piece: string; glow?: number };
  /** Placement : plus près de sa plaque (cf. SatelliteHint). */
  place?: SatelliteHint;
  /**
   * Sons joués à tour de rôle quand on attrape ou touche l’objet (fichiers
   * de public/sounds/objects, sans extension), si le son du site est actif.
   */
  sounds?: string[];
};

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







/**
 * Ordre de passage : les objets se suivent d'un satellite au suivant, si bien
 * que chaque plaque en a de différents et qu'un objet ne revient qu'après
 * tous les autres (dix-sept plus loin, soit trois à quatre projets). Les
 * familles (à manger, animaux, Pokémon, écrans…) sont espacées pour que deux
 * voisins ne se ressemblent pas.
 */
// Retirés à la demande de Paul (9 oct. 2026) : BD, manette, barre chocolatée,
// sushi et maki construits en code, cartes Yu-Gi-Oh!, sneaker Adidas, Lapras,
// 3DS et kebab.
export const IDENTITY_CATALOG: IdentityEntry[] = [
  // Le chiot remplace le shiba (licence plus libre). Premier du catalogue :
  // il prend la place la plus en vue près d’UpikaJob, à droite de la plaque
  // (hors du voile du texte), et reste de face. Remplacer le modèle : changer
  // `file` (un loup Minecraft est prévu).
  {
    name: "dog",
    file: "dog.glb",
    front: true,
    sounds: ["bark-1", "bark-2", "minecraft-dog-bark"],
  },
  { name: "burger", file: "burger.glb", build: burger, sounds: ["heavy-eating"] },
  { name: "pokeball", file: "pokeball.glb", build: pokeball, sounds: ["pokeball-1", "pokeball-2", "pokeball-3"] },
  {
    name: "sneakers",
    file: "white-sneaker.glb",
    build: sneakers,
    // Sneaker blanche colorisée (demande de Paul) : empiècements de daim rouges,
    // doublure noire, semelle intérieure sombre, cuir et semelle blancs.
    tints: { WhiteSuede: "#c8102e", WhiteSatin: "#1b1b1f", Insole: "#26262b", WhiteSole: "#f1efe8" },
    sounds: ["run-sound", "run-meme"],
  },
  // Écran allumé : blanc uni et halo, à la place du fond d’écran du modèle.
  {
    name: "smartphone",
    file: "smartphone.glb",
    screen: { piece: "Wallpaper", glow: 3.2 },
    // De face et côté texte sur ordinateur : son écran allumé reste en vue.
    front: true,
    place: { textSide: true },
    sounds: ["phone-vibrate"],
  },
  {
    name: "lego",
    file: "lego.glb",
    size: 1.2,
    // Le personnage Lego classique (demande de Paul) : tête et mains jaunes,
    // buste et bras rouges, hanches et jambes bleues (les jambes « Cube.001 » et
    // « Cube.002 » perdent leur point au chargement).
    tints: {
      Head_Bunny_0: "#f2c81a",
      Hand1_Bunny_0: "#f2c81a",
      Hand2_Bunny_0: "#f2c81a",
      Torso_Bunny_0: "#c4281c",
      Arm1_Bunny_0: "#c4281c",
      Arm2_Bunny_0: "#c4281c",
      Waist_Bunny_0: "#0d4fb3",
      Cube001_Bunny_0: "#0d4fb3",
      Cube002_Bunny_0: "#0d4fb3",
    },
    sounds: ["lego"],
  },
  // Le plateau flotte, le dessus incliné vers nous : on voit les sushis.
  { name: "sushi", file: "sushi.glb", front: true, turn: [0.55, 0, 0], sounds: ["sushi-koto"] },
  {
    name: "minecraftCube",
    file: "minecraft-cube.glb",
    pixelated: true,
    // Côté texte sur ordinateur, plus près de sa plaque sur téléphone : bien en vue.
    place: { textSide: true, near: 0.6 },
    sounds: ["minecraft-pop", "minecraft-up", "minecraft-creeper", "eating-minecraft"],
  },
  // Le fichier assombrit sa texture de 60 % : on rend au ballon son blanc.
  { name: "football", file: "football.glb", tints: { Baked: "#ffffff" }, sounds: ["football-1", "football-2"] },
  {
    name: "tv",
    file: "tv.glb",
    // De face (l’écran vers nous), entre le texte et sa plaque.
    front: true,
    size: 1.15,
    place: { textSide: true },
    // Plastique presque noir dans le fichier : éclairci pour se détacher du fond.
    tints: { BlackPlastic: "#3a3a42" },
    // Une partie de Tony Hawk’s Underground à l’écran (image choisie par Paul).
    decals: [{ piece: "Screen", image: "/models/decals/tv-screen.webp", glow: 1.35 }],
    sounds: ["tv-ps2", "tv-effect"],
  },
  // Couleurs franches du Power Cube (vert vif, éclair jaune), un peu réduit.
  {
    name: "powerCube",
    file: "power-cube.glb",
    build: starDrop,
    size: 0.72,
    tints: { green: "#1fd34a", yellow: "#ffd400" },
    sounds: ["brawlstars"],
  },
  { name: "cat", file: "cat.glb", build: cat, sounds: ["cat-1", "cat-2", "cat-3"] },
  // Au-dessus de sa plaque : visible pendant les trajets de la caméra.
  { name: "kitsuneMask", file: "kitsune-mask.glb" },
  { name: "banana", file: "banana.glb", size: 1.25, sounds: ["banana"] },
  { name: "earbuds", file: "earbuds.glb", size: 0.88, sounds: ["earbuds-1", "earbuds-2", "earbuds-3"] },
  {
    name: "skateboard",
    file: "skateboard.glb",
    build: skateboard,
    size: 1.7,
    // Le logo Deathwish dessous, sur fond rose (image choisie par Paul).
    decals: [{ piece: "skateboard", image: "/models/decals/deathwish-deck.webp", side: [0, -1, 0] }],
    sounds: ["skateboard-1", "skateboard-2"],
  },
  { name: "candy", file: "candy.glb", sounds: ["candy-1", "candy-2"] },
  { name: "jigglypuff", file: "jigglypuff.glb", sounds: ["jigglypuff-1", "jigglypuff-2"] },
  { name: "minecraftSword", file: "minecraft-sword.glb", pixelated: true, size: 1.2, sounds: ["minecraft-hurt"] },
  { name: "sodaCan", file: "soda-can.glb", sounds: ["can-open"] },
  { name: "potatOS", file: "potatos.glb", sounds: ["portal-1", "portal-2", "portal-3"] },
  { name: "shuriken", file: "shuriken.glb", sounds: ["shuriken-1", "shuriken-2"] },
  { name: "teddy", file: "teddy.glb", sounds: ["teddybear"] },
];
