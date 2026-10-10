import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  NearestFilter,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type InterleavedBufferAttribute,
  type Material,
  type Mesh,
  type SkinnedMesh,
  type Texture,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Objets 3D fournis par Paul (fichiers .glb dans public/models), allégés
 * avec glTF Transform (géométrie compressée « meshopt », textures WebP de
 * 512 px au plus) : de ~20 Mo à ~1 Mo pour les neuf.
 *
 * Chaque fichier devient une seule géométrie (ses pièces fusionnées, une par
 * matériau), centrée et ramenée dans un cube de côté 1 comme les objets
 * construits en code, avec la couleur et la texture de chaque pièce : la
 * scène les peint ensuite avec son propre éclairage de studio.
 */

/** Une pièce de l'objet : ce qu'il faut pour la peindre. */
export type ModelPart = {
  color: Color;
  map: Texture | null;
  doubleSided: boolean;
  /** Seuil de transparence (feuille de salade…), 0 si la pièce est opaque. */
  alphaCut: number;
  /** Verre : la pièce laisse voir à travers elle (1 ou absent : opaque). */
  opacity?: number;
};

/** Écran allumé : où poser le halo, dans le repère de l'objet (cube de côté 1). */
export type ModelGlow = {
  center: Vector3;
  normal: Vector3;
  size: number;
  /** La surface de l’écran, à peindre en blanc lumineux, hors éclairage. */
  surface: BufferGeometry;
};

export type LoadedModel = { geometry: BufferGeometry; parts: ModelPart[]; glow?: ModelGlow };

/**
 * Image posée sur une pièce, comme un autocollant : l'écran d'une télé, le
 * dessous d'une planche. Elle est projetée à plat, face à la pièce.
 */
export type ModelDecal = {
  /** Nom du matériau ou de la pièce qui la reçoit. */
  piece: string;
  /** Image de public/. */
  image: string;
  /**
   * Seulement les faces tournées vers ce côté (repère du fichier, y vers le
   * haut), sur la couche la plus étendue : le dessous du plateau, pas celui
   * des roues. Sans lui, toute la face avant de la pièce.
   */
  side?: [number, number, number];
  /** Luminosité de l'image (> 1 : un écran allumé). */
  glow?: number;
};

export type ModelOptions = {
  tints?: Record<string, string>;
  decals?: ModelDecal[];
  /** Textures en pixels apparents (Minecraft) : pas de lissage. */
  pixelated?: boolean;
  /** Rotation appliquée à l'objet (radians), pour tourner sa face vers nous. */
  turn?: [number, number, number];
  /**
   * Écran allumé : la pièce (nom du matériau ou de la pièce) devient un aplat
   * blanc lumineux, et un halo s'en échappe (cf. galleryRenderer).
   */
  screen?: { piece: string; glow?: number };
  /** Pièces en verre (nom du matériau ou de la pièce) : translucides, vues des deux côtés. */
  glass?: string[];
};

let textureLoader: TextureLoader | null = null;

let loader: GLTFLoader | null = null;

type AnyAttribute = BufferAttribute | InterleavedBufferAttribute;

/** Attribut en nombres flottants (les fichiers compressés les stockent en entiers). */
function toFloat(attribute: AnyAttribute, itemSize: number): Float32BufferAttribute {
  const values = new Float32Array(attribute.count * itemSize);
  const read = [attribute.getX, attribute.getY, attribute.getZ, attribute.getW];
  for (let i = 0; i < attribute.count; i += 1) {
    for (let c = 0; c < itemSize; c += 1) values[i * itemSize + c] = read[c].call(attribute, i);
  }
  return new Float32BufferAttribute(values, itemSize);
}

