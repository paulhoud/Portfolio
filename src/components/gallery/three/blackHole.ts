import {
  AdditiveBlending,
  BufferGeometry,
  CustomBlending,
  Euler,
  Float32BufferAttribute,
  Group,
  Matrix3,
  Matrix4,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  type Camera,
} from "three";

/**
 * Trou noir de la fonction cachée « destroy the world », dans l'esprit de
 * Gargantua (Interstellar) : une ombre parfaitement noire, cerclée d'un fin
 * anneau de lumière ; un disque de matière blanche, presque vu par la
 * tranche, qui passe devant l'ombre et déborde de chaque côté sur environ
 * trois fois sa largeur ; et l'arrière de ce disque, replié par la gravité,
 * qui reparaît en arc au-dessus de l'ombre (et, plus fin, en dessous). La matière est striée
 * comme du verre brossé, tourne plus vite près du centre, et brille davantage
 * du côté où elle vient vers nous.
 *
 * Tout est dessiné sur un seul panneau tourné vers la caméra (c'est l'image
 * qu'on voit de partout), juste après le sol et avant les objets : plaques et
 * volumes passent toujours devant lui. Le disque oscille lentement (son
 * inclinaison et son roulis varient), comme s'il précessait.
 *
 * Autour, de vraies particules en 3D : une poussière qui tourne dans le plan
 * du disque et s'enroule jusqu'à l'ombre, et deux anneaux de lumière inclinés
 * qui tournent lentement, chacun sur son axe. L'aspiration et la déformation des
 * objets sont calculées par la scène (cf. galleryRenderer).
 */
export type BlackHole = {
  /** Hauteur de l'écran en pixels réels (taille des particules). */
  setResolution(height: number): void;
  /** À placer (position, échelle) par la scène avant `update`. */
  group: Group;
  /**
   * `size` : taille de l'ombre (0 à 1,3) ; `glow` : éclat de la matière ;
   * `flash` : éclair final (0 à 1) ; `time` : secondes.
   */
  update(camera: Camera, size: number, glow: number, flash: number, time: number): void;
  dispose(): void;
};

/** Ordre de dessin : sol (-3), puis le trou noir, puis les objets (0). */
const ORDER = { hole: -2.2, particles: -2.15, flash: 10 };
/** Rayon de l'ombre pour `size` = 1, dans le repère du trou. */
export const HORIZON = 0.58;
/** Demi-côté du panneau (repère du trou) : le disque y tient jusqu'à six rayons. */
const EXTENT = 6 * HORIZON * 1.3;

const holeVertex = /* glsl */ `
  varying vec2 vPlane;
  void main() {
    vPlane = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holeFragment = /* glsl */ `
  varying vec2 vPlane;
  uniform float uRadius;
  uniform float uGlow;
  uniform float uTime;
  uniform float uRoll;
  uniform float uSquash;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }

  /*
   * Stries de la matière : très étirées le long de l'orbite (angle), fines et
   * nettes en travers (rayon). L'angle passe par cos/sin pour ne laisser
   * aucune couture.
   */
  float streaks(float radius, float angle, float spin) {
    float a = angle + uTime * spin / pow(max(radius, 0.6), 1.5);
    vec3 q = vec3(cos(a) * 1.8, sin(a) * 1.8, radius * 15.0);
    float v = 0.0;
    float amp = 0.5;
    float total = 0.0;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(q);
      total += amp;
      q = q * vec3(1.6, 1.6, 2.1) + 3.1;
      amp *= 0.7;
    }
    // Contraste : des filets nets plutôt qu'un voile.
    return smoothstep(0.25, 0.8, v / total);
  }

  void main() {
    // Repère en rayons de l'ombre, légèrement penché comme sur l'image du film.
    vec2 p = vPlane / uRadius;
    p = mat2(cos(uRoll), -sin(uRoll), sin(uRoll), cos(uRoll)) * p;
    float rho = length(p);
    float theta = atan(p.y, p.x);
    // La matière qui vient vers nous (à gauche) brille davantage.
    float doppler = 1.0 - 0.55 * cos(theta);

    // Arrière du disque replié par la gravité : un large arc au-dessus de
    // l'ombre, un plus fin en dessous, qui rejoignent le disque sur les côtés.
    float up = smoothstep(-0.15, 0.5, sin(theta));
    float down = smoothstep(0.05, -0.5, sin(theta));
    float arcUp = smoothstep(1.0, 1.06, rho) * exp(-(rho - 1.06) / 0.24);
    float arcDown = smoothstep(1.0, 1.03, rho) * exp(-(rho - 1.03) / 0.12);
    float arcGrain = streaks(rho * 1.3, theta, 0.9);
    float arcs = (up * arcUp + down * arcDown * 0.7) * mix(0.4, 1.3, arcGrain) * doppler * 0.9;

    // Anneau de photons, au ras de l'ombre.
    float ring = exp(-pow((rho - 1.015) / 0.012, 2.0));

    // Disque presque vu par la tranche : une ellipse très aplatie.
    vec2 d = vec2(p.x, p.y / uSquash);
    float rd = length(d);
    float phi = atan(d.y, d.x);
    float profile = smoothstep(1.45, 1.8, rd) * exp(-(rd - 1.8) / 1.0) * (1.0 - smoothstep(2.8, 4.3, rd));
    float diskGrain = streaks(rd, phi, 1.4);
    float disk = profile * mix(0.35, 1.4, diskGrain) * (1.0 - 0.5 * cos(phi));
    // Moitié avant (sous le centre) : devant l'ombre ; moitié arrière : cachée par elle.
    float shadow = 1.0 - smoothstep(0.985, 1.0, rho);
    float front = step(d.y, 0.0);
    // Devant l'ombre, seule la partie proche du centre reste vive (bande fine).
    float diskSeen = disk * mix(1.0 - shadow, mix(1.0, exp(-max(rd - 2.2, 0.0) / 0.9), shadow), front);

    // Halo très léger autour de l'ombre.
    float glow = exp(-max(rho - 1.0, 0.0) / 0.9) * 0.035;

    float energy = diskSeen + (1.0 - shadow) * (arcs + ring + glow);
    // Blanc pur ; les lueurs faibles sont écrasées : le fond reste noir.
    vec3 color = vec3(1.0 - exp(-pow(energy, 1.35) * 1.5)) * uGlow;
    // Prémultiplié : l'ombre masque ce qu'il y a derrière, la lumière s'ajoute.
    gl_FragColor = vec4(color, shadow * min(1.0, uGlow * 1.5));
    #include <colorspace_fragment>
  }
