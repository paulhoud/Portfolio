import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  PlaneGeometry,
  Points,
  SRGBColorSpace,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  type Texture,
} from "three";

/**
 * Les dimensions « clin d'œil » où l'on peut tomber après l'effondrement du
 * trou noir, à la place du treillis : une image fournie par Paul, animée par
 * three.js comme un masque posé dessus.
 *
 * - L'image couvre l'écran ; on y « atterrit » (léger zoom arrière), elle
 *   dérive lentement et suit un peu la souris. Sur un écran en hauteur, elle
 *   glisse d'un bord à l'autre pour montrer toute la scène.
 * - Un masque peint d'avance (ici, l'eau repérée à sa couleur) dit où l'image
 *   ondule, où passent les reflets de lumière et ce qui est « plus bas » que
 *   la terre ferme : le relief au mouvement de la souris vient de lui.
 * - Par-dessus : brume, rayons de lumière, et des particules (pétales de
 *   cerisier, lucioles, neige…) qui ne font pas partie de l'image.
 *
 * Tout est dessiné à plat sur l'écran, devant la salle vide ; l'image ne se
 * charge qu'au moment où l'on tombe dans cette dimension.
 */
export type ImageDimensionKind = "dofus" | "southpark";

type Recipe = {
  image: string;
  /** Masque de l'eau (blanc = eau), à la moitié de la taille de l'image. */
  water?: string;
  /** Point de l'image (0 à 1, origine en bas à gauche) gardé au centre. */
  focus: [number, number];
  /** Particules qui flottent devant l'image. */
  drift: "petals" | "snow";
  /** Lucioles dorées. */
  motes: boolean;
  /** Intensité de la brume et des rayons de lumière (0 à 1). */
  mist: number;
  rays: number;
};

const RECIPES: Record<ImageDimensionKind, Recipe> = {
  // Carte de Dofus (© Ankama) : marais doré, moulin, cerisiers en fleur.
  dofus: {
    image: "/dimensions/dofus.webp",
    water: "/dimensions/dofus-water.webp",
    focus: [0.47, 0.5],
    drift: "petals",
    motes: true,
    mist: 0.4,
    rays: 1,
  },
  // South Park (© Comedy Central) : les quatre enfants à l'arrêt de bus, sous la neige.
  southpark: {
    image: "/dimensions/south-park.webp",
    focus: [0.5, 0.5],
    drift: "snow",
    motes: false,
    mist: 0.25,
    rays: 0,
  },
};

export type ImageDimension = {
  kind: ImageDimensionKind;
  group: Group;
  /** L'image est chargée : la dimension peut s'afficher. */
  readonly ready: boolean;
  /** Le chargement a échoué : on reste dans le treillis. */
  readonly failed: boolean;
  /**
   * `presence` : 0 (absente) à 1 ; `time` : secondes ; `width`/`height` : taille
   * de l'écran en pixels CSS ; `pointer` : souris, de -1 à 1 sur chaque axe.
   */
  update(presence: number, time: number, width: number, height: number, pixelRatio: number, pointer: { x: number; y: number }): void;
  dispose(): void;
};

/** Bruit de valeur 2D, partagé par les shaders. */
const noise2 = /* glsl */ `
  float hash2(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash2(i);
    float b = hash2(i + vec2(1.0, 0.0));
    float c = hash2(i + vec2(0.0, 1.0));
    float d = hash2(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm2(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * noise2(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      amp *= 0.5;
    }
    return sum;
  }
`;

