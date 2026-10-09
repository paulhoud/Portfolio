import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
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
};

export type LoadedModel = { geometry: BufferGeometry; parts: ModelPart[] };

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

function partOf(material: Material, tints: Record<string, string>, pieceName: string): ModelPart {
  const painted = material as Material & { color?: Color; map?: Texture | null; alphaTest?: number };
  // Par matériau, ou par pièce quand une seule matière habille tout l'objet.
  const tint = tints[material.name] ?? tints[pieceName];
  return {
    color: tint ? new Color(tint) : painted.color ? painted.color.clone() : new Color(1, 1, 1),
    map: painted.map ?? null,
    doubleSided: material.side === DoubleSide,
    alphaCut: material.transparent || (painted.alphaTest ?? 0) > 0 ? 0.5 : 0,
  };
}

/**
 * Charge un objet de public/models et le prépare pour la scène ; `tints`
 * repeint certaines pièces (nom du matériau ou de la pièce → couleur),
 * texture conservée.
 */
export async function loadIdentityModel(file: string, tints: Record<string, string> = {}): Promise<LoadedModel> {
  if (!loader) {
    loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
  const gltf = await loader.loadAsync(`/models/${file}`);
  gltf.scene.updateMatrixWorld(true);
  const geometries: BufferGeometry[] = [];
  const parts: ModelPart[] = [];
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
        parts.push(partOf(materials[group.materialIndex ?? 0], tints, mesh.name));
      }
      baked.dispose();
    } else {
      geometries.push(baked);
      parts.push(partOf(materials[0], tints, mesh.name));
    }
  });
  const merged = mergeGeometries(geometries, true);
  for (const geometry of geometries) geometry.dispose();
  if (!merged) throw new Error(`identité : ${file} illisible`);
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
  return { geometry: merged, parts };
}
