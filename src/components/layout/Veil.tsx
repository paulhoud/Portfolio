"use client";

import { useVeil } from "@/lib/immersion";

/**
 * Aplat plein écran à la couleur du projet, au-dessus de tout (en-tête
 * compris), qui couvre le passage entre la galerie 3D et une page projet.
 * Il bloque les clics le temps d'être visible, pour éviter un double départ.
 */
export function Veil() {
  const { color, visible, duration } = useVeil();

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[80]"
      style={{
        backgroundColor: color,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    />
  );
}
