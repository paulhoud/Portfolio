import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Path,
  Shape,
  ShapeGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/**
 * Logo PH en 3D, joué au survol (three.js).
 *
 * Au repos, rien n'est dessiné : c'est le logo SVG habituel qui s'affiche. Au
 * survol, le logo prend le dégradé orange du survol et se dédouble en
 * contours empilés en profondeur ; le tout pivote vers la souris pendant que
 * de la lumière court le long des lignes. À la sortie, les lignes se
 * replient dans le logo et le SVG reprend la main.
 */

/** Tracé du logo (public/assets/Logo-0-1.svg), dans son cadre de 61 × 70. */
const LOGO_PATH =
  "M0 67.5491H4.42604V51.1666H16.4396C31.5569 51.1666 42.2994 43.6843 44.2557 30.6038H56.5739V67.5491H61V2H56.5739V26.3284H44.5761L44.5766 26.1557C44.5766 10.8714 33.1953 2 16.4396 2H0V67.5491ZM4.42604 46.7843H16.6504C17.853 46.7843 19.0183 46.7324 20.1442 46.6297V6.53027C19.0175 6.43183 17.8521 6.38224 16.6504 6.38224H4.42604V46.7843ZM24.5703 30.6038V45.9181C32.9017 43.939 38.3685 38.6281 39.7851 30.6038H24.5703ZM24.5703 26.3284H40.1505L40.1505 26.2626C40.1505 15.992 34.2717 9.42237 24.5703 7.2122V26.3284Z";
export const LOGO_WIDTH = 61;
export const LOGO_HEIGHT = 70;

/** Contours empilés derrière le logo. */
const LAYERS = 4;
/** Couleurs du dégradé de survol (cf. LogoMark), de l'avant vers le fond. */
// Rayon du dégradé CSS « circle at 35% 68% » : jusqu'au coin le plus éloigné.
const GRADIENT_RADIUS = Math.hypot(0.65 * 61, 0.68 * 70);
const GRADIENT = ["#FF9A00", "#FF4D00", "#E20E0E", "#C40000"];

export type LogoScene = {
  /** Survol (ou focus clavier) : déploie ou replie les lignes. */
  setActive(active: boolean): void;
  /** Position de la souris par rapport au logo, de -1 à 1. */
  setPointer(x: number, y: number): void;
  dispose(): void;
};

const damp = (current: number, target: number, lambda: number, dt: number) =>
  target + (current - target) * Math.exp(-lambda * dt);
const easeOutBack = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

function gradientAt(t: number): Color {
  const scaled = Math.min(0.999, Math.max(0, t)) * (GRADIENT.length - 1);
  const index = Math.floor(scaled);
  return new Color(GRADIENT[index]).lerp(new Color(GRADIENT[index + 1]), scaled - index);
}

/** Contours du logo (extérieur et évidements), en points centrés, Y vers le haut. */
function logoShapes(): { shapes: Shape[]; loops: Vector2[][] } {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${LOGO_PATH}"/></svg>`;
  const [outline, ...holes] = new SVGLoader().parse(svg).paths[0].subPaths;
  // Le premier tracé est le contour du logo, les trois suivants ses évidements.
  const loops = [outline, ...holes].map((path) => path.getPoints(24));
  const shape = new Shape(loops[0]);
  shape.holes = loops.slice(1).map((points) => new Path(points));
  return { shapes: [shape], loops };
}

/**
 * Crée la scène sur le canevas. Il déborde du logo de `pad` unités de tous
 * côtés (en unités du dessin, 61 × 70), pour laisser la place au mouvement.
 * `onRest` est appelé quand l'animation est entièrement repliée.
 */