const screenVertex = /* glsl */ `
  varying vec2 vScreen;
  void main() {
    vScreen = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const sceneryFragment = /* glsl */ `
  uniform sampler2D uImage;
  uniform sampler2D uWater;
  uniform float uHasWater;
  uniform vec2 uView;
  uniform vec2 uImageSize;
  uniform vec2 uFocus;
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uPresence;
  uniform float uMist;
  uniform float uRays;
  varying vec2 vScreen;
  ${noise2}

  void main() {
    // L'image couvre l'écran (comme « object-fit: cover »), un peu agrandie
    // pour garder de la marge : on y atterrit, puis elle respire lentement.
    float viewAspect = uView.x / uView.y;
    float imageAspect = uImageSize.x / uImageSize.y;
    vec2 span = viewAspect > imageAspect ? vec2(1.0, imageAspect / viewAspect) : vec2(viewAspect / imageAspect, 1.0);
    float landing = 1.0 - uPresence;
    float zoom = 1.045 + 0.015 * sin(uTime * 0.09) + 0.3 * landing * landing;
    span /= zoom;
    // Écran en hauteur : l'image glisse d'un bord à l'autre, très lentement.
    float room = max(0.0, 0.5 - span.x * 0.5);
    vec2 center = uFocus + vec2(sin(uTime * 0.05) * room * 0.85, 0.0);
    center += vec2(sin(uTime * 0.07), cos(uTime * 0.06)) * 0.006;
    center = clamp(center, span * 0.5, 1.0 - span * 0.5);
    vec2 uv = center + (vScreen - 0.5) * span;

    // Relief : la terre ferme suit la souris un peu plus que l'eau, plus basse.
    float water = 0.0;
    if (uHasWater > 0.5) {
      float low = texture2D(uWater, uv, 3.0).r;
      uv -= uPointer * 0.006 * (1.0 - low);
      uv -= uPointer * 0.003;
      water = texture2D(uWater, uv).r;
    } else {
      uv -= uPointer * 0.006;
    }

    // L'eau ondule : deux champs de bruit qui glissent en sens contraires.
    vec2 q = uv * vec2(imageAspect, 1.0) * 16.0;
    vec2 ripple = vec2(
      noise2(q + vec2(uTime * 0.35, uTime * 0.22)),
      noise2(q * 1.7 - vec2(uTime * 0.27, -uTime * 0.31))
    ) - 0.5;
    vec3 color = texture2D(uImage, uv + ripple * 0.0032 * water).rgb;

    if (uHasWater > 0.5) {
      // Filets de lumière qui dansent au fond de l'eau.
      float c = noise2(q * 0.55 + uTime * vec2(0.11, 0.07)) + noise2(q * 1.1 - uTime * vec2(0.09, 0.13));
      float caustic = pow(1.0 - abs(c - 1.0), 12.0);
      color += vec3(0.9, 1.0, 0.94) * caustic * 0.08 * water;
      // Reflets du soleil : de petits éclats qui s'allument et s'éteignent.
      vec2 cell = floor(q * 2.2);
      vec2 local = fract(q * 2.2) - 0.5;
      float seed = hash2(cell);
      float life = sin(uTime * (1.2 + seed * 1.5) + seed * 40.0);
      float spark = smoothstep(0.12, 0.0, length(local * vec2(1.0, 2.2)) ) * step(0.93, seed) * max(0.0, life);
      color += spark * 0.55 * water;
    }

    // Rayons de lumière qui tombent du coin en haut à gauche.
    if (uRays > 0.0) {
      vec2 from = vScreen - vec2(-0.15, 1.15);
      float along = length(from);
      float angle = atan(from.y, from.x);
      float bands = noise2(vec2(angle * 9.0, uTime * 0.07)) * noise2(vec2(angle * 23.0 + 3.0, uTime * 0.05));
      float rays = smoothstep(0.12, 0.45, bands) * smoothstep(1.6, 0.2, along);
      color += vec3(1.0, 0.92, 0.7) * rays * 0.16 * uRays;
    }

    // Brume qui dérive, plus dense sur les bords et en bas.
    if (uMist > 0.0) {
      vec2 m = vScreen * vec2(viewAspect, 1.0) * 2.2;
      float fog = fbm2(m + vec2(uTime * 0.035, uTime * 0.012)) * 0.6 + fbm2(m * 1.8 - vec2(uTime * 0.05, 0.0)) * 0.4;
      float edge = smoothstep(0.2, 0.75, length((vScreen - 0.5) * vec2(1.1, 1.3)));
      float bottom = smoothstep(0.45, 0.0, vScreen.y);
      float density = smoothstep(0.35, 0.8, fog) * (0.35 + 0.65 * max(edge, bottom)) * uMist;
      color = mix(color, vec3(0.98, 0.97, 0.92), density * 0.55);
    }

    // Vignette douce, et l'image s'éclaircit en arrivant (on sort de l'éclair).
    float vignette = smoothstep(0.45, 1.0, length((vScreen - 0.5) * vec2(1.15, 1.0)) * 1.25);
    color *= 1.0 - vignette * 0.22;
    color = mix(color, vec3(1.0), landing * landing * 0.6);

    gl_FragColor = vec4(color, uPresence);
    #include <colorspace_fragment>
  }
