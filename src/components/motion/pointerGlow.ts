import type { PointerEvent } from "react";

const place = (event: PointerEvent<HTMLElement>) => {
  if (event.pointerType !== "mouse") return;
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  target.style.setProperty("--glow-x", `${Math.round(event.clientX - rect.left)}px`);
  target.style.setProperty("--glow-y", `${Math.round(event.clientY - rect.top)}px`);
  target.style.setProperty("--glow-o", "1");
};

/**
 * Gestes de la lueur `.pointer-glow` (globals.css), à étaler sur la carte :
 * la position du pointeur, et la lueur qui monte à l'entrée, retombe à la
 * sortie. À la souris seulement : au doigt, il n'y a rien à suivre.
 */
export const pointerGlow = {
  onPointerEnter: place,
  onPointerMove: place,
  onPointerLeave: (event: PointerEvent<HTMLElement>) => event.currentTarget.style.setProperty("--glow-o", "0"),
};