/** Géométrie d'un maillage, posée telle qu'elle apparaît dans le fichier. */
function bakeMesh(mesh: Mesh): BufferGeometry {
  const source = mesh.geometry;
  const geometry = new BufferGeometry();
  const position = source.attributes.position as AnyAttribute;
  if ((mesh as SkinnedMesh).isSkinnedMesh) {
    // Personnage articulé : on fige sa pose de repos.
    const skinned = mesh as SkinnedMesh;
    skinned.skeleton.update();
    const point = new Vector3();
    const values = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i += 1) {
      skinned.getVertexPosition(i, point);
      point.toArray(values, i * 3);
    }
    geometry.setAttribute("position", new Float32BufferAttribute(values, 3));
  } else {
    geometry.setAttribute("position", toFloat(position, 3));
  }
  const uv = source.attributes.uv as AnyAttribute | undefined;
  geometry.setAttribute("uv", uv ? toFloat(uv, 2) : new Float32BufferAttribute(new Float32Array(position.count * 2), 2));
  const color = source.attributes.color as AnyAttribute | undefined;
  geometry.setAttribute("color", color ? toFloat(color, 3) : new Float32BufferAttribute(new Float32Array(position.count * 3).fill(1), 3));
  if (source.index) geometry.setIndex(source.index.clone());
  const normal = source.attributes.normal as AnyAttribute | undefined;
  if (normal && !(mesh as SkinnedMesh).isSkinnedMesh) geometry.setAttribute("normal", toFloat(normal, 3));
  else geometry.computeVertexNormals();
  geometry.applyMatrix4(mesh.matrixWorld);
  return geometry.index ? geometry.toNonIndexed() : geometry;
}

function partOf(material: Material, tints: Record<string, string>, pieceName: string, pixelated = false, glass: string[] = []): ModelPart {
  const painted = material as Material & { color?: Color; map?: Texture | null; alphaTest?: number };
  // Le verre du fichier est presque invisible (quart d'opacité) : un peu
  // plus présent ici, pour qu'on le devine sur le fond sombre.
  if (glass.includes(material.name) || glass.includes(pieceName)) {
    return { color: painted.color?.clone() ?? new Color(1, 1, 1), map: null, doubleSided: true, alphaCut: 0, opacity: Math.max(0.3, material.opacity) };
  }
  // Par matériau, ou par pièce quand une seule matière habille tout l'objet.
  const tint = tints[material.name] ?? tints[pieceName];
  if (pixelated && painted.map) painted.map.magFilter = NearestFilter;
  return {
    color: tint ? new Color(tint) : painted.color ? painted.color.clone() : new Color(1, 1, 1),
    map: painted.map ?? null,
    doubleSided: material.side === DoubleSide,
    alphaCut: material.transparent || (painted.alphaTest ?? 0) > 0 ? 0.5 : 0,
  };
}

/**
 * Découpe dans une pièce les faces qui recevront l'image et leur donne des
 * coordonnées de texture projetées à plat : le haut de l'image suit le grand
 * côté de la zone pour une image en hauteur (planche), le petit sinon (écran).
 */