export function createLogoScene(
  canvas: HTMLCanvasElement,
  pad: number,
  onRest: () => void,
): LogoScene | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "default" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const fov = 26;
  const viewHeight = LOGO_HEIGHT + pad * 2;
  const camera = new PerspectiveCamera(fov, (LOGO_WIDTH + pad * 2) / viewHeight, 1, 1000);
  // À la profondeur du logo, le cadre du canevas couvre exactement le logo et
  // sa marge : au repos, la scène se superpose pile au SVG.
  camera.position.set(0, 0, viewHeight / 2 / Math.tan((fov * Math.PI) / 360));
  camera.lookAt(0, 0, 0);

  const { shapes, loops } = logoShapes();
  const logo = new Group();
  // Repère du SVG (Y vers le bas, origine en haut à gauche) → centré, Y vers le haut.
  logo.scale.set(1, -1, 1);
  logo.position.set(-LOGO_WIDTH / 2, LOGO_HEIGHT / 2, 0);
  const pivot = new Group();
  pivot.add(logo);
  scene.add(pivot);

  // Face avant : le logo plein, au dégradé du survol.
  const fill = new ShaderMaterial({
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    uniforms: { uOpacity: { value: 0 }, uStops: { value: GRADIENT.map((hex) => new Color(hex)) } },
    vertexShader: /* glsl */ `
      varying vec2 vLogo;
      void main() {
        vLogo = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vLogo;
      uniform float uOpacity;
      uniform vec3 uStops[4];
      void main() {
        // Même dégradé radial que le survol CSS : centré à 35 % / 68 % du logo.
        vec2 center = vec2(0.35 * ${LOGO_WIDTH.toFixed(1)}, 0.68 * ${LOGO_HEIGHT.toFixed(1)});
        float d = clamp(length(vLogo - center) / ${GRADIENT_RADIUS.toFixed(2)}, 0.0, 1.0);
        vec3 color = d < 0.42 ? mix(uStops[0], uStops[1], d / 0.42)
          : d < 0.78 ? mix(uStops[1], uStops[2], (d - 0.42) / 0.36)
          : mix(uStops[2], uStops[3], (d - 0.78) / 0.22);
        gl_FragColor = vec4(color, uOpacity);
        #include <colorspace_fragment>
      }
    `,
  });
  const fillGeometry = new ShapeGeometry(shapes, 24);
  const fillMesh = new Mesh(fillGeometry, fill);
  logo.add(fillMesh);

  // Contours empilés : un jeu de lignes par couche, du plus vif au plus profond.
  const lineMaterials: LineMaterial[] = [];
  const lineGeometries: LineGeometry[] = [];
  const layers: Group[] = [];
  const loopLength = (loop: Vector2[]) =>
    loop.reduce((sum, point, i) => sum + point.distanceTo(loop[(i + 1) % loop.length]), 0);
  const longest = Math.max(...loops.map(loopLength));
  const addLoops = (group: Group, material: LineMaterial) => {
    for (const loop of loops) {
      const positions: number[] = [];
      for (const point of [...loop, loop[0]]) positions.push(point.x, point.y, 0);
      const geometry = new LineGeometry();
      geometry.setPositions(positions);
      lineGeometries.push(geometry);
      const line = new Line2(geometry, material);
      line.computeLineDistances();
      group.add(line);
    }
  };
  for (let layer = 0; layer <= LAYERS; layer += 1) {
    const group = new Group();
    const material = new LineMaterial({
      color: gradientAt(layer / LAYERS),
      linewidth: layer === 0 ? 2.4 : 1.5,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      // Le logo est retourné (repère du SVG) : sans cela, les lignes seraient
      // vues « de dos » et pas dessinées.
      side: DoubleSide,
    });
    lineMaterials.push(material);
    addLoops(group, material);
    layers.push(group);
    logo.add(group);
  }
  // Un trait de lumière qui fait le tour du contour avant.
  const comet = new LineMaterial({
    color: new Color("#FFE7C2"),
    linewidth: 3.2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: DoubleSide,
    dashed: true,
    dashSize: 16,
    gapSize: longest,
  });
  lineMaterials.push(comet);
  addLoops(layers[0], comet);

  const resolution = new Vector2();
  const resize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    resolution.set(width, height);
    for (const material of lineMaterials) material.resolution.copy(resolution);
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  // --- Animation -------------------------------------------------------------
  let active = false;
  let progress = 0;
  let flow = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0;
  let last = 0;
  let disposed = false;

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    progress = damp(progress, active ? 1 : 0, active ? 5.5 : 8, dt);
    pointer.x = damp(pointer.x, pointer.tx, 6, dt);
    pointer.y = damp(pointer.y, pointer.ty, 6, dt);
    flow += dt * 70;

    const spread = 9 * easeOutBack(Math.min(1, progress));
    // Le logo pivote pour montrer la profondeur, et suit un peu la souris.
    pivot.rotation.set((-0.25 + pointer.y * 0.25) * progress, (0.7 + pointer.x * 0.35) * progress, 0);

    // Le plein prend le dégradé dès l'entrée, puis s'efface quand les lignes
    // se déploient : au plus fort, le logo n'est plus que ses contours.
    fill.uniforms.uOpacity.value = Math.min(1, progress * 4) * (1 - 0.88 * Math.max(0, (progress - 0.35) / 0.65));
    layers.forEach((group, layer) => {
      // Les contours s'échelonnent derrière la face avant.
      group.position.z = -layer * spread;
      const material = lineMaterials[layer];
      const fade = layer === 0 ? 1 : 0.85 - (layer / LAYERS) * 0.55;
      material.opacity = Math.min(1, progress * 2.2) * fade;
    });
    comet.opacity = Math.min(1, Math.max(0, progress - 0.2) * 2);
    comet.dashOffset = -flow;

    renderer.render(scene, camera);

    if (active || progress > 0.003) {
      raf = requestAnimationFrame(frame);
    } else {
      progress = 0;
      last = 0;
      renderer.clear();
      onRest();
    }
  };
  const start = () => {
    if (!raf && !disposed) raf = requestAnimationFrame(frame);
  };

  return {
    setActive(next) {
      active = next;
      if (!next) {
        pointer.tx = 0;
        pointer.ty = 0;
      }
      start();
    },
    setPointer(x, y) {
      pointer.tx = Math.max(-1, Math.min(1, x));
      pointer.ty = Math.max(-1, Math.min(1, y));
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      fillGeometry.dispose();
      fill.dispose();
      for (const geometry of lineGeometries) geometry.dispose();
      for (const material of lineMaterials) material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
