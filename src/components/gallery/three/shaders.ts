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

  /*
   * Studio photo imaginaire que reflètent les plaques : un fond sombre en
   * dégradé, une grande boîte à lumière au-dessus et derrière l'objectif, un
   * bandeau lumineux à droite et une rampe au plafond. Ces reflets neutres
   * dessinent les arêtes, même des boîtes noires, sans couleur parasite.
   */
  vec3 studio(vec3 r) {
    vec3 color = mix(vec3(0.010, 0.010, 0.013), vec3(0.050, 0.051, 0.060), smoothstep(-0.35, 0.85, r.y));
    float key = smoothstep(0.78, 0.97, dot(r, normalize(vec3(-0.45, 0.6, 0.66))));
    float strip = smoothstep(0.92, 0.99, dot(r, normalize(vec3(0.95, 0.15, 0.27))));
    float top = smoothstep(0.86, 0.985, r.y);
    return color + vec3(1.0, 0.98, 0.95) * key * 1.3 + vec3(0.85, 0.9, 1.0) * strip * 0.65 + vec3(0.9) * top * 0.4;
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(vViewW);
    vec3 l = normalize(uLightDir);
    float ndl = max(dot(n, l), 0.0);
    float ndv = max(dot(n, v), 0.0);
    // Ciel clair, sol sombre : lumière d'ambiance qui vient d'en haut.
    float hemi = 0.5 + 0.5 * n.y;

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
    // Le boîtier est éclairé franchement (volume) ; la face imprimée reste
    // presque à plat, pour garder la tuile fidèle et lisible.
    vec3 body = casing * uExposure * (0.14 + 0.62 * ndl + 0.3 * hemi);
    vec3 print = face * (0.9 + 0.1 * ndl);
    vec3 color = mix(body, print, frontMix);

    // Vernis : reflet du studio, plus fort sur les arêtes (Fresnel), plus
    // discret sur la face imprimée.
    float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
    color += studio(reflect(-v, n)) * fresnel * (0.95 - 0.45 * frontMix);
    // Petit éclat de la lumière principale.
    color += vec3(pow(max(dot(n, normalize(l + v)), 0.0), 70.0) * 0.3);
    // Survol seulement : les arêtes s'éclairent, en blanc (la couleur du
    // projet reste au sol : sur les boîtes sombres, elle faisait un néon).
    color += vec3(0.9) * pow(1.0 - ndv, 3.0) * 0.35 * uRim;
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
  uniform float uDim;
  uniform vec3 uHole;
  uniform float uSwirl;
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
    // Trou noir : la grille s'enroule et s'étire vers lui.
    vec2 p = vWorld.xz;
    float pit = 1.0;
    if (uSwirl > 0.0) {
      vec2 d = p - uHole.xz;
      float dist = length(d);
      float twist = uSwirl * 5.0 / (1.0 + dist * 0.35);
      float cs = cos(twist);
      float sn = sin(twist);
      d = mat2(cs, -sn, sn, cs) * d * (1.0 + uSwirl * 2.5 / (1.0 + dist));
      p = uHole.xz + d;
      pit = mix(1.0, smoothstep(0.0, 3.0 + uSwirl * 6.0, dist), uSwirl);
    }
    vec3 light = vec3(0.0);
    for (int i = 0; i < PIECES; i++) {
      vec2 d = p - uPiecePos[i].xz;
      light += uPieceGlow[i] * exp(-dot(d, d) / 1.8);
    }
    float line = gridLine(p, 1.25);
    // La grille s'estompe au loin avant le brouillard, comme un projecteur au sol.
    float reach = 1.0 - smoothstep(uFogNear * 0.5, uFogFar * 0.6, vDist);
    vec3 color = (uBase + light + uGrid * line * reach * (1.0 + 1.2 * length(light))) * pit;
    color = mix(color, uFogColor, max(smoothstep(uFogNear, uFogFar, vDist), uDim));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