`;

/**
 * Particules : chacune a une orbite (rayon de départ en rayons d'ombre, phase,
 * vitesse, plan : 0 le disque, 1 et 2 les anneaux). Tout le mouvement est
 * calculé sur la carte graphique à partir du temps.
 */
const particleVertex = /* glsl */ `
  attribute vec4 aOrbit;
  attribute float aSeed;
  uniform float uTime;
  uniform float uRadius;
  uniform float uOpacity;
  uniform float uViewport;
  uniform mat3 uDisk;
  uniform mat3 uRing1;
  uniform mat3 uRing2;
  varying float vAlpha;
  void main() {
    float plane = aOrbit.w;
    bool disk = plane < 0.5;
    // La poussière du disque s'enroule vers l'ombre, de plus en plus vite,
    // puis renaît au bord ; celle des anneaux garde son rayon.
    float life = fract(aSeed * 13.7 + uTime * (disk ? 0.11 : 0.03) * aOrbit.z);
    float r = disk ? mix(aOrbit.x, 1.06, life * life) : aOrbit.x;
    float angle = aOrbit.y + uTime * aOrbit.z * 1.3 / pow(r, 1.5);
    float thickness = (fract(aSeed * 91.3) - 0.5) * (disk ? 0.06 : 0.025) * r;
    vec3 local = vec3(cos(angle) * r, thickness, sin(angle) * r);
    mat3 orientation = disk ? uDisk : plane < 1.5 ? uRing1 : uRing2;
    vec3 p = orientation * local * uRadius;
    // Le trou fait face à la caméra (z vers elle) : derrière l'ombre, caché.
    float hidden = (p.z < 0.0 && length(p.xy) < uRadius * 1.02) ? 0.0 : 1.0;
    float fade = disk ? smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.85, 1.0, life)) : 1.0;
    // Plus vive près de l'ombre, et du côté qui vient vers nous (à gauche).
    float heat = mix(0.3, 1.0, smoothstep(4.5, 1.2, r)) * (0.75 - 0.25 * cos(angle));
    vAlpha = hidden * fade * heat * uOpacity * (0.35 + 0.65 * fract(aSeed * 47.1));
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    float size = uRadius * (0.012 + 0.022 * fract(aSeed * 5.3));
    gl_PointSize = max(1.0, size * projectionMatrix[1][1] * uViewport * 0.5 / -view.z);
  }
`;

const particleFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha;
    gl_FragColor = vec4(vec3(a), 1.0);
    #include <colorspace_fragment>
  }
`;

/** Orientation d'un anneau ou du disque, en matrice 3 × 3. */
const planeMatrix = (target: Matrix3, scratch: Matrix4, euler: Euler) =>
  target.setFromMatrix4(scratch.makeRotationFromEuler(euler));

