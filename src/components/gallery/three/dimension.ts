import {
  AdditiveBlending,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineSegments,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  type Camera,
  type Texture,
} from "three";

/**
 * L'« autre dimension » où l'on se retrouve après l'effondrement du trou
 * noir (fonction cachée « destroy the world ») : un treillis de lumière qui
 * s'étend à perte de vue, comme le tesseract d'Interstellar, dans lequel on
 * dérive lentement. Les tuiles des projets y flottent au loin, en souvenirs.
 *
 * Le treillis est accroché à la caméra et défile vers elle en boucle : il
 * n'a jamais de bord. Il se dessine par-dessus la salle (vide à ce moment-là).
 */
export type Dimension = {
  group: Group;
  /** `presence` : 0 (absente) à 1 (pleinement là) ; `time` : secondes. */
  update(camera: Camera, presence: number, time: number): void;
  dispose(): void;
};

/** Pas du treillis et étendue autour de la caméra. */
const CELL = 3;
const SPAN = 4;
const DEPTH = 20;
/** Vitesse de dérive vers l'avant (m/s). */
const DRIFT = 1.1;

export function createDimension(tiles: Texture[]): Dimension {
  const group = new Group();
  group.visible = false;
  const lattice = new Group();
  group.add(lattice);

  // Arêtes du treillis : lignes parallèles aux trois axes.
  const points: number[] = [];
  const near = CELL * 2;
  const far = -CELL * DEPTH;
  // Décalé d'une demi-maille : la caméra flotte au milieu d'une cellule, et
  // aucune arête ne lui passe devant l'œil.
  const at = (i: number) => (i + 0.5) * CELL;
  for (let i = -SPAN; i < SPAN; i += 1) {
    for (let j = -SPAN; j < SPAN; j += 1) {
      points.push(at(i), at(j), far, at(i), at(j), near);
    }
  }
  for (let k = -DEPTH; k <= 2; k += 1) {
    for (let i = -SPAN; i < SPAN; i += 1) {
      points.push(at(-SPAN), at(i), k * CELL, at(SPAN - 1), at(i), k * CELL);
      points.push(at(i), at(-SPAN), k * CELL, at(i), at(SPAN - 1), k * CELL);
    }
  }
  const latticeGeometry = new BufferGeometry();
  latticeGeometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  const latticeMaterial = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uPresence: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vView;
      varying vec3 vLocal;
      void main() {
        vLocal = position;
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vView = view.xyz;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vView;
      varying vec3 vLocal;
      uniform float uPresence;
      uniform float uTime;
      void main() {
        float dist = length(vView);
        // S'efface au loin, et tout près (pour ne pas zébrer l'écran).
        float fade = exp(-dist / 16.0) * smoothstep(2.0, 6.0, dist);
        // Des ondes de lumière courent le long des arêtes. Leur période en
        // profondeur est exactement une maille : quand le treillis reboucle
        // (il recule d'une maille), rien ne saute.
        float pulse = 0.55 + 0.45 * sin(vLocal.z * 2.0944 + vLocal.x * 0.6 - vLocal.y * 0.4 + uTime * 2.2);
        vec3 color = mix(vec3(0.95, 0.66, 0.34), vec3(1.0, 0.93, 0.8), pulse);
        float a = fade * (0.35 + 0.65 * pulse) * uPresence * 0.85;
        gl_FragColor = vec4(color * a, a);
        #include <colorspace_fragment>
      }
    `,
  });
  const latticeLines = new LineSegments(latticeGeometry, latticeMaterial);
  latticeLines.renderOrder = 5;
  lattice.add(latticeLines);

  // Une lueur dorée tout au fond, là où le treillis se perd.
  const depthGlowMaterial = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uPresence: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uPresence;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = pow(max(0.0, 1.0 - d), 3.0) * 0.22 * uPresence;
        gl_FragColor = vec4(vec3(1.0, 0.7, 0.38) * a, a);
        #include <colorspace_fragment>
      }
    `,
  });
  const depthGlow = new Mesh(new PlaneGeometry(90, 90), depthGlowMaterial);
  depthGlow.position.z = -55;
  depthGlow.renderOrder = 4;
  group.add(depthGlow);

  // Les projets, en tuiles qui dérivent entre les arêtes.
  const tileGeometry = new PlaneGeometry(1.3, 1.3);
  const ghosts = tiles.map((texture, index) => {
    const material = new ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      uniforms: { uMap: { value: texture }, uOpacity: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying float vDist;
        void main() {
          vUv = uv;
          vec4 view = modelViewMatrix * vec4(position, 1.0);
          vDist = length(view.xyz);
          gl_Position = projectionMatrix * view;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying float vDist;
        uniform sampler2D uMap;
        uniform float uOpacity;
        void main() {
          vec3 color = texture2D(uMap, vUv).rgb;
          float a = uOpacity * exp(-vDist / 18.0) * smoothstep(1.0, 4.0, vDist);
          gl_FragColor = vec4(color, a * 0.85);
          #include <colorspace_fragment>
        }
      `,
    });
    const mesh = new Mesh(tileGeometry, material);
    mesh.renderOrder = 6;
    // Placement pseudo-aléatoire mais stable, à l'écart de l'axe de vue.
    const angle = index * 2.399963;
    const radius = 2.2 + ((index * 37) % 11) * 0.45;
    return {
      mesh,
      material,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.7,
      z: -4 - ((index * 53) % 11) * 5,
      spin: 0.15 + ((index * 17) % 7) * 0.05,
    };
  });
  for (const ghost of ghosts) lattice.add(ghost.mesh);

  const loop = CELL * DEPTH;
  return {
    group,
    update(camera, presence, time) {
      group.visible = presence > 0.001;
      if (!group.visible) return;
      // Accroché à la caméra, avec un lent roulis qui désoriente.
      group.position.copy(camera.position);
      group.quaternion.copy(camera.quaternion);
      lattice.rotation.set(Math.sin(time * 0.13) * 0.12, Math.sin(time * 0.09) * 0.18, time * 0.04);
      const travel = time * DRIFT;
      latticeLines.position.z = travel % CELL;
      latticeMaterial.uniforms.uPresence.value = presence;
      depthGlowMaterial.uniforms.uPresence.value = presence;
      latticeMaterial.uniforms.uTime.value = time;
      for (const ghost of ghosts) {
        // Elles avancent avec le treillis et repartent au loin une fois dépassées.
        const z = ((((ghost.z + travel * 0.8) % loop) + loop) % loop) - loop + near;
        ghost.mesh.position.set(ghost.x, ghost.y, z);
        ghost.mesh.rotation.set(Math.sin(time * ghost.spin) * 0.4, time * ghost.spin, 0);
        ghost.material.uniforms.uOpacity.value = presence;
      }
    },
    dispose() {
      latticeGeometry.dispose();
      latticeMaterial.dispose();
      depthGlow.geometry.dispose();
      depthGlowMaterial.dispose();
      tileGeometry.dispose();
      for (const ghost of ghosts) ghost.material.dispose();
    },
  };
}