`;

/**
 * Particules à plat sur l'écran : chacune a sa profondeur (petite et lente au
 * loin, grande, rapide et floue devant). `uStyle` : 0 pétales, 1 neige,
 * 2 lucioles.
 */
const driftVertex = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uPresence;
  uniform float uScale;
  uniform float uStyle;
  uniform vec2 uPointer;
  varying float vAlpha;
  varying float vSpin;
  varying float vDepth;
  varying float vTone;

  void main() {
    float depth = aSeed.z;
    vec2 p;
    if (uStyle < 1.5) {
      // Pétales et flocons : ils tombent en se balançant, poussés par le vent.
      float speed = mix(0.018, 0.075, depth) * (uStyle > 0.5 ? 1.0 : 0.85);
      float t = uTime * speed;
      float wind = uStyle > 0.5 ? 0.25 : 0.65;
      p = vec2(aSeed.x + t * wind + 0.035 * sin(uTime * (0.5 + aSeed.w) + aSeed.w * 6.28), aSeed.y - t);
    } else {
      // Lucioles : elles montent doucement en zigzag.
      float t = uTime * mix(0.006, 0.02, depth);
      p = vec2(aSeed.x + 0.03 * sin(uTime * 0.6 + aSeed.w * 9.0), aSeed.y + t + 0.02 * sin(uTime * 0.9 + aSeed.w * 4.0));
    }
    p = fract(p);
    p -= uPointer * mix(0.004, 0.03, depth);
    gl_Position = vec4(p * 2.2 - 1.1, 0.0, 1.0);

    float size = uStyle > 1.5 ? mix(6.0, 16.0, depth) : uStyle > 0.5 ? mix(3.0, 16.0, depth * depth) : mix(14.0, 46.0, depth);
    gl_PointSize = size * uScale;
    vSpin = uTime * mix(0.5, 1.7, aSeed.w) + aSeed.w * 6.28;
    float twinkle = uStyle > 1.5 ? 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (1.3 + aSeed.w * 2.0) + aSeed.w * 30.0), 2.0) : 1.0;
    vAlpha = uPresence * twinkle * mix(0.55, 1.0, depth);
    vDepth = depth;
    vTone = fract(aSeed.w * 7.31);
  }
`;

