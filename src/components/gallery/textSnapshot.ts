/**
 * Photographie du texte de l'accueil, pour que le trou noir puisse vraiment
 * le tordre (une transformation CSS ne sait que l'étirer en bloc).
 *
 * Le texte est redessiné à l'identique sur un canevas transparent de la
 * taille de la scène : chaque lettre à sa place exacte (mesurée dans la
 * page, espacement compris), dans sa police, sa couleur et son opacité ; les
 * fonds colorés (bouton, repères) et les pictogrammes aussi. Ce qui est
 * masqué (copies invisibles du cartel, éléments effacés) est ignoré.
 */
export async function snapshotText(root: HTMLElement, frame: DOMRect, scale: number): Promise<HTMLCanvasElement | null> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(frame.width * scale));
  canvas.height = Math.max(1, Math.round(frame.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.translate(-frame.left, -frame.top);

  // Opacité réelle et visibilité de chaque élément (ancêtres compris).
  const seen = new Map<Element, number>();
  const opacityOf = (element: Element): number => {
    const cached = seen.get(element);
    if (cached !== undefined) return cached;
    const style = getComputedStyle(element);
    let value = style.visibility === "hidden" || style.display === "none" ? 0 : Number(style.opacity);
    if (value > 0 && element !== root && element.parentElement) value *= opacityOf(element.parentElement);
    seen.set(element, value);
    return value;
  };
  /** Boîte qui rogne l'élément (débordement masqué), s'il y en a une. */
  const clipOf = (element: Element): DOMRect | null => {
    for (let node: Element | null = element; node && node !== root; node = node.parentElement) {
      const overflow = getComputedStyle(node).overflow;
      if (overflow !== "visible") return node.getBoundingClientRect();
    }
    return null;
  };

  const elements = [root, ...root.querySelectorAll<HTMLElement | SVGSVGElement>("*")];

  // 1. Fonds colorés (bouton « Voir le projet », points du repère…).
  for (const element of elements) {
    if (element === root || element instanceof SVGElement) continue;
    const style = getComputedStyle(element);
    const color = style.backgroundColor;
    if (!color || color === "transparent" || /rgba\([^)]*,\s*0\)$/.test(color)) continue;
    const alpha = opacityOf(element);
    if (alpha <= 0) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(rect.left, rect.top, rect.width, rect.height, Math.min(parseFloat(style.borderTopLeftRadius) || 0, rect.height / 2, rect.width / 2));
    ctx.fill();
  }

  // 2. Pictogrammes : chaque SVG, avec sa couleur, redessiné comme une image.
  const icons = elements.filter((element): element is SVGSVGElement => element instanceof SVGSVGElement);
  await Promise.all(
    icons.map(async (svg) => {
      const alpha = opacityOf(svg);
      const rect = svg.getBoundingClientRect();
      if (alpha <= 0 || rect.width < 1) return;
      const copy = svg.cloneNode(true) as SVGSVGElement;
      copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      copy.setAttribute("width", String(rect.width));
      copy.setAttribute("height", String(rect.height));
      copy.style.color = getComputedStyle(svg).color;
      const url = URL.createObjectURL(new Blob([copy.outerHTML], { type: "image/svg+xml" }));
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        ctx.globalAlpha = alpha;
        ctx.drawImage(image, rect.left, rect.top, rect.width, rect.height);
      } catch {
        /* pictogramme illisible : on s'en passe */
      } finally {
        URL.revokeObjectURL(url);
      }
    }),
  );

  // 3. Texte, lettre par lettre.
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const text = node.data;
    const parent = node.parentElement;
    if (!parent || !text.trim() || parent.closest("svg")) continue;
    const alpha = opacityOf(parent);
    if (alpha <= 0) continue;
    const style = getComputedStyle(parent);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = style.color;
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.textBaseline = "alphabetic";
    const upper = style.textTransform === "uppercase";
    const clip = clipOf(parent);
    ctx.save();
    if (clip) {
      ctx.beginPath();
      ctx.rect(clip.left, clip.top, clip.width, clip.height);
      ctx.clip();
    }
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (!char.trim()) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (rect.width < 0.5) continue;
      const glyph = upper ? char.toUpperCase() : char;
      const metrics = ctx.measureText(glyph);
      const ascent = metrics.fontBoundingBoxAscent ?? rect.height * 0.8;
      const descent = metrics.fontBoundingBoxDescent ?? rect.height * 0.2;
      const baseline = rect.top + (rect.height - (ascent + descent)) / 2 + ascent;
      ctx.fillText(glyph, rect.left, baseline);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  range.detach();
  return canvas;
}
