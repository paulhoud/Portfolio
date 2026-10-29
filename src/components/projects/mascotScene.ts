import type { AnimationAction, AnimationClip, Material, Mesh, Object3D } from "three";

export type MascotState = "idle" | "hello" | "think" | "walk" | "run";

export type MascotScene = {
  play: (state: MascotState) => void;
  setSkeleton: (on: boolean) => void;
  dispose: () => void;
};

type Step = { body: string; layers: string[]; blink?: boolean };

/**
 * Les états de la visionneuse de Paul (upikat-3d/visionneuse.html), limités
 * aux clips du modèle du site vitrine. Une étape jouée une fois passe à la
 * suivante quand elle finit. Couches : yeux, moustaches et bouche, jouées par
 * familles (une seule par famille) ; la dernière disponible l'emporte.
 */
const SEQUENCES: Record<MascotState, Step[]> = {
  idle: [{ body: "Idle", layers: ["Whiskers"], blink: true }],
  hello: [
    { body: "Hello", layers: ["Whiskers", "Mouth_Hello"], blink: true },
    { body: "Idle", layers: ["Whiskers"], blink: true },
  ],
  think: [
    { body: "Think_Start", layers: ["Whiskers", "Eyes_Think", "Mouth_Think"], blink: true },
    { body: "Think_Loop", layers: ["Whiskers", "Eyes_Think", "Mouth_Think"], blink: true },
  ],
  walk: [{ body: "Walk", layers: ["Whiskers"], blink: true }],
  run: [{ body: "Run", layers: ["Whiskers", "Whiskers_Run"], blink: true }],
};
const ONCE = new Set(["Hello", "Think_Start", "Think_End", "Blink", "Mouth_Hello"]);
const family = (name: string) => (name.startsWith("Eyes_") ? "eyes" : name.startsWith("Whiskers") ? "whiskers" : "mouth");

/** Fond des rendus et des vidéos d'Upikat (celui de ses planches). */
export const MASCOT_STAGE = "#f1f7fc";

/**
 * Upikat manipulable (UpikaJob, 29 oct. 2026) : le modèle allégé du site
 * vitrine, éclairé comme dans la visionneuse de Paul (ciel au dessous sombre,
 * lumière principale qui projette des ombres, ombre portée au sol), vue de
 * trois quarts.
 *
 * - On le fait tourner à la souris ou du doigt, à l'horizontale (le
 *   défilement vertical de la page reste libre au toucher), sans zoom.
 * - Le rendu ne tourne qu'à l'écran et onglet visible.
 * - `still` (animations réduites) : une pose fixe par état, redessinée
 *   seulement quand on le fait tourner.
 * - Squelette : les os par-dessus un corps rendu translucide.
 *
 * Renvoie `null` si la 3D est indisponible : l'image fixe reste.
 */