function cutDecal(geometry: BufferGeometry, decal: ModelDecal, portrait: boolean): { decal: BufferGeometry; rest: BufferGeometry } | null {
  const position = geometry.attributes.position as BufferAttribute;
  const count = position.count / 3;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const faces: { normal: Vector3; center: Vector3; area: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    a.fromBufferAttribute(position, i * 3);
    b.fromBufferAttribute(position, i * 3 + 1);
    c.fromBufferAttribute(position, i * 3 + 2);
    const normal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a));
    const area = normal.length() / 2;
    faces.push({ normal: area > 0 ? normal.normalize() : normal, center: a.clone().add(b).add(c).divideScalar(3), area });
  }
  geometry.computeBoundingBox();
  const extent = geometry.boundingBox!.getSize(new Vector3());
  const reach = Math.max(extent.x, extent.y, extent.z);

  // Côté visé : celui demandé, ou celui vers lequel la pièce regarde en moyenne.
  const facing = decal.side ? new Vector3(...decal.side) : new Vector3();
  if (!decal.side) for (const face of faces) facing.addScaledVector(face.normal, face.area);
  facing.normalize();
  const keep = faces.map((face) => face.area > 0 && face.normal.dot(facing) > (decal.side ? 0.5 : 0.2));
  if (decal.side) {
    // La couche la plus étendue de ce côté (le plateau) et ce qui la dépasse
    // vers l'extérieur (les bouts relevés) ; pas ce qui est en retrait (roues).
    const step = reach * 0.002;
    const bins = new Map<number, number>();
    faces.forEach((face, i) => {
      if (!keep[i]) return;
      const bin = Math.round(face.center.dot(facing) / step);
      bins.set(bin, (bins.get(bin) ?? 0) + face.area);
    });
    let mode = 0;
    let best = -1;
    for (const [bin, area] of bins) if (area > best) [mode, best] = [bin, area];
    // (Plus loin dans le sens visé = en retrait : roues, axes.)
    const limit = mode * step + reach * 0.015;
    faces.forEach((face, i) => {
      if (keep[i] && face.center.dot(facing) > limit) keep[i] = false;
    });
  }
  if (!keep.some(Boolean)) return null;

  // Repère de l'image : l'axe principal du côté visé, et deux axes dans le plan.
  const axes = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
  const weights = [Math.abs(facing.x), Math.abs(facing.y), Math.abs(facing.z)];
  const main = weights.indexOf(Math.max(...weights));
  const normal = axes[main].clone().multiplyScalar(Math.sign(facing.getComponent(main)) || 1);
  const span = (axis: Vector3) => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < position.count; i += 1) {
      if (!keep[Math.floor(i / 3)]) continue;
      const value = a.fromBufferAttribute(position, i).dot(axis);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    return { min, max, size: Math.max(max - min, 1e-6) };
  };
  const [first, second] = axes.filter((_, index) => index !== main);
  const long = span(first).size >= span(second).size ? first : second;
  const up = portrait ? long : long === first ? second : first;
  const right = new Vector3().crossVectors(up, normal);
  const across = span(right);
  const along = span(up);

  const split = (wanted: boolean) => {
    const piece = new BufferGeometry();
    for (const name of ["position", "normal", "uv", "color"]) {
      const attribute = geometry.attributes[name] as BufferAttribute;
      const size = attribute.itemSize;
      const values: number[] = [];
      for (let i = 0; i < attribute.count; i += 1) {
        if (keep[Math.floor(i / 3)] !== wanted) continue;
        if (wanted && name === "uv") {
          a.fromBufferAttribute(position, i);
          values.push((a.dot(right) - across.min) / across.size, (along.max - a.dot(up)) / along.size);
        } else if (wanted && name === "color") values.push(1, 1, 1);
        else for (let k = 0; k < size; k += 1) values.push(attribute.array[i * size + k]);
      }
      piece.setAttribute(name, new Float32BufferAttribute(values, size));
    }
    return piece;
  };
  return { decal: split(true), rest: split(false) };
}

/**
 * Charge un objet de public/models et le prépare pour la scène : `tints`
 * repeint certaines pièces (nom du matériau ou de la pièce → couleur),
 * texture conservée ; `decals` y pose des images (cf. ModelDecal).
 */
