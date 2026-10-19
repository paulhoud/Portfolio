"use client";

import { CursorGrid } from "@/components/motion/CursorGrid";
import { getTileLight } from "@/content/projectMedia";
import { useTheme } from "@/lib/theme";

/**
 * Fond des pages projet : une grille discrète qui s'allume sous le curseur,
 * à la couleur du projet (celle de sa tuile dans la galerie 3D et du repère
 * de la liste de l'accueil). Elle reste à l'écran pendant la lecture, sous le
 * contenu, et s'arrête avec la page (le pied de page garde son fond uni).
 */

const INK = { dark: "#f5f2f4", light: "#18171c" };

/** Mélange deux couleurs hexadécimales (part de `b` entre 0 et 1). */
function mix(a: string, b: string, amount: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) => Math.round(channel(a, i) * (1 - amount) + channel(b, i) * amount).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function ProjectBackdrop({ mediaKey }: { mediaKey: string }) {
  const [theme] = useTheme();
  const glow = getTileLight(mediaKey).glow;
  // Sur le fond clair, les teintes pâles (Archive, Yves Delorme) disparaîtraient :
  // elles sont foncées vers l'encre.
  const color = theme === "light" ? mix(glow, INK.light, 0.35) : glow;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="sticky top-0 h-[100lvh]">
        <CursorGrid
          color={color}
          gridColor={INK[theme]}
          cellSize={60}
          radius={140}
          holdTime={400}
          fadeDuration={800}
          maxOpacity={theme === "light" ? 0.65 : 0.55}
          fillOpacity={theme === "light" ? 0.1 : 0.06}
          gridOpacity={theme === "light" ? 0.06 : 0.05}
          spotlight={0.6}
          edgeFade={0.2}
          clickPulse
        />
      </div>
    </div>
  );
}
