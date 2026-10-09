import {
  BufferGeometry,
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  VideoTexture,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PassiveScheduler } from "@/components/projects/passiveScheduler";
import { PLAYBACK_RATE } from "@/content/projectMedia";
import {
  EYE_LIFT,
  PIECE_SIZE,
  SLAB_DEPTH,
  SLAB_RADIUS,
  cameraPose,
  framingFor,
  layoutPieces,
  layoutSatellites,
  scrollToStation,
  sizeAt,
  spacingFor,
  viewDistance,
  type PieceLayout,
  type SatelliteLayout,
} from "./layout";
import { createBlackHole, type BlackHole } from "./blackHole";
import { createDimension, type Dimension } from "./dimension";
import { buildIdentityModels } from "./identity";
import { SATELLITE_SPRING, SLAB_SPRING, createBody, stepBody, type Body } from "./physics";
import { floorFragment, floorVertex, slabFragment, slabVertex } from "./shaders";

/** Une plaque de la galerie, telle que la page la décrit. */
export type GalleryPieceInput = {
  /** Image fixe de la tuile, déjà redimensionnée par l'optimiseur d'images. */
  image: string | null;
  /** Animation de la tuile. */
  video: string | null;
  motionStart: number;
  motionEnd: number | null;
  /** Couleur de fond de la tuile. */
  background: string;
  /** Couleur de la lumière projetée au sol. */
  glow: string;
  exposure: number;
};

/** Emplacement du cadre HTML, en pixels CSS dans le canevas. */
export type FrameRect = { cx: number; cy: number; size: number };

/** « context-lost » est passager ; « webgl » et « slow » valent pour la session. */
export type GalleryFailure = "webgl" | "slow" | "context-lost";

export type GalleryCallbacks = {
  /** Plaque survolée à la souris (ou `null`). */
  onHover: (index: number | null) => void;
  /** Entrer dans un projet (clic, toucher sur la plaque active). */
  onActivate: (index: number, newTab: boolean) => void;
  /** Aller jusqu'à une plaque (toucher un voisin, glisser sur le côté). */
  onSelect: (index: number) => void;
  /** Première image prête : le canevas peut apparaître. */
  onReady: () => void;
  /** 3D indisponible, perdue ou trop lente : on revient au cadre HTML. */
  onFail: (reason: GalleryFailure) => void;
  /** Clic dans le vide de la scène (ni plaque ni satellite). */
  onEmptyClick?: () => void;
};

/**
 * Étapes de « destroy the world » : aspiration, effondrement, puis on reste
 * perdu dans une autre dimension jusqu'à `returnFromVoid` ; renaissance, fin.
 */
export type WorldPhase = "suck" | "collapse" | "lost" | "rebirth" | "done";

export type GalleryOptions = {
  calm: boolean;
  /** Jouer l'arrivée complète (première visite de la session). */
  arrival: boolean;
  /** Position de départ (défilement déjà restauré), en numéro de projet. */
  progress: number;
  frame: FrameRect;
  /**
   * Retour d'un projet : la caméra part de l'intérieur de cette plaque (qui
   * remplit l'écran, sous le voile) et recule jusqu'à sa place.
   */
  returning?: number | null;
  /** L'arrivée attend `releaseIntro` (rideau d'ouverture encore baissé). */
  holdIntro?: boolean;
};

export type GalleryRenderer = {
  /**
   * Entrer dans un projet : la caméra rejoint sa plaque, s'avance jusqu'à ce
   * qu'elle remplisse l'écran, les autres s'éteignent ; `onCovered` est appelé
   * quand l'écran est presque couvert (moment de changer de page). Renvoie la
   * durée du trajet jusqu'à la plaque, en secondes (0 sans trajet).
   */
  enter(index: number, onCovered: () => void): number;
  /**
   * Fonction cachée : un trou noir aspire tout, se referme, puis le monde
   * renaît. Renvoie faux si ce n'est pas possible maintenant (entrée dans un
   * projet en cours, mode calme…).
   */
  destroyWorld(onPhase: (phase: WorldPhase) => void): boolean;
  /** Quitte l'autre dimension : le monde renaît. Faux s'il n'y a rien à quitter. */
  returnFromVoid(): boolean;
  setProgress(raw: number): void;
  setFrame(frame: FrameRect): void;
  setHighlight(index: number | null): void;
  setCalm(calm: boolean): void;
  setRunning(running: boolean): void;
  /** Lance l'arrivée retenue par `holdIntro` (dès que la scène est prête). */
  releaseIntro(): void;
  dispose(): void;
};

const BACKGROUND = "#08080b";
const MAX_VIDEOS = 3;

type PlayMode = "hover" | "held" | "passive";

type VideoSlot = {
  video: HTMLVideoElement;
  texture: VideoTexture;
  frameHandle: number;
  lastUsed: number;
};

type PieceState = {
  mesh: Mesh<RoundedBoxGeometry, ShaderMaterial>;
  hover: number;
  mix: number;
  mixTarget: number;
  mode: PlayMode | null;
  onEnded: (() => void) | null;
  /** Numéro de la dernière lecture lancée : écarte les réponses périmées. */
  playToken: number;
  loaded: boolean;
};

type Intro = { start: number; full: boolean; active: number };

/** Entrée dans une plaque (trajet puis avancée) ou sortie à reculons. */
type Immersion = {
  kind: "enter" | "return";
  index: number;
  /** Début en ms ; négatif tant que la scène n'est pas prête (retour). */
  start: number;
  from: number;
  travel: number;
  onCovered: (() => void) | null;
};