export async function createMascotScene(host: HTMLElement, model: string, still: boolean): Promise<MascotScene | null> {
  const [THREE, { GLTFLoader }, { OrbitControls }, { MeshoptDecoder }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/controls/OrbitControls.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
  ]);

  let renderer: InstanceType<typeof THREE.WebGLRenderer>;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "default" });
  } catch {
    return null;
  }
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 0.5s ease";
  host.appendChild(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(MASCOT_STAGE);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  camera.position.set(2.8, 1.6, 5.2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8391ab, 1.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(-3, 6.1, 6);
  key.target.position.set(0, 1.1, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 1, far: 16 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.12 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0.3, 0.98, 0);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = !still;
  controls.minPolarAngle = Math.PI * 0.32;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.update();
  // OrbitControls bloque tout défilement au toucher : on rend la verticale à la page.
  canvas.style.touchAction = "pan-y";

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  let root: Object3D;
  let animations: AnimationClip[];
  try {
    const gltf = await loader.loadAsync(model);
    root = gltf.scene;
    animations = gltf.animations;
  } catch {
    controls.dispose();
    renderer.dispose();
    canvas.remove();
    return null;
  }
  root.traverse((object) => {
    if ((object as Mesh).isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  scene.add(root);

  const mixer = new THREE.AnimationMixer(root);
  const clips = Object.fromEntries(animations.map((clip) => [clip.name, clip]));
  const skeleton = new THREE.SkeletonHelper(root);
  skeleton.setColors(new THREE.Color("#1d2f5c"), new THREE.Color("#1d2f5c"));
  skeleton.visible = false;
  scene.add(skeleton);
  const materials = new Map<Material, { transparent: boolean; opacity: number; depthWrite: boolean }>();
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    for (const material of ([] as Material[]).concat(mesh.material)) {
      materials.set(material, { transparent: material.transparent, opacity: material.opacity, depthWrite: material.depthWrite });
    }
  });

  // --- Lecture des états ----------------------------------------------------
  let body: AnimationAction | null = null;
  let stepAction: AnimationAction | null = null;
  let queue: Step[] = [];
  const layers: Record<string, AnimationAction | null> = {};
  let blinkTimer = 0;
  let dirty = true;

  const start = (name: string, fade = 0.3) => {
    const action = mixer.clipAction(clips[name]);
    action.reset().setLoop(ONCE.has(name) ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = true;
    action.fadeIn(fade).play();
    return action;
  };
  const setLayers = (names: string[]) => {
    const wanted: Record<string, string> = {};
    for (const name of names) if (clips[name]) wanted[family(name)] = name;
    for (const key of ["eyes", "whiskers", "mouth"]) {
      const current = layers[key];
      if (current && current.getClip().name === wanted[key]) continue;
      current?.fadeOut(0.3);
      layers[key] = wanted[key] ? start(wanted[key]) : null;
    }
  };
  const setBlink = (on: boolean) => {
    window.clearTimeout(blinkTimer);
    if (!on || still || !clips.Blink) return;
    const blink = () => {
      mixer.clipAction(clips.Blink).reset().setLoop(THREE.LoopOnce, 1).play();
      blinkTimer = window.setTimeout(blink, 2000 + Math.random() * 4000);
    };
    blinkTimer = window.setTimeout(blink, 800);
  };
  const runStep = () => {
    const step = queue.shift();
    if (!step || !clips[step.body]) return;
    const next = start(step.body);
    if (body && body !== next) body.fadeOut(0.3);
    body = stepAction = next;
    setLayers(step.layers);
    setBlink(Boolean(step.blink));
  };
  mixer.addEventListener("finished", (event) => {
    if (event.action === stepAction) runStep();
  });

  const play = (state: MascotState) => {
    if (still) {
      // Pose fixe : le milieu de la dernière étape (la boucle de l'état).
      mixer.stopAllAction();
      const step = SEQUENCES[state][SEQUENCES[state].length - 1];
      for (const name of [step.body, ...step.layers]) {
        const clip = clips[name];
        if (!clip) continue;
        const action = mixer.clipAction(clip);
        action.reset().play();
        action.time = clip.duration / 2;
      }
      mixer.update(0);
      dirty = true;
      return;
    }
    queue = SEQUENCES[state].map((step) => ({ ...step }));
    runStep();
  };

  const setSkeleton = (on: boolean) => {
    skeleton.visible = on;
    materials.forEach((saved, material) => {
      material.transparent = on || saved.transparent;
      material.opacity = on ? 0.28 : saved.opacity;
      material.depthWrite = on ? false : saved.depthWrite;
      material.needsUpdate = true;
    });
    dirty = true;
  };

  // --- Taille et rendu ------------------------------------------------------
  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  resize();
  const sizes = new ResizeObserver(resize);
  sizes.observe(host);
  controls.addEventListener("change", () => {
    dirty = true;
  });

  let visible = false;
  let frame = 0;
  let last = 0;
  const loop = (now: number) => {
    frame = 0;
    if (!visible || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!still) mixer.update(dt);
    controls.update();
    if (!still || dirty) {
      renderer.render(scene, camera);
      dirty = false;
    }
    frame = requestAnimationFrame(loop);
  };
  const wake = () => {
    if (!frame && visible && !document.hidden) {
      last = 0;
      frame = requestAnimationFrame(loop);
    }
  };
  const seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  });
  seen.observe(host);
  document.addEventListener("visibilitychange", wake);

  play("idle");
  renderer.render(scene, camera);
  canvas.style.opacity = "1";

  return {
    play,
    setSkeleton,
    dispose() {
      cancelAnimationFrame(frame);
      window.clearTimeout(blinkTimer);
      seen.disconnect();
      sizes.disconnect();
      document.removeEventListener("visibilitychange", wake);
      controls.dispose();
      mixer.stopAllAction();
      scene.traverse((object) => {
        const mesh = object as Mesh;
        mesh.geometry?.dispose();
        for (const material of ([] as Material[]).concat(mesh.material ?? [])) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
          material.dispose();
        }
      });
      renderer.dispose();
      canvas.remove();
    },
  };
}
