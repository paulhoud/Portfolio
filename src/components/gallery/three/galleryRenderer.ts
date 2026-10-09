import {
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  PerspectiveCamera,
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
  /** Couleur de la lumière projetée et des arêtes. */
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
};

export type GalleryOptions = {
  calm: boolean;
  /** Jouer l'arrivée complète (première visite de la session). */
  arrival: boolean;
  /** Position de départ (défilement déjà restauré), en numéro de projet. */
  progress: number;
  frame: FrameRect;
};

export type GalleryRenderer = {
  setProgress(raw: number): void;
  setFrame(frame: FrameRect): void;
  setHighlight(index: number | null): void;
  setCalm(calm: boolean): void;
  setRunning(running: boolean): void;
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
  /** Fond de la tuile et couleur du boîtier : la plaque passe de l'un à l'autre en prenant du volume. */
  tileColor: Color;
  casing: Color;
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

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
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
 * Couleur des tranches. Une tuile pâle (fond blanc ou grège) donnerait une
 * plaque de plastique blanc : elle reçoit plutôt un boîtier à la couleur de
 * sa marque, comme une icône d'application. Les tuiles franches ou sombres
 * gardent leur fond.
 */
function casingColor(background: string, glow: string): Color {
  const base = new Color(background);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl, SRGBColorSpace);
  const luminance = 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b;
  if (luminance <= 0.45 || hsl.s >= 0.45) return base;
  const brand = new Color(glow);
  brand.getHSL(hsl, SRGBColorSpace);
  return brand.setHSL(hsl.h, Math.max(hsl.s, 0.6), Math.min(hsl.l, 0.42), SRGBColorSpace);
}