const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
/** Durées (s) : avancée dans la plaque, sortie à reculons. */
const DIVE = 0.8;
const EMERGE = 1.05;
/** Recul (m) du trou noir derrière le projet regardé. */
const HOLE_BEHIND = 2.6;
/** Instant (s) où l'horloge du trou noir s'arrête, en attendant le retour. */
const LOST_HOLD = 5.2;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const random = (min: number, max: number) => min + Math.random() * (max - min);
const easeInCubic = (t: number) => t * t * t;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Amorti exponentiel, indépendant de la cadence d'affichage. */
const damp = (current: number, target: number, lambda: number, dt: number) =>
  target + (current - target) * Math.exp(-lambda * dt);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeOutBack = (t: number) => {
  const c = 1.5;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

/**
 * Crée la scène dans `host`, sur un canevas neuf : un canevas dont le
 * contexte a été libéré ne peut plus servir. Renvoie `null` (et appelle
 * `onFail`) si le navigateur ne peut pas l'afficher correctement.
 */
export function createGalleryRenderer(
  host: HTMLElement,
  inputs: GalleryPieceInput[],
  callbacks: GalleryCallbacks,
  options: GalleryOptions,
): GalleryRenderer | null {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("role", "presentation");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y pinch-zoom";
  host.appendChild(canvas);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      stencil: false,
      // Les portables gardent leur carte graphique économe.
      powerPreference: "default",
      // Pas de 3D au rabais (rendu logiciel) : on garde alors le cadre HTML.
      failIfMajorPerformanceCaveat: true,
    });
  } catch {
    canvas.remove();
    callbacks.onFail("webgl");
    return null;
  }

  const count = inputs.length;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const dprSteps = [Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75), 1.25, 1].filter(
    (value, index, all) => index === 0 || value < all[0],
  );
  let dprStep = 0;

  const background = new Color(BACKGROUND);
  renderer.setClearColor(background, 1);
  renderer.setPixelRatio(dprSteps[0]);

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 90);
  const fog = {
    uFogColor: { value: background },
    uFogNear: { value: 10 },
    uFogFar: { value: 34 },
  };
  const lightDir = new Vector3(-0.55, 0.8, 0.6).normalize();
  // Courbure de l'espace autour du trou noir, partagée par tous les volumes.
  const warp = {
    uWarpCenter: { value: new Vector3() },
    uWarpAxis: { value: new Vector3(0, 0, 1) },
    uWarp: { value: 0 },
  };
  const blank = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat);
  blank.needsUpdate = true;

  const slabMaterial = (body: Color, glow: Color, exposure: number, solid: boolean, rim: number) =>
    new ShaderMaterial({
      // Les objets qui flottent portent leurs couleurs sur leurs sommets.
      vertexColors: solid,
      vertexShader: slabVertex,
      fragmentShader: slabFragment,
      uniforms: {
        ...fog,
        ...warp,
        uLightDir: { value: lightDir },
        uMap: { value: blank },
        uVideo: { value: blank },
        uHasMap: { value: 0 },
        uMix: { value: 0 },
        uBody: { value: body },
        uGlow: { value: glow },
        uExposure: { value: exposure },
        uRim: { value: rim },
        uLit: { value: 1 },
        uSolid: { value: solid ? 1 : 0 },
      },
    });

  // --- Plaques -------------------------------------------------------------
  const geometries = new Map<number, RoundedBoxGeometry>();
  const slabGeometry = (size: number) => {
    const cached = geometries.get(size);
    if (cached) return cached;
    const geometry = new RoundedBoxGeometry(size, size, SLAB_DEPTH, 12, SLAB_RADIUS);
    // Projection à plat de l'image : l'essentiel tombe sur la face plane, le
    // bord déborde sur l'arrondi, où le shader le fond dans la couleur du boîtier.
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const span = size - SLAB_RADIUS;
    for (let i = 0; i < position.count; i += 1) {
      uv.setXY(i, position.getX(i) / span + 0.5, position.getY(i) / span + 0.5);
    }
    uv.needsUpdate = true;
    geometries.set(size, geometry);
    return geometry;
  };

  let currentSpacing = spacingFor(5, 1.6);
  let layouts: PieceLayout[] = layoutPieces(count, currentSpacing);
  const pieces: PieceState[] = inputs.map((input, index) => {
    // Le boîtier prend la couleur du pourtour de la tuile (calculée dans le
    // shader) ; le fond déclaré sert tant que l'image n'est pas chargée.
    const material = slabMaterial(new Color(input.background), new Color(input.glow), input.exposure, false, 0);
    const mesh = new Mesh(slabGeometry(layouts[index].size), material);
    mesh.userData.index = index;
    mesh.userData.kind = "piece";
    scene.add(mesh);
    return {
      mesh,
      hover: 0,
      mix: 0,
      mixTarget: 0,
      mode: null,
      onEnded: null,
      playToken: 0,
      loaded: false,
    };
  });
  const meshes = pieces.map((piece) => piece.mesh);
  const pieceBodies: Body[] = pieces.map(() => createBody());

  // --- Satellites : petits volumes décoratifs autour des plaques ------------
  let satelliteLayouts: SatelliteLayout[] = [];
  let satellites: Mesh<BufferGeometry, ShaderMaterial>[] = [];
  /** Les treize objets, construits une fois et partagés (cf. identity.ts). */
  let identityModels: BufferGeometry[] | null = null;
  let satelliteBodies: Body[] = [];
  let satelliteSignature = "";
  const disposeSatellites = () => {
    for (const mesh of satellites) {
      scene.remove(mesh);
      mesh.material.dispose();
    }
    satellites = [];
  };
  /** La disposition dépend de la forme de l'écran : on reconstruit si elle change. */
  const buildSatellites = () => {
    satelliteLayouts = layoutSatellites(layouts, currentSpacing);
    const signature = satelliteLayouts.map((layout) => `${layout.owner}:${layout.size.join(",")}`).join("|");
    if (signature === satelliteSignature) return;
    satelliteSignature = signature;
    disposeSatellites();
    identityModels ??= buildIdentityModels();
    const models = identityModels;
    satellites = satelliteLayouts.map((layout, index) => {
      const material = slabMaterial(new Color("#ffffff"), new Color(inputs[layout.owner].glow), 1, true, 0);
      // Les objets se suivent dans l'ordre : chaque plaque en a de différents.
      const mesh = new Mesh(models[index % models.length], material);
      mesh.userData.baseScale = Math.max(...layout.size);
      scene.add(mesh);
      return mesh;
    });
    satellites.forEach((mesh, index) => {
      mesh.userData.kind = "satellite";
      mesh.userData.index = index;
    });
    satelliteBodies = satellites.map(() => createBody());
  };

  // --- Sol -----------------------------------------------------------------
  const floorGlow = inputs.map(() => new Vector3());
  const floorPos = inputs.map(() => new Vector3());
  const glowColors = inputs.map((input) => new Color(input.glow));
  const floorMaterial = new ShaderMaterial({
    vertexShader: floorVertex,
    fragmentShader: floorFragment,
    defines: { PIECES: count },
    uniforms: {
      ...fog,
      uBase: { value: new Color("#09090c") },
      uGrid: { value: new Color("#24242c") },
      uPiecePos: { value: floorPos },
      uPieceGlow: { value: floorGlow },
      uDim: { value: 0 },
      uHole: { value: new Vector3() },
      uSwirl: { value: 0 },
    },
  });
  const floorGeometry = new PlaneGeometry(260, 260);
  floorGeometry.rotateX(-Math.PI / 2);
  const floor = new Mesh(floorGeometry, floorMaterial);
  // Dessiné en premier : le trou noir passe par-dessus le sol, les objets
  // par-dessus le trou noir.
  floor.renderOrder = -3;
  scene.add(floor);

  // --- État ----------------------------------------------------------------
  let disposed = false;
  let running = true;
  let calm = options.calm;
  let frame = options.frame;
  let baseDistance = 5;
  let fill = 0.72;
  let width = 0;
  let height = 0;
  let lastRaw = options.progress;
  const clampRaw = (raw: number) => Math.min(count - 1, Math.max(0, raw));
  let stationTarget = scrollToStation(options.progress, count);
  let station = calm ? Math.round(clampRaw(options.progress)) : stationTarget;
  let calmStation = Math.round(clampRaw(options.progress));
  let lastScrollAt = 0;
  let hovered: number | null = null;
  let highlight: number | null = null;
  /** Téléphone : projet sur lequel le défilement s'est posé (cf. update). */
  let arrived: number | null = null;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let lastActivity = performance.now();
  let intro: Intro | null = null;
  // À la première visite, l'arrivée complète ; ensuite, la tuile HTML se
  // contente de prendre du volume. Rien en mode calme.
  let introPending: "full" | "settle" | null =
    calm || options.returning != null ? null : options.arrival ? "full" : "settle";
  // Sous le rideau d'ouverture, l'arrivée attend qu'il se lève pour être vue.
  let introHeld = options.holdIntro ?? false;
  const startIntro = (now: number) => {
    if (!introPending) return;
    intro = { start: now, full: introPending === "full", active: activeIndex() };
    introPending = null;
  };
  // Retour d'un projet : la caméra attend dans la plaque que la scène soit prête.
  let immersion: Immersion | null =
    options.returning != null && !calm
      ? { kind: "return", index: options.returning, start: -1, from: options.returning, travel: 0, onCovered: null }
      : null;
  /** Part de l'immersion : 0 au repos, 1 quand la plaque remplit l'écran. */
  let cover = immersion ? 1 : 0;

  /** Objet attrapé à la souris (plaque ou satellite) et lancé. */
  type Drag = {
    body: Body;
    plane: Plane;
    grab: Vector3;
    startX: number;
    startY: number;
    moved: boolean;
    last: Vector3;
    lastAt: number;
    velocity: Vector3;
    pointerId: number;
  };
  let drag: Drag | null = null;

  /** Trou noir en cours (fonction cachée). */
  type World = {
    start: number;
    center: Vector3;
    axis: Vector3;
    /** Agrandissement du trou, pour qu'il paraisse de la même taille de loin. */
    scale: number;
    /** Instant du retour demandé depuis l'autre dimension (sinon on y reste). */
    returnAt: number | null;
    onPhase: (phase: WorldPhase) => void;
    reached: Set<WorldPhase>;
  };
  let world: World | null = null;
  let blackHole: BlackHole | null = null;
  let dimension: Dimension | null = null;
  let ready = false;
  const createdAt = performance.now();

  const activeIndex = () => Math.min(count - 1, Math.max(0, Math.round(calm ? calmStation : stationTarget)));

  // --- Dimensions et cadrage -----------------------------------------------
  /**
   * Le projet actif se place au centre du cadre HTML (à droite du texte sur
   * ordinateur, en haut sur téléphone) tout en restant vu bien en face ; en
   * entrant dans une plaque, ce centre glisse vers celui de l'écran.
   */
  function applyView() {
    const cx = frame.cx + (width / 2 - frame.cx) * cover;
    const cy = frame.cy + (height / 2 - frame.cy) * cover;
    camera.setViewOffset(width, height, width / 2 - cx, height / 2 - cy, width, height);
    camera.updateProjectionMatrix();
  }
  /** Recul pour que l'image de la plaque déborde de tout l'écran. */
  const coverDistance = (size: number) => {
    const half = Math.tan((camera.fov * Math.PI) / 360);
    return (size - SLAB_RADIUS) / 2 / (half * Math.max(1, camera.aspect) * 1.06) + SLAB_DEPTH / 2;
  };
  const resize = () => {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    if (w !== width || h !== height) {
      width = w;
      height = h;
      renderer.setSize(w, h, false);
      skipFrame = false;
    }
    const aspect = w / h;
    const framing = framingFor(aspect);
    fill = framing.fill;
    camera.aspect = aspect;
    camera.fov = framing.fov;
    applyView();
    baseDistance = viewDistance(framing.fov, h, frame.size * framing.fill);
    currentSpacing = spacingFor(baseDistance, aspect);
    layouts = layoutPieces(count, currentSpacing);
    buildSatellites();
    fog.uFogNear.value = baseDistance + 3;
    fog.uFogFar.value = baseDistance + currentSpacing.depth * 3.2;
    invalidate();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  // --- Images --------------------------------------------------------------
  const loadImage = async (index: number) => {
    const src = inputs[index].image;
    if (!src) return;
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    try {
      await image.decode();
    } catch {
      return;
    }
    if (disposed) return;
    const texture = new Texture(image);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    texture.minFilter = LinearMipmapLinearFilter;
    texture.needsUpdate = true;
    renderer.initTexture(texture);
    const uniforms = pieces[index].mesh.material.uniforms;
    uniforms.uMap.value = texture;
    uniforms.uHasMap.value = 1;
    pieces[index].loaded = true;
    invalidate();
  };
  // Le projet affiché et ses voisins d'abord, trois chargements à la fois.
  const order = inputs
    .map((_, index) => index)
    .sort((a, b) => Math.abs(a - activeIndex()) - Math.abs(b - activeIndex()));
  let cursor = 0;
  const nextImage = (): Promise<void> | undefined => {
    if (cursor >= order.length || disposed) return undefined;
    const index = order[cursor];
    cursor += 1;
    return loadImage(index).then(() => nextImage());
  };
  for (let lane = 0; lane < 3; lane += 1) void nextImage();

  // --- Animations des tuiles (vidéo) ---------------------------------------
  const canPlayWebm = document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
  const slots = new Map<number, VideoSlot>();

  const releaseSlot = (index: number) => {
    const slot = slots.get(index);
    if (!slot) return;
    if (slot.frameHandle) slot.video.cancelVideoFrameCallback?.(slot.frameHandle);
    slot.video.pause();
    slot.video.removeAttribute("src");
    slot.video.load();
    slot.texture.dispose();
    slots.delete(index);
    pieces[index].mesh.material.uniforms.uVideo.value = blank;
  };

  const acquireSlot = (index: number): VideoSlot | null => {
    const src = inputs[index].video;
    if (!src || !canPlayWebm || disposed) return null;
    let slot = slots.get(index);
    if (!slot) {
      if (slots.size >= MAX_VIDEOS) {
        // On libère la plus ancienne qui ne joue pas.
        let oldest: number | null = null;
        for (const [key, value] of slots) {
          if (pieces[key].mode !== null || pieces[key].mix > 0.01) continue;
          if (oldest === null || value.lastUsed < slots.get(oldest)!.lastUsed) oldest = key;
        }
        if (oldest === null) return null;
        releaseSlot(oldest);
      }
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = src;
      // VideoTexture : envoyée image par image à la carte graphique, à la taille
      // réelle de la vidéo (une texture ordinaire la croirait vide).
      const texture = new VideoTexture(video, undefined, undefined, undefined, LinearFilter, LinearFilter);
      texture.colorSpace = SRGBColorSpace;
      slot = { video, texture, frameHandle: 0, lastUsed: 0 };
      slots.set(index, slot);
    }
    slot.lastUsed = performance.now();
    return slot;
  };

  /** Fin de lecture : le survol fige l'image, le passif revient à l'image fixe. */
  const finish = (index: number) => {
    const piece = pieces[index];
    if (piece.mode === "hover") {
      piece.mode = "held";
    } else if (piece.mode === "passive") {
      piece.mode = null;
      piece.mixTarget = 0;
      const onEnded = piece.onEnded;
      piece.onEnded = null;
      onEnded?.();
    }
    invalidate();
  };

  const play = (index: number, mode: PlayMode, onEnded?: () => void) => {
    if (disposed) return;
    const slot = acquireSlot(index);
    const piece = pieces[index];
    if (!slot) {
      onEnded?.();
      return;
    }
    piece.mode = mode;
    piece.onEnded = onEnded ?? null;
    piece.playToken += 1;
    const token = piece.playToken;
    const { video } = slot;
    const input = inputs[index];
    try {
      video.currentTime = input.motionStart;
    } catch {
      /* ignore */
    }
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
    video.onended = () => finish(index);

    // Suivi image par image là où il existe ; sinon, à chaque avancée de lecture.
    const watchFrames = typeof video.requestVideoFrameCallback === "function";
    const onFrame = () => {
      if (piece.mode === null || piece.mode === "held" || disposed || token !== piece.playToken) return;
      piece.mesh.material.uniforms.uVideo.value = slot.texture;
      piece.mixTarget = 1;
      invalidate();
      if (input.motionEnd !== null && video.currentTime >= input.motionEnd) {
        video.pause();
        finish(index);
        return;
      }
      if (watchFrames) slot.frameHandle = video.requestVideoFrameCallback(onFrame);
    };
    if (watchFrames) slot.frameHandle = video.requestVideoFrameCallback(onFrame);
    else video.ontimeupdate = onFrame;
    const played = video.play();
    if (played && typeof played.catch === "function") {
      played.catch((error: unknown) => {
        // Une lecture interrompue par une pause (onglet masqué…) reprendra ;
        // une lecture refusée (économie d'énergie…) laisse l'image fixe.
        if (disposed || token !== piece.playToken) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        piece.mode = null;
        piece.mixTarget = 0;
        const callback = piece.onEnded;
        piece.onEnded = null;
        callback?.();
      });
    }
  };

  const stop = (index: number) => {
    const piece = pieces[index];
    piece.mode = null;
    piece.onEnded = null;
    piece.mixTarget = 0;
    piece.playToken += 1;
    const slot = slots.get(index);
    if (slot) {
      slot.video.pause();
      if (slot.frameHandle) slot.video.cancelVideoFrameCallback?.(slot.frameHandle);
    }
    invalidate();
  };

  /** Survol ou focus clavier : l'animation se joue une fois et reste sur le logo. */
  const refreshPlays = () => {
    for (let index = 0; index < count; index += 1) {
      const piece = pieces[index];
      const wanted = index === hovered || index === highlight || index === arrived;
      if (wanted && piece.mode !== "hover" && piece.mode !== "held") {
        if (piece.mode === "passive") {
          // La lecture passive en cours devient un survol : le cycle passif
          // est libéré pour la suite.
          piece.mode = "hover";
          const onEnded = piece.onEnded;
          piece.onEnded = null;
          onEnded?.();
        } else {
          play(index, "hover");
        }
      } else if (!wanted && (piece.mode === "hover" || piece.mode === "held")) {
        stop(index);
      }
    }
  };

  // --- Animations automatiques, de temps en temps --------------------------
  const projected = new Vector3();
  const scheduler = new PassiveScheduler({
    getCandidates: () => {
      const ids: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const piece = pieces[index];
        if (piece.mode !== null || !inputs[index].video || index === hovered || index === highlight || index === arrived) continue;
        projected.copy(piece.mesh.position).project(camera);
        const inView = Math.abs(projected.x) < 0.9 && Math.abs(projected.y) < 0.9 && projected.z < 1;
        const near = piece.mesh.position.distanceTo(camera.position) < fog.uFogFar.value * 0.6;
        if (inView && near) ids.push(String(index));
      }
      return ids;
    },
    play: (id, onEnded) => play(Number(id), "passive", onEnded),
    stop: (id) => {
      if (pieces[Number(id)].mode === "passive") stop(Number(id));
    },
    setTimer: (callback, delay) => window.setTimeout(callback, delay),
    clearTimer: (handle) => window.clearTimeout(handle),
  });
  const updateScheduler = () =>
    scheduler.setEnabled(
      running && !calm && ready && !disposed && intro === null && immersion === null && world === null,
    );

  const activity = () => {
    lastActivity = performance.now();
    scheduler.notifyActivity();
  };

  // --- Arrivée -------------------------------------------------------------
  const introEvents = ["wheel", "keydown", "touchstart", "pointerdown"] as const;
  const removeIntroListeners = () => {
    for (const type of introEvents) window.removeEventListener(type, skipIntro);
  };
  /** Toute action du visiteur amène directement l'arrivée à sa fin. */
  function skipIntro() {
    introPending = null;
    intro = null;
    removeIntroListeners();
    updateScheduler();
    invalidate();
  }
  if (introPending === "full") for (const type of introEvents) window.addEventListener(type, skipIntro, { passive: true });

  const introLength = (current: Intro) => (current.full ? 2.6 : 0.5);
  const pieceDelay = (index: number, active: number) => 0.25 + 0.085 * Math.abs(index - active);

  // --- Pointeur ------------------------------------------------------------
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const pick = (clientX: number, clientY: number): number | null => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    return hit ? (hit.object.userData.index as number) : null;
  };

  /** Plaque ou satellite sous le pointeur, avec le point touché. */
  const pickAny = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects([...meshes, ...satellites], false)[0];
    if (!hit) return null;
    const { kind, index } = hit.object.userData as { kind: "piece" | "satellite"; index: number };
    return { kind, index, point: hit.point.clone(), object: hit.object };
  };
  const pointerRay = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray;
  };
  const viewDirection = new Vector3();
  const planeHit = new Vector3();

  function setHovered(index: number | null) {
    if (index === hovered) return;
    hovered = index;
    if (!drag) canvas.style.cursor = index === null ? "" : "pointer";
    callbacks.onHover(index);
    refreshPlays();
    invalidate();
  }

  let lastPointerType = "mouse";
  let touchStart: { x: number; y: number } | null = null;
  let suppressClick = false;

  const onPointerMove = (event: PointerEvent) => {
    lastPointerType = event.pointerType;
    if (immersion || world) return;
    if (drag) {
      // Au-delà de quelques pixels, l'appui devient une prise : l'objet suit
      // le pointeur dans un plan face à la caméra.
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5) {
        drag.moved = true;
        drag.body.held = true;
        canvas.style.cursor = "grabbing";
        setHovered(null);
      }
      if (drag.moved && pointerRay(event.clientX, event.clientY).intersectPlane(drag.plane, planeHit)) {
        const now = performance.now();
        planeHit.sub(drag.grab).sub(drag.body.rest);
        const dt = Math.max(0.001, (now - drag.lastAt) / 1000);
        // Vitesse lissée : c'est elle qui donnera l'élan au lâcher.
        drag.velocity.lerp(planeHit.clone().sub(drag.last).divideScalar(dt), 0.35);
        drag.last.copy(planeHit);
        drag.lastAt = now;
        drag.body.offset.copy(planeHit);
        invalidate();
      }
      activity();
      return;
    }
    if (event.pointerType === "mouse") {
      const index = pick(event.clientX, event.clientY);
      setHovered(index);
      if (index === null && !calm) canvas.style.cursor = pickAny(event.clientX, event.clientY) ? "grab" : "";
    }
    activity();
  };
  const onPointerLeave = () => setHovered(null);
  const onPointerDown = (event: PointerEvent) => {
    lastPointerType = event.pointerType;
    suppressClick = false;
    // Souris et stylet : on peut attraper plaques et satellites (au doigt, le
    // glisser sert déjà à défiler et à changer de projet).
    if (event.pointerType !== "touch" && event.button === 0 && !calm && !immersion && !world) {
      const hit = pickAny(event.clientX, event.clientY);
      if (hit) {
        event.preventDefault();
        const body = hit.kind === "piece" ? pieceBodies[hit.index] : satelliteBodies[hit.index];
        const center = hit.object.position;
        camera.getWorldDirection(viewDirection);
        drag = {
          body,
          plane: new Plane().setFromNormalAndCoplanarPoint(viewDirection.clone(), hit.point),
          grab: hit.point.clone().sub(center),
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
          last: body.offset.clone(),
          lastAt: performance.now(),
          velocity: new Vector3(),
          pointerId: event.pointerId,
        };
        canvas.setPointerCapture(event.pointerId);
      }
    }
    if (event.pointerType !== "mouse") {
      touchStart = { x: event.clientX, y: event.clientY };
    } else if (event.button === 1 && pick(event.clientX, event.clientY) !== null) {
      // Clic molette sur une plaque : nouvel onglet, sans le défilement
      // automatique que Windows déclenche sinon.
      event.preventDefault();
    }
  };
  const release = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return false;
    const current = drag;
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = "";
    if (!current.moved) return false;
    // Lâché avec son élan, il file puis revient à sa place (cf. physics).
    current.body.held = false;
    current.body.velocity.copy(current.velocity);
    if (current.body.velocity.length() > 28) current.body.velocity.setLength(28);
    current.body.spin.set(-current.velocity.y * 0.35, current.velocity.x * 0.35, -current.velocity.x * 0.15);
    suppressClick = true;
    invalidate();
    return true;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (release(event)) return;
    if (event.pointerType === "mouse" || !touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      // Glisser sur le côté : projet suivant ou précédent.
      suppressClick = true;
      callbacks.onSelect(clamp(activeIndex() + (dx < 0 ? 1 : -1), 0, count - 1));
    }
  };
  // Le toucher agit au « clic » du navigateur : un appui qui arrête un
  // défilement lancé n'en produit pas, et n'ouvre donc rien par mégarde.
  const onClick = (event: MouseEvent) => {
    if (immersion || world) return;
    if (suppressClick && lastPointerType !== "touch") {
      suppressClick = false;
      return;
    }
    const index = pick(event.clientX, event.clientY);
    const hit = index === null ? pickAny(event.clientX, event.clientY) : null;
    // Un satellite qu'on touche sans le tirer reçoit une pichenette.
    if (hit?.kind === "satellite" && !calm) {
      const body = satelliteBodies[hit.index];
      body.velocity.add(new Vector3(random(-1, 1), random(0.5, 1.5), random(-1, 1)).multiplyScalar(4));
      body.spin.add(new Vector3(random(-6, 6), random(-6, 6), random(-6, 6)));
      invalidate();
      return;
    }
    if (index === null) callbacks.onEmptyClick?.();
    if (lastPointerType === "mouse") {
      if (index !== null) callbacks.onActivate(index, event.ctrlKey || event.metaKey || event.shiftKey);
      return;
    }
    if (suppressClick || performance.now() - lastScrollAt < 200 || index === null) return;
    if (index === activeIndex()) callbacks.onActivate(index, false);
    else callbacks.onSelect(index);
  };
  const onAuxClick = (event: MouseEvent) => {
    if (event.button !== 1) return;
    const index = pick(event.clientX, event.clientY);
    if (index !== null) callbacks.onActivate(index, true);
  };
  const onWindowMove = (event: MouseEvent) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((event.clientY / window.innerHeight) * 2 - 1);
    // En mode calme, la scène ne suit pas la souris : rien à redessiner.
    if (!calm) invalidate();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    callbacks.onFail("context-lost");
  };

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("click", onClick);
  canvas.addEventListener("auxclick", onAuxClick);
  canvas.addEventListener("webglcontextlost", onContextLost);
  if (!coarse) window.addEventListener("mousemove", onWindowMove, { passive: true });

  // --- Mesure de fluidité ----------------------------------------------------
  // Seules comptent les images enchaînées pendant un mouvement : le repos (une
  // image sur deux) et le rendu à la demande ne disent rien de la vitesse.
  let burstMs = 0;
  let burstFrames = 0;
  let slowMs = 0;
  let lastMeasuredAt = 0;
  const monitor = (now: number, measured: boolean) => {
    if (!measured || now - createdAt < 2500) {
      lastMeasuredAt = 0;
      return;
    }
    const gap = lastMeasuredAt ? now - lastMeasuredAt : 0;
    lastMeasuredAt = now;
    // Au-delà d'une seconde, l'onglet était figé : rien à en conclure. En
    // deçà, un écart long est une vraie lenteur (plafonné pour ne pas tout
    // décider sur une seule image).
    if (gap <= 0 || gap > 1000) return;
    burstMs += Math.min(gap, 250);
    burstFrames += 1;
    if (burstMs < 2000) return;
    const fps = (burstFrames * 1000) / burstMs;
    burstMs = 0;
    burstFrames = 0;
    if (fps >= 45) {
      slowMs = 0;
      return;
    }
    if (dprStep < dprSteps.length - 1) {
      dprStep += 1;
      renderer.setPixelRatio(dprSteps[dprStep]);
      width = 0;
      resize();
    } else if (fps < 24) {
      slowMs += 2000;
      if (slowMs >= 4000) callbacks.onFail("slow");
    } else {
      slowMs = 0;
    }
  };

  // --- Boucle de rendu -----------------------------------------------------
  let raf = 0;
  let lastTime = 0;
  let skipFrame = false;

  function invalidate() {
    if (!raf && running && !disposed) raf = requestAnimationFrame(frameLoop);
  }

  function frameLoop(now: number) {
    raf = 0;
    if (!running || disposed) return;
    const dt = Math.min(0.05, lastTime ? (now - lastTime) / 1000 : 1 / 60);
    lastTime = now;
    const busy = update(dt, now);
    // Au repos, seul le flottement continue : une image sur deux suffit.
    const idle = !calm && !busy && now - lastActivity > 2500;
    skipFrame = idle ? !skipFrame : false;
    if (!skipFrame) {
      renderer.render(scene, camera);
      monitor(now, busy && !calm);
      if (!ready && (pieces[activeIndex()].loaded || now - createdAt > 1800)) {
        ready = true;
        callbacks.onReady();
        if (!introHeld) startIntro(now);
        if (immersion && immersion.start < 0) immersion.start = now;
        updateScheduler();
      }
    }
    if (busy || !calm) invalidate();
  }

  function update(dt: number, now: number): boolean {
    let busy = false;
    const target = calm ? calmStation : stationTarget;
    station = calm ? target : damp(station, target, 5.5, dt);
    if (Math.abs(station - target) > 1e-4) busy = true;

    // Téléphone (pas de survol) : une fois posé sur un projet, son animation
    // se joue comme au survol ; elle s'arrête quand on en repart.
    if (coarse) {
      let next: number | null = null;
      if (!calm && ready && intro === null && immersion === null && world === null) {
        const resting = Math.round(target);
        if (Math.abs(target - resting) < 0.001 && Math.abs(station - resting) < 0.04 && now - lastScrollAt > 180) next = resting;
        else if (arrived !== null && Math.abs(station - arrived) < 0.3) next = arrived;
      }
      if (next !== arrived) {
        arrived = next;
        refreshPlays();
      }
    }

    // Immersion : la caméra suit son propre trajet, plus le défilement.
    const diving = immersion;
    // Grue : pendant un long trajet, la caméra prend du recul et de la hauteur
    // pour montrer les plaques qui défilent, puis redescend devant la bonne.
    let crane = 0;
    if (diving) {
      busy = true;
      // L'horloge des images peut précéder de peu l'instant du clic : jamais
      // de temps négatif (sans trajet, cela divisait par zéro).
      const t = diving.start < 0 ? 0 : Math.max(0, (now - diving.start) / 1000);
      if (diving.kind === "enter") {
        if (diving.travel > 0 && t < diving.travel) {
          const progress = t / diving.travel;
          station = diving.from + (diving.index - diving.from) * easeInOutSine(progress);
          crane = Math.sin(Math.PI * progress) * Math.min(0.85, 0.1 * Math.abs(diving.index - diving.from));
          cover = 0;
        } else {
          station = diving.index;
          cover = easeInOutSine(clamp01((t - diving.travel) / DIVE));
          if (cover > 0.72 && diving.onCovered) {
            const onCovered = diving.onCovered;
            diving.onCovered = null;
            window.setTimeout(onCovered, 0);
          }
        }
      } else {
        station = diving.index;
        cover = 1 - easeOutCubic(clamp01(t / EMERGE));
        if (t >= EMERGE) {
          immersion = null;
          cover = 0;
          updateScheduler();
        }
      }
      applyView();
      floorMaterial.uniforms.uDim.value = cover;
    }
    const focus = diving ? diving.index : -1;

    // « Destroy the world » : horloge et étapes.
    const doom = world;
    const raw = doom ? (now - doom.start) / 1000 : -1;
    const wt = !doom ? -1 : doom.returnAt === null ? Math.min(raw, LOST_HOLD) : 6.0 + Math.max(0, now - doom.returnAt) / 1000;
    if (doom) {
      busy = true;
      const reach = (phase: WorldPhase, at: number) => {
        if (wt >= at && !doom.reached.has(phase)) {
          doom.reached.add(phase);
          doom.onPhase(phase);
        }
      };
      reach("suck", 0.5);
      reach("collapse", 4.0);
      reach("lost", 4.6);
      reach("rebirth", 6.0);
      const floorUniforms = floorMaterial.uniforms;
      floorUniforms.uHole.value.copy(doom.center);
      floorUniforms.uSwirl.value =
        wt < 4.0 ? clamp01((wt - 0.3) / 3.2) : wt < 6.0 ? 1 : 1 - clamp01((wt - 6.0) / 1.4);
      // La salle s'assombrit comme l'espace pendant l'aspiration, puis disparaît.
      floorUniforms.uDim.value =
        wt < 4.3 ? 0.85 * clamp01((wt - 0.4) / 2.2) : wt < 6.0 ? Math.max(0.85, clamp01((wt - 4.3) / 0.3)) : 1 - clamp01((wt - 6.0) / 0.8);
      // L'espace se courbe de plus en plus : les volumes s'étirent et se
      // tordent en approchant ; à la renaissance, ils se redressent.
      const bend = clamp01((wt - 0.4) / 3.4);
      warp.uWarpCenter.value.copy(doom.center);
      warp.uWarpAxis.value.copy(doom.axis);
      warp.uWarp.value = wt < 4.0 ? bend * bend * (3 - 2 * bend) : wt < 6.0 ? 1 : (1 - clamp01((wt - 6.0) / 1.3)) ** 2;
      if (wt >= 7.8) {
        world = null;
        floorUniforms.uSwirl.value = 0;
        floorUniforms.uDim.value = 0;
        warp.uWarp.value = 0;
        dimension?.update(camera, 0, 0);
        doom.onPhase("done");
        updateScheduler();
      }
    }
    /** Part d'un objet déjà avalé (0 à 1), selon son éloignement du trou. */
    const swallowed = (delay: number) => {
      if (!doom || wt < 0.5) return 0;
      if (wt < 4.0) return easeInCubic(clamp01((wt - 0.5 - delay) / 2.3));
      if (wt < 6.0) return 1;
      return 1 - easeOutBack(clamp01((wt - 6.0 - delay * 0.5) / 1.2));
    };
    const holeOffset = new Vector3();
    /** Applique la physique, puis l'aspiration, à un objet déjà placé. */
    const finish = (mesh: Mesh, body: Body, spring: typeof SLAB_SPRING) => {
      body.rest.copy(mesh.position);
      if (stepBody(body, dt, spring)) busy = true;
      mesh.position.add(body.offset);
      mesh.rotation.x += body.turn.x;
      mesh.rotation.y += body.turn.y;
      mesh.rotation.z += body.turn.z;
      if (!doom) return 1;
      holeOffset.copy(mesh.position).sub(doom.center);
      const behind = holeOffset.clone().add(doom.center).sub(camera.position).dot(doom.axis) < 0.3;
      const amount = behind
        ? (wt < 6.0 ? clamp01((wt - 0.5) / 0.8) : 1 - clamp01((wt - 6.0) / 1.0))
        : swallowed(Math.min(1.2, holeOffset.length() / 25));
      if (amount <= 0) return 1;
      if (!behind) {
        // Spirale vers le centre, de plus en plus serrée.
        holeOffset.applyAxisAngle(doom.axis, amount * amount * 7).multiplyScalar(Math.max(0, 1 - amount) ** 1.5);
        mesh.position.copy(doom.center).add(holeOffset);
        mesh.rotation.z += amount * 9;
        mesh.rotation.x += amount * 4;
      }
      mesh.scale.multiplyScalar(Math.max(0.0001, (1 - Math.min(1, amount)) ** 0.8));
      return 1 - amount;
    };
    const room = 1 - cover;

    const parallax = calm ? 0 : 1;
    pointer.x = damp(pointer.x, pointer.tx * parallax, 3.5, dt);
    pointer.y = damp(pointer.y, pointer.ty * parallax, 3.5, dt);
    if (Math.abs(pointer.x - pointer.tx * parallax) + Math.abs(pointer.y - pointer.ty * parallax) > 1e-3) busy = true;

    // Arrivée : la plaque active prend du volume à la place de la tuile HTML,
    // puis (première visite) les autres surgissent de la profondeur.
    const current = intro;
    const introT = current ? (now - current.start) / 1000 : Number.POSITIVE_INFINITY;
    const introOn = current !== null && introT < introLength(current);
    const full = introOn && current.full;
    if (introOn) busy = true;
    if (current && !introOn) {
      intro = null;
      removeIntroListeners();
      updateScheduler();
    }
    const dolly = full ? 1 - easeOutCubic(clamp01(introT / 2.3)) : 0;

    const rest = baseDistance * (sizeAt(layouts, station) / PIECE_SIZE) * (1 + 0.12 * dolly + crane);
    // On avance en taille apparente (inverse de la distance) : la plaque grandit
    // régulièrement à l'écran au lieu de tout faire dans les derniers instants.
    const distance =
      focus >= 0 ? 1 / (1 / rest + (1 / coverDistance(layouts[focus].size) - 1 / rest) * cover) : rest;
    const pose = cameraPose(layouts, station, distance);
    // En entrant, le regard se met bien en face : ni surplomb ni parallaxe.
    camera.position.set(
      pose.position[0] + pointer.x * 0.32 * room,
      pose.position[1] + (pointer.y * 0.18 + dolly * 0.35) * room - EYE_LIFT * cover + crane * 1.6,
      pose.position[2],
    );
    camera.lookAt(pose.target[0], pose.target[1], pose.target[2]);

    const time = now / 1000;
    const float = calm ? 0 : 1;
    // Les plaques penchent dans le sens du déplacement.
    const bank = clamp((stationTarget - station) * 0.5, -0.35, 0.35) * float;
    for (let index = 0; index < count; index += 1) {
      const piece = pieces[index];
      const layout = layouts[index];
      const { mesh } = piece;
      const uniforms = mesh.material.uniforms;

      const wanted = index === hovered || index === highlight ? 1 : 0;
      piece.hover = calm ? wanted : damp(piece.hover, wanted, 9, dt);
      piece.mix = damp(piece.mix, piece.mixTarget, 14, dt);
      if (Math.abs(piece.hover - wanted) > 1e-3 || Math.abs(piece.mix - piece.mixTarget) > 1e-3) busy = true;
      if (piece.mixTarget === 0 && piece.mix < 0.002 && piece.mode === null) uniforms.uVideo.value = blank;

      const lifting = introOn && index === current.active;
      // Les plaques déjà dépassées (arrivée directe sur un projet plus loin)
      // sont derrière la caméra : elles ne traversent pas la scène.
      const arrive = full && !lifting && index > current.active ? clamp01((introT - pieceDelay(index, current.active)) / 0.9) : 1;
      const pop = easeOutBack(arrive);

      // La plaque active se tourne vers la caméra ; les autres gardent leur
      // biais. Au repos, l'active continue de pivoter doucement, comme chez Spline.
      const near = clamp01(1 - Math.abs(station - index));
      const facing = near * near * (3 - 2 * near);
      const unfaced = 1 - facing;
      const bob = Math.sin(time * 0.9 + layout.phase) * 0.08 * float;
      const sway = Math.sin(time * 0.55 + layout.phase * 1.7) * 0.035 * float;
      const idleTurn = float * facing;
      const yaw = Math.sin(time * 0.42 + layout.phase) * (coarse ? 0.16 : 0.08) * idleTurn;
      const pitch = Math.sin(time * 0.31 + layout.phase * 1.3) * 0.045 * idleTurn;
      const lean = 1 - 0.5 * piece.hover;

      let scaleXY = (1 + 0.04 * piece.hover) * (0.5 + 0.5 * pop);
      let scaleZ = scaleXY;
      let swing = 0;
      // Mouvement propre (souris, pivot lent) : nul au premier instant du
      // relais, et sur la plaque où l'on entre.
      let motion = index === focus ? room : 1;
      if (lifting) {
        // Au départ, la plaque est à plat, exactement à la place et à la
        // taille de la tuile HTML ; elle prend ensuite du volume.
        const liftT = clamp01(introT / (current.full ? 1.1 : 0.45));
        const lift = easeOutCubic(liftT);
        const start = (1 + 0.12 * dolly) / fill;
        scaleXY *= start + (1 - start) * lift;
        scaleZ *= 0.06 + 0.94 * lift;
        swing = current.full ? 0.4 * Math.sin(Math.PI * liftT) : 0;
        motion = lift;
        uniforms.uExposure.value = 1 + (inputs[index].exposure - 1) * lift;
      } else {
        uniforms.uExposure.value = inputs[index].exposure;
      }

      // La plaque qu'on vient de quitter s'écarte du chemin : la caméra ne la
      // traverse jamais, et le mouvement accompagne le départ.
      const next = layouts[index + 1];
      const away = next ? Math.sign(layout.position[0] - next.position[0]) || 1 : 0;
      const leaving = clamp01((station - index - 0.12) / 0.55);
      const part = leaving * leaving * (3 - 2 * leaving);

      mesh.rotation.set(
        layout.tilt[0] * unfaced + (-pointer.y * 0.16 * lean + sway * 0.5 + pitch) * motion,
        layout.tilt[1] * unfaced + (pointer.x * 0.24 * lean + yaw + bank) * motion + swing + away * 0.35 * part,
        layout.tilt[2] * unfaced + sway * motion,
      );
      mesh.position.set(
        layout.position[0] + away * 1.1 * part,
        layout.position[1] + bob * motion - (1 - pop) * 0.9 + 0.25 * part,
        layout.position[2] + 0.22 * piece.hover - (1 - arrive) * 9,
      );
      const shrink = 1 - 0.2 * part;
      mesh.scale.set(scaleXY * shrink, scaleXY * shrink, scaleZ * shrink);
      if (mesh.geometry !== slabGeometry(layout.size)) mesh.geometry = slabGeometry(layout.size);
      const present = finish(mesh, pieceBodies[index], SLAB_SPRING);

      uniforms.uLit.value = clamp01(arrive * 1.6) * (index === focus ? 1 : room);
      uniforms.uRim.value = 0.9 * piece.hover * room;
      uniforms.uMix.value = piece.mix;

      const glow = (0.035 + 0.07 * facing + 0.2 * piece.hover) * clamp01(arrive * 1.4) * room * present;
      floorPos[index].set(mesh.position.x, 0, mesh.position.z);
      floorGlow[index].set(glowColors[index].r * glow, glowColors[index].g * glow, glowColors[index].b * glow);
    }

    for (let index = 0; index < satellites.length; index += 1) {
      const layout = satelliteLayouts[index];
      const mesh = satellites[index];
      const ownedByLift = introOn && layout.owner === current.active;
      const arrive =
        full && layout.owner >= current.active
          ? clamp01((introT - pieceDelay(layout.owner, current.active) - 0.12) / 0.9)
          : 1;
      const pop = easeOutBack(arrive);
      const spin = float * time;
      mesh.rotation.set(
        layout.phase + layout.spin[0] * spin - pointer.y * 0.3,
        layout.phase * 0.7 + layout.spin[1] * spin + pointer.x * 0.4,
        layout.spin[2] * spin,
      );
      const restY = layout.position[1] + Math.sin(time * 0.8 + layout.phase) * 0.08 * float;
      if (ownedByLift && full) {
        // Les satellites de la plaque active jaillissent d'elle.
        const origin = pieces[layout.owner].mesh.position;
        mesh.position.set(
          origin.x + (layout.position[0] - origin.x) * pop,
          origin.y + (restY - origin.y) * pop,
          origin.z + (layout.position[2] - origin.z) * pop,
        );
      } else {
        mesh.position.set(layout.position[0], restY - (1 - pop) * 0.9, layout.position[2] - (1 - arrive) * 9);
      }
      mesh.scale.setScalar(Math.max(0.001, pop) * (mesh.userData.baseScale as number));
      const body = satelliteBodies[index];
      if (body) finish(mesh, body, SATELLITE_SPRING);
      mesh.material.uniforms.uLit.value = clamp01(arrive * 1.6) * room;
    }

    // Le trou noir lui-même : il grossit, tourbillonne, se referme dans un éclair.
    if (doom && blackHole) {
      const size =
        wt < 0.8 ? easeOutCubic(wt / 0.8) : wt < 4.0 ? 1 + 0.3 * ((wt - 0.8) / 3.2) : 1.3 * (1 - easeInCubic(clamp01((wt - 4.0) / 0.4)));
      const glow = wt < 0.8 ? wt / 0.8 : wt < 4.0 ? 1 : 1 - clamp01((wt - 4.0) / 0.3);
      const flash = wt < 4.25 ? 0 : wt < 4.35 ? (wt - 4.25) / 0.1 : Math.exp(-(wt - 4.35) * 4.5);
      blackHole.group.position.copy(doom.center);
      blackHole.group.scale.setScalar(doom.scale);
      blackHole.update(camera, Math.max(0, size), Math.max(0, glow), wt < 5.0 ? flash : 0, wt);
      // Le monde tremble pendant l'aspiration.
      if (wt > 0.5 && wt < 4.2) {
        const shake = 0.05 * clamp01((wt - 0.5) / 2.5);
        camera.position.x += random(-shake, shake);
        camera.position.y += random(-shake, shake);
      }
    } else if (blackHole) {
      blackHole.update(camera, 0, 0, 0, 0);
    }
    // L'autre dimension : elle apparaît dans l'éclair et s'efface au retour.
    if (doom && dimension) {
      const presence =
        doom.returnAt === null ? easeOutCubic(clamp01((raw - 4.4) / 1.2)) : 1 - clamp01((now - doom.returnAt) / 700);
      dimension.update(camera, presence, now / 1000);
    }

    return busy;
  }

  resize();
  invalidate();

  return {
    destroyWorld(onPhase) {
      if (calm || disposed || immersion || world) return false;
      skipIntro();
      setHovered(null);
      for (let i = 0; i < count; i += 1) if (pieces[i].mode !== null) stop(i);
      if (!blackHole) {
        blackHole = createBlackHole();
        scene.add(blackHole.group);
      }
      if (!dimension) {
        dimension = createDimension(pieces.filter((piece) => piece.loaded).map((piece) => piece.mesh.material.uniforms.uMap.value));
        scene.add(dimension.group);
      }
      // Le trou s'ouvre au milieu de l'écran (et non du cadre), au loin
      // derrière le projet qu'on regarde.
      const pose = cameraPose(layouts, station, 1);
      const depth = camera.position.distanceTo(new Vector3(...pose.target)) + HOLE_BEHIND;
      const axis = new Vector3(0, 0, 0.5).unproject(camera).sub(camera.position).normalize();
      world = {
        start: performance.now(),
        center: camera.position.clone().addScaledVector(axis, depth),
        axis,
        scale: (1.15 * depth) / (depth - HOLE_BEHIND + 1.2),
        returnAt: null,
        onPhase,
        reached: new Set(),
      };
      updateScheduler();
      invalidate();
      return true;
    },
    returnFromVoid() {
      const doom = world;
      if (!doom || doom.returnAt !== null || !doom.reached.has("lost")) return false;
      doom.returnAt = performance.now();
      invalidate();
      return true;
    },
    enter(index, onCovered) {
      if (calm || disposed) {
        onCovered();
        return 0;
      }
      if (immersion || world) return 0;
      skipIntro();
      setHovered(null);
      // La plaque visée reprend son image fixe : l'écran se remplit de sa couleur.
      for (let i = 0; i < count; i += 1) if (pieces[i].mode !== null) stop(i);
      const distanceToGo = Math.abs(station - index);
      immersion = {
        kind: "enter",
        index,
        start: performance.now(),
        from: station,
        // Plus le projet est loin, plus le trajet dure (de 0,7 s à 2,2 s).
        travel: distanceToGo < 0.05 ? 0 : clamp(0.55 + 0.17 * distanceToGo, 0.7, 2.2),
        onCovered,
      };
      stationTarget = index;
      calmStation = index;
      updateScheduler();
      invalidate();
      return immersion.travel;
    },
    setProgress(raw) {
      // Comme pour la liste : un défilement efface le survol, sinon le cartel
      // suivrait les plaques qui passent sous un curseur immobile.
      if (Math.abs(raw - lastRaw) > 1e-3) {
        setHovered(null);
        lastScrollAt = performance.now();
      }
      lastRaw = raw;
      stationTarget = scrollToStation(raw, count);
      // Mode calme : coupe franche d'un projet à l'autre, sans travelling ni fondu.
      calmStation = Math.round(clampRaw(raw));
      activity();
      invalidate();
    },
    setFrame(next) {
      frame = next;
      resize();
    },
    setHighlight(index) {
      if (index === highlight) return;
      highlight = index;
      refreshPlays();
      activity();
      invalidate();
    },
    setCalm(next) {
      if (next === calm) return;
      calm = next;
      stationTarget = scrollToStation(lastRaw, count);
      calmStation = Math.round(clampRaw(lastRaw));
      station = calm ? calmStation : station;
      if (calm) skipIntro();
      updateScheduler();
      invalidate();
    },
    releaseIntro() {
      if (!introHeld) return;
      introHeld = false;
      if (ready && !disposed) {
        startIntro(performance.now());
        updateScheduler();
        invalidate();
      }
    },
    setRunning(next) {
      if (next === running) return;
      running = next;
      if (!running) {
        cancelAnimationFrame(raf);
        raf = 0;
        for (let index = 0; index < count; index += 1) {
          if (pieces[index].mode === "passive") stop(index);
          else slots.get(index)?.video.pause();
        }
      } else {
        lastTime = 0;
        skipFrame = false;
        // Un survol interrompu par le changement d'onglet reprend là où il en était.
        for (const [index, slot] of slots) {
          if (pieces[index].mode !== "hover") continue;
          const played = slot.video.play();
          if (played && typeof played.catch === "function") played.catch(() => {});
        }
        invalidate();
      }
      updateScheduler();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      scheduler.dispose();
      resizeObserver.disconnect();
      removeIntroListeners();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", release);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("auxclick", onAuxClick);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("mousemove", onWindowMove);
      for (const index of [...slots.keys()]) releaseSlot(index);
      for (const piece of pieces) {
        const map = piece.mesh.material.uniforms.uMap.value as Texture;
        if (map !== blank) map.dispose();
        piece.mesh.material.dispose();
      }
      disposeSatellites();
      blackHole?.dispose();
      for (const geometry of identityModels ?? []) geometry.dispose();
      dimension?.dispose();
      for (const geometry of geometries.values()) geometry.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      blank.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
