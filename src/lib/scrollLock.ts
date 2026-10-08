/**
 * Bloque le défilement de la page et renvoie la fonction qui le rétablit.
 *
 * Le verrou porte sur `<html>` autant que sur `<body>` : `html` a un
 * `overflow-x: clip` (globals.css), si bien que le navigateur ne reporte plus
 * l'overflow de `<body>` sur la fenêtre. Verrouiller `<body>` seul laissait la
 * page défiler sous un menu ou une visionneuse ouverts.
 *
 * La place de la barre de défilement est conservée pendant le verrou : sans
 * cela, sa disparition élargirait la page de quelques pixels et ferait sauter
 * la mise en page à l'ouverture comme à la fermeture.
 */
export function lockPageScroll() {
  const { documentElement: html, body } = document;
  const previous = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    gutter: html.style.scrollbarGutter,
  };

  if (html.scrollHeight > html.clientHeight) html.style.scrollbarGutter = "stable";
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";

  return () => {
    html.style.overflow = previous.htmlOverflow;
    body.style.overflow = previous.bodyOverflow;
    html.style.scrollbarGutter = previous.gutter;
  };
}
