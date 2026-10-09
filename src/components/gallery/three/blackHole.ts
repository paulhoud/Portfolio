import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  Mesh,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Camera,
} from "three";

/**
 * Trou noir de la fonction cachée « destroy the world » : un horizon noir
 * cerclé de lumière, un disque d'accrétion incliné qui tourbillonne, l'arrière
 * du disque replié par la gravité en anneau autour de l'horizon, un halo
 * orangé, et un éclair blanc quand il se referme.
 *
 * Il se dessine en fond, juste après le sol et avant tout le reste : les
 * plaques et les volumes passent toujours devant lui, et le sol ne le coupe
 * jamais. Il ne fait que se montrer ; l'aspiration et la déformation des
 * objets sont calculées par la scène (cf. galleryRenderer).
 */
export type BlackHole = {
  /** À placer (position, échelle) par la scène avant `update`. */
  group: Group;
  /**
   * `size` : taille de l'horizon (0 à 1) ; `glow` : intensité du disque et du
   * halo ; `flash` : éclair final (0 à 1) ; `time` : secondes.
   */
  update(camera: Camera, size: number, glow: number, flash: number, time: number): void;
  dispose(): void;
};

/** Ordre de dessin : sol (-3), puis le trou noir, puis les objets (0). */
const ORDER = { halo: -2.3, horizon: -2.2, disk: -2.1, flash: 10 };
/** Rayon de l'horizon pour `size` = 1, dans le repère du trou. */
const HORIZON = 0.55;
/** Demi-côté du halo, dans le repère du trou. */
const HALO_HALF = 7;

export function createBlackHole(): BlackHole {
  const group = new Group();
  group.visible = false;

  // Halo orangé et anneau de lumière repliée : l'arrière du disque, dévié par
  // la gravité, reparaît en arc fin au-dessus et au-dessous de l'horizon.
  const haloMaterial = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uRing: { value: 0.1 },
      uTime: { value: 0 },
      uColor: { value: new Color("#ff7a2a") },
      uHot: { value: new Color("#ffe2b8") },
    },
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
      uniform float uRing;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uHot;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float d = length(p);
        float a = pow(max(0.0, 1.0 - d), 2.2) * 0.55 * uOpacity;
        vec3 color = uColor * a * a;
        float angle = atan(p.y, p.x);
        float ring = exp(-pow((d - uRing) / (uRing * 0.1), 2.0));
        float arcs = 0.3 + 0.7 * pow(abs(sin(angle)), 1.5);
        float bands = 0.7 + 0.3 * sin(angle * 7.0 - uTime * 3.5);
        color += uHot * ring * arcs * bands * uOpacity * 1.3;
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const halo = new Mesh(new PlaneGeometry(HALO_HALF * 2, HALO_HALF * 2), haloMaterial);
  halo.renderOrder = ORDER.halo;
  group.add(halo);

  // Horizon : noir absolu, cerclé d'un anneau de photons très fin.
  const horizon = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: { uRing: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vNormalV;
      varying vec3 vViewV;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vNormalV = normalize(normalMatrix * normal);
        vViewV = -view.xyz;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormalV;
      varying vec3 vViewV;
      uniform float uRing;
      void main() {
        float edge = 1.0 - max(dot(normalize(vNormalV), normalize(vViewV)), 0.0);
        vec3 ring = vec3(1.0, 0.78, 0.5) * pow(edge, 6.0) * 2.2 * uRing;
        gl_FragColor = vec4(ring, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const core = new Mesh(new SphereGeometry(1, 48, 32), horizon);
  core.renderOrder = ORDER.horizon;
  group.add(core);

  // Disque d'accrétion : bandes de matière qui tournent plus vite près du
  // centre, du blanc brûlant à l'orange sombre. Sa moitié arrière est cachée
  // par l'horizon (calcul exact du rayon de vue, puisque rien ici n'écrit de
  // profondeur).
  const center = new Vector3();
  const disk = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uCore: { value: center },
      uCoreRadius: { value: 0 },
      uHot: { value: new Color("#fff1d0") },
      uWarm: { value: new Color("#ff8a2a") },
      uDeep: { value: new Color("#7a1606") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vPlane;
      varying vec3 vWorld;
      void main() {
        vPlane = position.xy;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vPlane;
      varying vec3 vWorld;
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uCore;
      uniform float uCoreRadius;
      uniform vec3 uHot;
      uniform vec3 uWarm;
      uniform vec3 uDeep;
      void main() {
        // Derrière l'horizon ? Le rayon de l'œil au point touche la sphère avant lui.
        vec3 ray = vWorld - cameraPosition;
        float len = length(ray);
        ray /= len;
        vec3 oc = cameraPosition - uCore;
        float b = dot(oc, ray);
        float h = b * b - (dot(oc, oc) - uCoreRadius * uCoreRadius);
        if (h > 0.0) {
          float hit = -b - sqrt(h);
          if (hit > 0.0 && hit < len) discard;
        }
        float radius = length(vPlane);
        float angle = atan(vPlane.y, vPlane.x);
        // Rotation différentielle : l'intérieur tourne plus vite.
        float swirl = angle + uTime * (2.4 / radius) + log(radius) * 3.0;
        float bands = 0.55 + 0.45 * sin(swirl * 5.0) * sin(swirl * 2.0 + radius * 4.0);
        float inner = smoothstep(1.25, 1.6, radius);
        float outer = 1.0 - smoothstep(2.4, 4.2, radius);
        float heat = 1.0 - smoothstep(1.3, 3.8, radius);
        vec3 color = mix(uDeep, mix(uWarm, uHot, smoothstep(0.55, 1.0, heat)), heat);
        float alpha = bands * inner * outer * uOpacity;
        gl_FragColor = vec4(color * alpha * 1.6, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const ring = new Mesh(new RingGeometry(1.2, 4.3, 160, 1), disk);
  // Incliné comme on se le figure : on le voit presque par la tranche.
  ring.rotation.set(-1.18, 0.15, 0.2);
  ring.renderOrder = ORDER.disk;
  group.add(ring);

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
      const radius = HORIZON * size;
      core.scale.setScalar(Math.max(0.0001, radius));
      center.copy(group.position);
      disk.uniforms.uCoreRadius.value = radius * group.scale.x;
      ring.scale.setScalar(Math.max(0.0001, HORIZON * Math.max(size, glow * 0.4)));
      disk.uniforms.uTime.value = time;
      disk.uniforms.uOpacity.value = glow;
      const haloScale = Math.max(0.0001, 0.4 + 0.6 * size);
      halo.scale.setScalar(haloScale);
      haloMaterial.uniforms.uOpacity.value = glow;
      haloMaterial.uniforms.uTime.value = time;
      haloMaterial.uniforms.uRing.value = Math.max(0.001, (radius * 1.2) / (HALO_HALF * haloScale));
      flashPlane.scale.setScalar(Math.max(0.0001, 0.2 + flash));
      flashMaterial.uniforms.uOpacity.value = flash;
    },
    dispose() {
      core.geometry.dispose();
      horizon.dispose();
      ring.geometry.dispose();
      disk.dispose();
      halo.geometry.dispose();
      haloMaterial.dispose();
      flashPlane.geometry.dispose();
      flashMaterial.dispose();
    },
  };
}