export function createBlackHole(particleCount = 2400): BlackHole {
  const group = new Group();
  group.visible = false;

  const holeMaterial = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    uniforms: {
      uRadius: { value: 0.001 },
      uGlow: { value: 0 },
      uTime: { value: 0 },
      uRoll: { value: -0.06 },
      uSquash: { value: 0.075 },
    },
    vertexShader: holeVertex,
    fragmentShader: holeFragment,
  });
  const hole = new Mesh(new PlaneGeometry(EXTENT * 2, EXTENT * 2), holeMaterial);
  hole.renderOrder = ORDER.hole;
  group.add(hole);

  // Poussière du disque (70 %) et deux anneaux inclinés (15 % chacun).
  const orbits = new Float32Array(particleCount * 4);
  const seeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i += 1) {
    const share = i / particleCount;
    const plane = share < 0.7 ? 0 : share < 0.85 ? 1 : 2;
    const radius =
      plane === 0 ? 1.3 + 4.2 * Math.random() ** 0.8 : plane === 1 ? 1.75 + 0.12 * Math.random() : 2.55 + 0.15 * Math.random();
    orbits.set([radius, Math.random() * Math.PI * 2, 0.6 + 0.8 * Math.random(), plane], i * 4);
    seeds[i] = Math.random();
  }
  const particleGeometry = new BufferGeometry();
  // La position est calculée dans le shader ; celle-ci ne sert qu'au découpage.
  particleGeometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(particleCount * 3), 3));
  particleGeometry.setAttribute("aOrbit", new Float32BufferAttribute(orbits, 4));
  particleGeometry.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
  const particleMaterial = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    uniforms: {
      uTime: { value: 0 },
      uRadius: { value: 0.001 },
      uOpacity: { value: 0 },
      uViewport: { value: 900 },
      uDisk: { value: new Matrix3() },
      uRing1: { value: new Matrix3() },
      uRing2: { value: new Matrix3() },
    },
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
  });
  const particles = new Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  particles.renderOrder = ORDER.particles;
  group.add(particles);
  const scratch = new Matrix4();
  const euler = new Euler();

  // Éclair : par-dessus tout.
  const flashMaterial = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uOpacity;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = pow(max(0.0, 1.0 - d), 2.2) * uOpacity;
        gl_FragColor = vec4(vec3(a), a);
        #include <colorspace_fragment>
      }
    `,
  });
  const flashPlane = new Mesh(new PlaneGeometry(40, 40), flashMaterial);
  flashPlane.renderOrder = ORDER.flash;
  group.add(flashPlane);

  return {
    group,
    setResolution(height) {
      particleMaterial.uniforms.uViewport.value = height;
    },
    update(camera, size, glow, flash, time) {
      group.visible = size > 0.001 || glow > 0.001 || flash > 0.001;
      if (!group.visible) return;
      // Toujours de face : le disque garde la même inclinaison à l'écran.
      group.lookAt(camera.position);
      hole.visible = size > 0.001;
      holeMaterial.uniforms.uRadius.value = Math.max(0.001, HORIZON * size);
      holeMaterial.uniforms.uGlow.value = glow;
      holeMaterial.uniforms.uTime.value = time;
      // Le disque oscille lentement : inclinaison et roulis varient.
      const squash = 0.075 + 0.03 * Math.sin(time * 0.37);
      const roll = -0.06 + 0.08 * Math.sin(time * 0.23 + 1);
      holeMaterial.uniforms.uSquash.value = squash;
      holeMaterial.uniforms.uRoll.value = roll;
      // Les particules suivent le même disque ; les anneaux tournent sur leurs axes.
      const uniforms = particleMaterial.uniforms;
      particles.visible = size > 0.001 && glow > 0.001;
      uniforms.uTime.value = time;
      uniforms.uRadius.value = Math.max(0.001, HORIZON * size);
      uniforms.uOpacity.value = glow;
      planeMatrix(uniforms.uDisk.value, scratch, euler.set(Math.asin(squash), 0, roll, "ZYX"));
      planeMatrix(uniforms.uRing1.value, scratch, euler.set(1.15 + 0.15 * Math.sin(time * 0.31), 0.4 + time * 0.12, 0.35, "XYZ"));
      planeMatrix(uniforms.uRing2.value, scratch, euler.set(-0.95, -0.6 - time * 0.09, -0.5 + 0.2 * Math.cos(time * 0.25), "YXZ"));
      flashPlane.scale.setScalar(Math.max(0.0001, 0.2 + flash));
      flashMaterial.uniforms.uOpacity.value = flash;
    },
    dispose() {
      hole.geometry.dispose();
      holeMaterial.dispose();
      flashPlane.geometry.dispose();
      flashMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    },
  };
}
