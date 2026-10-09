import {
  AdditiveBlending,
  CustomBlending,
  Group,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  ShaderMaterial,
  type Camera,
} from "three";

/**
 * Trou noir de la fonction cachée « destroy the world », dans l'esprit de
 * Gargantua (Interstellar) : une ombre parfaitement noire, cerclée d'un fin
 * anneau de lumière ; un disque de matière blanche, presque vu par la
 * tranche, qui passe devant l'ombre et s'étire d'un bord à l'autre de
 * l'écran ; et l'arrière de ce disque, replié par la gravité, qui reparaît en
 * arc au-dessus de l'ombre (et, plus fin, en dessous). La matière est striée
 * comme du verre brossé, tourne plus vite près du centre, et brille davantage
 * du côté où elle vient vers nous.
 *
 * Tout est dessiné sur un seul panneau tourné vers la caméra (c'est l'image
 * qu'on voit de partout), juste après le sol et avant les objets : plaques et
 * volumes passent toujours devant lui. L'aspiration et la déformation des
 * objets sont calculées par la scène (cf. galleryRenderer).
 */
export type BlackHole = {
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
const ORDER = { hole: -2.2, flash: 10 };
/** Rayon de l'ombre pour `size` = 1, dans le repère du trou. */
const HORIZON = 0.7;
/** Demi-côté du panneau (repère du trou) : le disque y tient jusqu'à neuf rayons. */
const EXTENT = 9 * HORIZON * 1.3;

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

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }

  /*
   * Stries de la matière : très étirées le long de l'orbite (angle), fines en
   * travers (rayon). L'angle passe par cos/sin pour ne laisser aucune couture.
   */
  float streaks(float radius, float angle, float spin) {
    float a = angle + uTime * spin / pow(max(radius, 0.6), 1.5);
    vec3 q = vec3(cos(a) * 1.6, sin(a) * 1.6, radius * 9.0);
    float v = 0.0;
    float amp = 0.55;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(q);
      q = q * vec3(1.7, 1.7, 2.3) + 3.1;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    // Repère en rayons de l'ombre, légèrement penché comme sur l'image du film.
    vec2 p = vPlane / uRadius;
    float roll = -0.06;
    p = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * p;
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
    float squash = 0.075;
    vec2 d = vec2(p.x, p.y / squash);
    float rd = length(d);
    float phi = atan(d.y, d.x);
    float profile = smoothstep(1.45, 1.8, rd) * exp(-(rd - 1.8) / 2.0) * (1.0 - smoothstep(6.0, 9.0, rd));
    float diskGrain = streaks(rd, phi, 1.4);
    float disk = profile * mix(0.35, 1.4, diskGrain) * (1.0 - 0.5 * cos(phi));
    // Moitié avant (sous le centre) : devant l'ombre ; moitié arrière : cachée par elle.
    float shadow = 1.0 - smoothstep(0.985, 1.0, rho);
    float front = step(d.y, 0.0);
    // Devant l'ombre, seule la partie proche du centre reste vive (bande fine).
    float diskSeen = disk * mix(1.0 - shadow, mix(1.0, exp(-max(rd - 2.2, 0.0) / 1.2), shadow), front);

    // Halo très léger autour de l'ombre.
    float glow = exp(-max(rho - 1.0, 0.0) / 0.9) * 0.035;

    float energy = diskSeen + (1.0 - shadow) * (arcs + ring + glow);
    // Le plus chaud est blanc bleuté ; ce qui s'éloigne tire vers le pêche.
    vec3 hot = vec3(0.86, 0.91, 1.0);
    vec3 warm = vec3(0.86, 0.62, 0.48);
    vec3 tint = mix(warm, hot, smoothstep(0.05, 0.5, energy));
    // Les lueurs faibles sont écrasées : le fond reste noir, comme dans l'espace.
    vec3 color = (1.0 - exp(-tint * pow(energy, 1.35) * 1.4)) * uGlow;
    // Prémultiplié : l'ombre masque ce qu'il y a derrière, la lumière s'ajoute.
    gl_FragColor = vec4(color, shadow * min(1.0, uGlow * 1.5));
    #include <colorspace_fragment>
  }
`;

export function createBlackHole(): BlackHole {
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
    },
    vertexShader: holeVertex,
    fragmentShader: holeFragment,
  });
  const hole = new Mesh(new PlaneGeometry(EXTENT * 2, EXTENT * 2), holeMaterial);
  hole.renderOrder = ORDER.hole;
  group.add(hole);

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
    update(camera, size, glow, flash, time) {
      group.visible = size > 0.001 || glow > 0.001 || flash > 0.001;
      if (!group.visible) return;
      // Toujours de face : le disque garde la même inclinaison à l'écran.
      group.lookAt(camera.position);
      hole.visible = size > 0.001;
      holeMaterial.uniforms.uRadius.value = Math.max(0.001, HORIZON * size);
      holeMaterial.uniforms.uGlow.value = glow;
      holeMaterial.uniforms.uTime.value = time;
      flashPlane.scale.setScalar(Math.max(0.0001, 0.2 + flash));
      flashMaterial.uniforms.uOpacity.value = flash;
    },
    dispose() {
      hole.geometry.dispose();
      holeMaterial.dispose();
      flashPlane.geometry.dispose();
      flashMaterial.dispose();
    },
  };
}