export async function loadIdentityModel(file: string, options: ModelOptions = {}): Promise<LoadedModel> {
  const { tints = {}, decals = [], pixelated = false, turn, screen, glass = [] } = options;
  if (!loader) {
    loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
  const images = textureLoader ?? (textureLoader = new TextureLoader());
  const decalMaps = await Promise.all(
    decals.map(async (decal) => {
      const map = await images.loadAsync(decal.image);
      map.colorSpace = SRGBColorSpace;
      map.flipY = false;
      return map;
    }),
  );
  const gltf = await loader.loadAsync(`/models/${file}`);
  gltf.scene.updateMatrixWorld(true);
  const geometries: BufferGeometry[] = [];
  const parts: ModelPart[] = [];
  /** Matériau et pièce de chaque géométrie, pour y poser les images. */
  const names: string[][] = [];
  gltf.scene.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const baked = bakeMesh(mesh);
    // Un maillage à plusieurs matériaux est découpé pièce par pièce.
    if (materials.length > 1 && baked.groups.length > 0) {
      for (const group of baked.groups) {
        const piece = new BufferGeometry();
        for (const name of ["position", "normal", "uv", "color"]) {
          const attribute = baked.attributes[name] as BufferAttribute;
          const size = attribute.itemSize;
          piece.setAttribute(name, new Float32BufferAttribute(attribute.array.slice(group.start * size, (group.start + group.count) * size), size));
        }
        geometries.push(piece);
        parts.push(partOf(materials[group.materialIndex ?? 0], tints, mesh.name, pixelated, glass));
        names.push([materials[group.materialIndex ?? 0].name, mesh.name]);
      }
      baked.dispose();
    } else {
      geometries.push(baked);
      parts.push(partOf(materials[0], tints, mesh.name, pixelated, glass));
      names.push([materials[0].name, mesh.name]);
    }
  });
  decals.forEach((decal, index) => {
    const map = decalMaps[index];
    const image = map.image as { width: number; height: number };
    const portrait = image.height > image.width;
    for (let i = geometries.length - 1; i >= 0; i -= 1) {
      if (!names[i].includes(decal.piece)) continue;
      const cut = cutDecal(geometries[i], decal, portrait);
      if (!cut) continue;
      geometries[i].dispose();
      geometries[i] = cut.rest;
      geometries.push(cut.decal);
      const glow = decal.glow ?? 1;
      parts.push({ color: new Color(glow, glow, glow), map, doubleSided: false, alphaCut: 0 });
      names.push([]);
    }
  });
  // Écran allumé : blanc uni, plus lumineux que l'éclairage de la scène.
  const screenPart = screen ? names.findIndex((pair) => pair.includes(screen.piece)) : -1;
  if (screenPart >= 0) {
    const glow = screen!.glow ?? 1.8;
    parts[screenPart] = { ...parts[screenPart], color: new Color(glow, glow, glow), map: null, doubleSided: true };
    // Ses couleurs par sommet (un dégradé sombre) teinteraient le blanc.
    (geometries[screenPart].attributes.color as BufferAttribute).array.fill(1);
    // La vitre teintée posée devant (zones semi-transparentes du boîtier)
    // laisserait l’écran gris : on ne garde que ses parties opaques.
    parts.forEach((part, index) => {
      if (index !== screenPart && part.alphaCut > 0) part.alphaCut = 0.92;
    });
  }
  const merged = mergeGeometries(geometries, true);
  for (const geometry of geometries) geometry.dispose();
  if (!merged) throw new Error(`identité : ${file} illisible`);
  if (turn) merged.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(...turn)));
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
  const glow = screenPart >= 0 ? glowOf(merged, screenPart) : undefined;
  if (glow) {
    // L’écran est dans le plan même de la façade : avancé d’un cheveu, il
    // passe devant elle au lieu de clignoter avec elle.
    const group = merged.groups[screenPart];
    const position = merged.attributes.position as BufferAttribute;
    for (let i = group.start; i < group.start + group.count; i += 1) {
      position.setXYZ(i, position.getX(i) + glow.normal.x * 0.004, position.getY(i) + glow.normal.y * 0.004, position.getZ(i) + glow.normal.z * 0.004);
    }
    glow.center.addScaledVector(glow.normal, 0.004);
    // Sa surface, un rien plus en avant, devient une plaque lumineuse.
    const surface = new BufferGeometry();
    const points = new Float32Array(group.count * 3);
    for (let i = 0; i < group.count; i += 1) {
      points[i * 3] = position.getX(group.start + i) + glow.normal.x * 0.002;
      points[i * 3 + 1] = position.getY(group.start + i) + glow.normal.y * 0.002;
      points[i * 3 + 2] = position.getZ(group.start + i) + glow.normal.z * 0.002;
    }
    surface.setAttribute("position", new Float32BufferAttribute(points, 3));
    glow.surface = surface;
  }
  return { geometry: merged, parts, glow };
}

/** Centre, orientation et taille de l'écran, une fois l'objet mis à l'échelle. */
function glowOf(geometry: BufferGeometry, part: number): ModelGlow | undefined {
  const group = geometry.groups[part];
  if (!group) return undefined;
  const position = geometry.attributes.position as BufferAttribute;
  const normal = geometry.attributes.normal as BufferAttribute;
  const center = new Vector3();
  const facing = new Vector3();
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  const point = new Vector3();
  for (let i = group.start; i < group.start + group.count; i += 1) {
    point.fromBufferAttribute(position, i);
    center.add(point);
    min.min(point);
    max.max(point);
    facing.add(point.fromBufferAttribute(normal, i));
  }
  center.divideScalar(Math.max(1, group.count));
  const size = max.sub(min);
  return { center, normal: facing.normalize(), size: Math.max(size.x, size.y, size.z), surface: new BufferGeometry() };
}