/** Couleur « bonbon » des satellites : la teinte du projet, saturée. */
function candyColor(glow: string): Color {
  const color = new Color(glow);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl, SRGBColorSpace);
  return color.setHSL(hsl.h, Math.max(hsl.s, 0.7), clamp(hsl.l, 0.45, 0.6), SRGBColorSpace);
}

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
  const blank = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat);
  blank.needsUpdate = true;

  const slabMaterial = (body: Color, glow: Color, exposure: number, solid: boolean, rim: number) =>
    new ShaderMaterial({
      vertexShader: slabVertex,
      fragmentShader: slabFragment,
      uniforms: {
        ...fog,
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
    const geometry = new RoundedBoxGeometry(size, size, SLAB_DEPTH, 6, SLAB_RADIUS);
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
    const casing = casingColor(input.background, input.glow);
    const material = slabMaterial(casing.clone(), new Color(input.glow), input.exposure, false, 0);
    const mesh = new Mesh(slabGeometry(layouts[index].size), material);
    mesh.userData.index = index;
    scene.add(mesh);
    return {
      mesh,
      tileColor: new Color(input.background),
      casing,
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

  // --- Satellites : petits volumes décoratifs autour des plaques ------------
  let satelliteLayouts: SatelliteLayout[] = [];
  let satellites: Mesh<RoundedBoxGeometry, ShaderMaterial>[] = [];
  let satelliteSignature = "";
  const disposeSatellites = () => {
    for (const mesh of satellites) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    satellites = [];
  };
  /** La disposition dépend de la forme de l'écran : on reconstruit si elle change. */
  const buildSatellites = () => {
    satelliteLayouts = layoutSatellites(layouts, currentSpacing);
    const signature = satelliteLayouts.map((layout) => `${layout.owner}:${layout.size.join(",")}:${layout.dark}`).join("|");
    if (signature === satelliteSignature) return;
    satelliteSignature = signature;
    disposeSatellites();
    satellites = satelliteLayouts.map((layout) => {
      const glow = candyColor(inputs[layout.owner].glow);
      const body = layout.dark ? new Color("#16161c") : glow;
      const material = slabMaterial(body, glow, 1, true, layout.dark ? 0.6 : 0.1);
      const [w, h, d] = layout.size;
      const mesh = new Mesh(new RoundedBoxGeometry(w, h, d, 3, layout.radius), material);
      scene.add(mesh);
      return mesh;
    });
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
    },
  });
  const floorGeometry = new PlaneGeometry(260, 260);
  floorGeometry.rotateX(-Math.PI / 2);
  const floor = new Mesh(floorGeometry, floorMaterial);
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
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let lastActivity = performance.now();
  let intro: Intro | null = null;
  // À la première visite, l'arrivée complète ; ensuite, la tuile HTML se
  // contente de prendre du volume. Rien en mode calme.
  let introPending: "full" | "settle" | null = calm ? null : options.arrival ? "full" : "settle";
  let ready = false;
  const createdAt = performance.now();

  const activeIndex = () => Math.min(count - 1, Math.max(0, Math.round(calm ? calmStation : stationTarget)));

  // --- Dimensions et cadrage -----------------------------------------------
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
    // Le projet actif se place au centre du cadre HTML (à droite du texte sur
    // ordinateur, en haut sur téléphone) tout en restant vu bien en face.
    camera.setViewOffset(w, h, w / 2 - frame.cx, h / 2 - frame.cy, w, h);
    camera.updateProjectionMatrix();
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
      const wanted = index === hovered || index === highlight;
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
        if (piece.mode !== null || !inputs[index].video || index === hovered || index === highlight) continue;
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
  const updateScheduler = () => scheduler.setEnabled(running && !calm && ready && !disposed && intro === null);

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

  function setHovered(index: number | null) {
    if (index === hovered) return;
    hovered = index;
    canvas.style.cursor = index === null ? "" : "pointer";
    callbacks.onHover(index);
    refreshPlays();
    invalidate();
  }

  let lastPointerType = "mouse";
  let touchStart: { x: number; y: number } | null = null;
  let suppressClick = false;

  const onPointerMove = (event: PointerEvent) => {
    lastPointerType = event.pointerType;
    if (event.pointerType === "mouse") setHovered(pick(event.clientX, event.clientY));
    activity();
  };
  const onPointerLeave = () => setHovered(null);
  const onPointerDown = (event: PointerEvent) => {
    lastPointerType = event.pointerType;
    suppressClick = false;
    if (event.pointerType !== "mouse") {
      touchStart = { x: event.clientX, y: event.clientY };
    } else if (event.button === 1 && pick(event.clientX, event.clientY) !== null) {
      // Clic molette sur une plaque : nouvel onglet, sans le défilement
      // automatique que Windows déclenche sinon.
      event.preventDefault();
    }
  };
  const onPointerUp = (event: PointerEvent) => {
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
    const index = pick(event.clientX, event.clientY);
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
        if (introPending) {
          intro = { start: now, full: introPending === "full", active: activeIndex() };
          introPending = null;
        }
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

    const distance = baseDistance * (sizeAt(layouts, station) / PIECE_SIZE) * (1 + 0.12 * dolly);
    const pose = cameraPose(layouts, station, distance);
    camera.position.set(
      pose.position[0] + pointer.x * 0.32,
      pose.position[1] + pointer.y * 0.18 + dolly * 0.35,
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

      let scaleXY = (1 + 0.05 * piece.hover) * (0.5 + 0.5 * pop);
      let scaleZ = scaleXY;
      let swing = 0;
      // Mouvement propre (souris, pivot lent) : nul au premier instant du relais.
      let motion = 1;
      if (lifting) {
        // Au départ, la plaque est à plat, son image exactement à la taille
        // de la tuile HTML et de sa couleur ; elle prend ensuite du volume.
        const liftT = clamp01(introT / (current.full ? 1.1 : 0.45));
        const lift = easeOutCubic(liftT);
        const start = ((1 + 0.12 * dolly) * layout.size) / (fill * (layout.size - SLAB_RADIUS));
        scaleXY *= start + (1 - start) * lift;
        scaleZ *= 0.06 + 0.94 * lift;
        swing = current.full ? 0.4 * Math.sin(Math.PI * liftT) : 0;
        motion = lift;
        uniforms.uBody.value.lerpColors(piece.tileColor, piece.casing, lift);
        uniforms.uExposure.value = 1 + (inputs[index].exposure - 1) * lift;
      } else {
        uniforms.uBody.value.copy(piece.casing);
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
        layout.position[2] + 0.35 * piece.hover - (1 - arrive) * 9,
      );
      const shrink = 1 - 0.2 * part;
      mesh.scale.set(scaleXY * shrink, scaleXY * shrink, scaleZ * shrink);
      if (mesh.geometry !== slabGeometry(layout.size)) mesh.geometry = slabGeometry(layout.size);

      uniforms.uLit.value = clamp01(arrive * 1.6);
      uniforms.uRim.value = 0.1 * facing + 0.9 * piece.hover;
      uniforms.uMix.value = piece.mix;

      const glow = (0.035 + 0.07 * facing + 0.2 * piece.hover) * clamp01(arrive * 1.4);
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
      mesh.scale.setScalar(Math.max(0.001, pop));
      mesh.material.uniforms.uLit.value = clamp01(arrive * 1.6);
    }

    return busy;
  }

  resize();
  invalidate();

  return {
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
