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
  type Camera,
} from "three";

/**
 * Trou noir de la fonction cachée « destroy the world » : un horizon noir
 * cerclé de lumière, un disque d'accrétion incliné qui tourbillonne, un halo
 * orangé, et un éclair blanc quand il se referme.
 *
 * Il ne fait que se montrer ; l'aspiration des objets est calculée par la
 * scène (cf. galleryRenderer).
 */
export type BlackHole = {
  group: Group;
  /**
   * `size` : taille de l'horizon (0 à 1) ; `glow` : intensité du disque et du
   * halo ; `flash` : éclair final (0 à 1) ; `time` : secondes.
   */
  update(camera: Camera, size: number, glow: number, flash: number, time: number): void;
  dispose(): void;
};

export function createBlackHole(): BlackHole {
  const group = new Group();
  group.visible = false;

  // Horizon : noir absolu, cerclé d'un anneau de photons très fin.
  const horizon = new ShaderMaterial({
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
  group.add(core);

  // Disque d'accrétion : bandes de matière qui tournent plus vite près du
  // centre, du blanc brûlant à l'orange sombre.
  const disk = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uHot: { value: new Color("#fff1d0") },
      uWarm: { value: new Color("#ff8a2a") },
      uDeep: { value: new Color("#7a1606") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vPlane;
      void main() {
        vPlane = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vPlane;
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uHot;
      uniform vec3 uWarm;
      uniform vec3 uDeep;
      void main() {
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
  group.add(ring);

  // Halo et éclair : deux plans tournés vers la caméra.
  const radial = (color: string) =>
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uOpacity: { value: 0 }, uColor: { value: new Color(color) } },
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
        uniform vec3 uColor;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float a = pow(max(0.0, 1.0 - d), 2.2) * uOpacity;
          gl_FragColor = vec4(uColor * a, a);
          #include <colorspace_fragment>
        }
      `,
    });
  const haloMaterial = radial("#ff7a2a");
  const halo = new Mesh(new PlaneGeometry(14, 14), haloMaterial);
  group.add(halo);
  const flashMaterial = radial("#ffffff");
  const flashPlane = new Mesh(new PlaneGeometry(40, 40), flashMaterial);
  group.add(flashPlane);

  return {
    group,
    update(camera, size, glow, flash, time) {
      group.visible = size > 0.001 || glow > 0.001 || flash > 0.001;
      if (!group.visible) return;
      const radius = 0.55 * size;
      core.scale.setScalar(Math.max(0.0001, radius));
      ring.scale.setScalar(Math.max(0.0001, 0.55 * Math.max(size, glow * 0.4)));
      disk.uniforms.uTime.value = time;
      disk.uniforms.uOpacity.value = glow;
      halo.lookAt(camera.position);
      halo.scale.setScalar(Math.max(0.0001, 0.4 + 0.6 * size));
      haloMaterial.uniforms.uOpacity.value = 0.55 * glow;
      flashPlane.lookAt(camera.position);
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
