/**
 * Shaders de la galerie. Aucune lumière temps réel ni ombre calculée : un
 * éclairage doux, calculé à partir de l'orientation des surfaces, donne aux
 * plaques leur volume « à la Spline » (dégradé, reflet, liseré coloré).
 *
 * Les couleurs arrivent en espace linéaire ; `colorspace_fragment` convertit
 * le résultat pour l'écran.
 */

/** Sommet des plaques : normale et direction de l'œil dans la salle. */
export const slabVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vFront;
  varying float vDist;
  void main() {
    vUv = uv;
    // Normale propre à la plaque : 1 sur la face avant, décroît sur l'arrondi.
    vFront = normal.z;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // Inverse transposée : juste même quand la plaque est aplatie (relais).
    vNormalW = normalize(transpose(inverse(mat3(modelMatrix))) * normal);
    vViewW = cameraPosition - world.xyz;
    vec4 view = viewMatrix * world;
    vDist = length(view.xyz);
    gl_Position = projectionMatrix * view;
  }
`;

/**
 * Plaque : la tuile (image fixe ou animation) sur la face avant, la couleur
 * du projet sur les tranches arrondies, un reflet et un liseré lumineux.
 */
export const slabFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vFront;
  varying float vDist;
  uniform sampler2D uMap;
  uniform sampler2D uVideo;
  uniform float uHasMap;
  uniform float uMix;
  uniform vec3 uBody;
  uniform vec3 uGlow;
  uniform float uExposure;
  uniform float uRim;
  uniform float uLit;
  uniform float uSolid;
  uniform vec3 uLightDir;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(vViewW);
    vec3 l = normalize(uLightDir);
    float wrap = dot(n, l) * 0.5 + 0.5;
    float spec = pow(max(dot(n, normalize(l + v)), 0.0), 36.0);
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.6);

    vec3 still = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : uBody;
    // La vidéo arrive encodée (three ne la décode que pour ses propres
    // matériaux) : sans ce décodage, l'animation paraîtrait délavée.
    vec3 moving = sRGBTransferEOTF(texture2D(uVideo, vUv)).rgb;
    // Dégradé de studio sur la face, dans le sens de la lumière.
    float grad = clamp(0.5 + dot(vUv - 0.5, vec2(-0.5, 0.75)), 0.0, 1.0);
    vec3 face = mix(still, moving, uMix) * uExposure * mix(0.84, 1.03, grad);
    // Les satellites (uSolid) n'ont pas de face imprimée : volume uniforme.
    float frontMix = smoothstep(0.8, 0.985, vFront) * (1.0 - uSolid);

    // Le boîtier prend la couleur du pourtour de la tuile, et suit celle de
    // l'animation quand elle joue (Jive qui vire à l'orange, Fidesio qui
    // finit en noir…). Huit points près du bord, moyennés ; l'image fixe est
    // lue floutée (niveau de détail réduit) pour une couleur bien moyenne.
    vec3 casing = uBody;
    if (uSolid < 0.5 && frontMix < 0.999) {
      vec2 edge[8] = vec2[8](
        vec2(0.04, 0.04), vec2(0.5, 0.03), vec2(0.96, 0.04), vec2(0.97, 0.5),
        vec2(0.96, 0.96), vec2(0.5, 0.97), vec2(0.04, 0.96), vec2(0.03, 0.5)
      );
      vec3 edgeStill = vec3(0.0);
      vec3 edgeMoving = vec3(0.0);
      for (int i = 0; i < 8; i++) {
        edgeStill += textureLod(uMap, edge[i], 3.0).rgb;
        edgeMoving += sRGBTransferEOTF(textureLod(uVideo, edge[i], 0.0)).rgb;
      }
      casing = mix(uHasMap > 0.5 ? edgeStill / 8.0 : uBody, edgeMoving / 8.0, uMix);
    }
    vec3 body = casing * uExposure * (0.16 + 0.9 * wrap * wrap);
    vec3 color = mix(body, face, frontMix);

    // Reflet large qui glisse sur la face quand la plaque pivote.
    vec3 r = reflect(-v, n);
    float k = dot(r.xy, vec2(-0.6, 0.8));
    float sheen = smoothstep(-0.05, 0.12, k) * (1.0 - smoothstep(0.18, 0.4, k));
    color += vec3(0.06) * sheen;
    color += vec3(spec * 0.28);
    // Arête brillante plutôt que néon : la couleur du projet, adoucie de blanc.
    color += mix(vec3(0.8), uGlow, 0.45) * fresnel * (0.15 + 0.75 * uRim);
    color *= uLit;
    color = mix(color, uFogColor, smoothstep(uFogNear, uFogFar, vDist));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Sommet du sol. Le sol est un seul grand carré : la distance à l'œil se
 * calcule point par point dans le fragment, sinon elle serait celle des coins,
 * à plus de cent mètres, et le brouillard couvrirait tout.
 */
export const floorVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/**
 * Sol : grille fine en perspective qui s'efface dans le noir, et flaque de
 * lumière colorée sous chaque plaque.
 */
export const floorFragment = /* glsl */ `
  varying vec3 vWorld;
  uniform vec3 uBase;
  uniform vec3 uGrid;
  uniform vec3 uPiecePos[PIECES];
  uniform vec3 uPieceGlow[PIECES];
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;

  float gridLine(vec2 p, float step) {
    vec2 c = p / step;
    vec2 g = abs(fract(c - 0.5) - 0.5) / (fwidth(c) * 1.4);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }

  void main() {
    float vDist = length(vWorld - cameraPosition);
    vec3 light = vec3(0.0);
    for (int i = 0; i < PIECES; i++) {
      vec2 d = vWorld.xz - uPiecePos[i].xz;
      light += uPieceGlow[i] * exp(-dot(d, d) / 1.8);
    }
    float line = gridLine(vWorld.xz, 1.25);
    // La grille s'estompe au loin avant le brouillard, comme un projecteur au sol.
    float reach = 1.0 - smoothstep(uFogNear * 0.5, uFogFar * 0.6, vDist);
    vec3 color = uBase + light + uGrid * line * reach * (1.0 + 1.2 * length(light));
    color = mix(color, uFogColor, smoothstep(uFogNear, uFogFar, vDist));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