const driftFragment = /* glsl */ `
  uniform float uStyle;
  varying float vAlpha;
  varying float vSpin;
  varying float vDepth;
  varying float vTone;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    // Les plus proches sont floues, comme hors de la mise au point.
    float soft = mix(0.03, 0.16, smoothstep(0.75, 1.0, vDepth));
    float alpha;
    vec3 color;
    if (uStyle < 0.5) {
      // Pétale de cerisier qui tourne et se retourne dans l'air : pointu à la
      // base, large et arrondi au bout, avec la petite encoche des sakuras.
      float s = sin(vSpin), co = cos(vSpin);
      c = mat2(co, -s, s, co) * c;
      // Vu par la tranche, il s'amincit et s'assombrit un peu.
      float flip = max(0.3, abs(cos(vSpin * 0.63)));
      c.x /= flip;
      float y = c.y * 2.0;
      float halfWidth = 0.5 * sqrt(max(0.0, 1.0 - y * y)) * (0.75 + 0.35 * y);
      float notch = smoothstep(0.1, 0.0, abs(c.x)) * smoothstep(0.62, 0.92, y);
      alpha = smoothstep(0.0, 0.02 + soft, halfWidth - abs(c.x)) * (1.0 - notch);
      // Couleurs en sRVB, ramenées en linéaire pour la sortie à l'écran.
      vec3 base = mix(vec3(0.93, 0.56, 0.66), vec3(0.97, 0.69, 0.77), vTone);
      vec3 tip = vec3(1.0, 0.89, 0.92);
      color = mix(base, tip, smoothstep(-0.6, 0.6, y)) * (0.82 + 0.18 * flip);
      color = pow(color, vec3(2.2));
    } else if (uStyle < 1.5) {
      float d = length(c) * 2.0;
      alpha = 1.0 - smoothstep(1.0 - soft * 4.0 - 0.25, 1.0, d);
      color = vec3(1.0);
    } else {
      float d = length(c) * 2.0;
      alpha = exp(-d * d * 5.0);
      color = pow(mix(vec3(1.0, 0.84, 0.42), vec3(1.0, 0.95, 0.7), vTone), vec3(2.2));
    }
    alpha *= vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

/** Ordre de dessin : au-dessus de la salle et du treillis, sous l'éclair du trou noir. */
const ORDER = { scenery: 7, drift: 7.5, motes: 7.6 };

function makeDrift(count: number, style: number) {
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    seeds[i * 4] = Math.random();
    seeds[i * 4 + 1] = Math.random();
    // Plus de particules au loin qu'au premier plan.
    seeds[i * 4 + 2] = Math.random() ** 1.6;
    seeds[i * 4 + 3] = Math.random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aSeed", new Float32BufferAttribute(seeds, 4));
  const material = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uPresence: { value: 0 },
      uScale: { value: 1 },
      uStyle: { value: style },
      uPointer: { value: new Vector2() },
    },
    vertexShader: driftVertex,
    fragmentShader: driftFragment,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export function createImageDimension(kind: ImageDimensionKind, onLoad: () => void, light: boolean): ImageDimension {
  const recipe = RECIPES[kind];
  const group = new Group();
  group.visible = false;
  let ready = false;
  let failed = false;
  let disposed = false;
  const textures: Texture[] = [];

  const material = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uImage: { value: null },
      uWater: { value: null },
      uHasWater: { value: 0 },
      uView: { value: new Vector2(1, 1) },
      uImageSize: { value: new Vector2(16, 9) },
      uFocus: { value: new Vector2(...recipe.focus) },
      uPointer: { value: new Vector2() },
      uTime: { value: 0 },
      uPresence: { value: 0 },
      uMist: { value: recipe.mist },
      uRays: { value: recipe.rays },
    },
    vertexShader: screenVertex,
    fragmentShader: sceneryFragment,
  });
  const scenery = new Mesh(new PlaneGeometry(2, 2), material);
  scenery.frustumCulled = false;
  scenery.renderOrder = ORDER.scenery;
  group.add(scenery);

  const drift = makeDrift(recipe.drift === "petals" ? (light ? 34 : 56) : light ? 140 : 260, recipe.drift === "petals" ? 0 : 1);
  drift.renderOrder = ORDER.drift;
  group.add(drift);
  // Lucioles en couleur pleine : sur une image claire, une lueur s'y perdrait.
  const motes = recipe.motes ? makeDrift(light ? 26 : 45, 2) : null;
  if (motes) {
    motes.renderOrder = ORDER.motes;
    group.add(motes);
  }

  // Chargement : l'image d'abord, puis le masque (léger) s'il y en a un.
  const loader = new TextureLoader();
  const load = (url: string) =>
    new Promise<Texture>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  Promise.all([load(recipe.image), recipe.water ? load(recipe.water) : Promise.resolve(null)])
    .then(([image, water]) => {
      if (disposed) {
        image.dispose();
        water?.dispose();
        return;
      }
      image.colorSpace = SRGBColorSpace;
      image.minFilter = LinearFilter;
      image.generateMipmaps = false;
      const source = image.image as { width: number; height: number };
      material.uniforms.uImage.value = image;
      material.uniforms.uImageSize.value.set(source.width, source.height);
      textures.push(image);
      if (water) {
        // Mipmaps : une version floue du masque sert au relief.
        water.minFilter = LinearMipmapLinearFilter;
        material.uniforms.uWater.value = water;
        material.uniforms.uHasWater.value = 1;
        textures.push(water);
      }
      ready = true;
      onLoad();
    })
    .catch(() => {
      failed = true;
    });

  const sets = [drift.material, motes?.material].filter(Boolean) as ShaderMaterial[];

  return {
    kind,
    group,
    get ready() {
      return ready;
    },
    get failed() {
      return failed;
    },
    update(presence, time, width, height, pixelRatio, pointer) {
      group.visible = ready && presence > 0.001;
      if (!group.visible) return;
      const uniforms = material.uniforms;
      uniforms.uPresence.value = presence;
      uniforms.uTime.value = time;
      uniforms.uView.value.set(width, height);
      uniforms.uPointer.value.set(pointer.x, pointer.y);
      for (const set of sets) {
        set.uniforms.uTime.value = time;
        // Les particules arrivent un peu après l'image.
        set.uniforms.uPresence.value = Math.max(0, (presence - 0.3) / 0.7);
        set.uniforms.uScale.value = pixelRatio * Math.min(1.25, Math.max(0.7, height / 900));
        set.uniforms.uPointer.value.set(pointer.x, pointer.y);
      }
    },
    dispose() {
      disposed = true;
      scenery.geometry.dispose();
      material.dispose();
      drift.geometry.dispose();
      drift.material.dispose();
      motes?.geometry.dispose();
      motes?.material.dispose();
      for (const texture of textures) texture.dispose();
    },
  };
}
