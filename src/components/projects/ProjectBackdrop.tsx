"use client";

import { CursorGrid } from "@/components/motion/CursorGrid";
import { getTileLight } from "@/content/projectMedia";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Fond des pages projet : une grille discrète qui s'allume sous le curseur,
 * à la couleur du projet (celle de sa tuile dans la galerie 3D et du repère
 * de la liste de l'accueil). Elle reste à l'écran pendant la lecture et
 * s'arrête avec la page (le pied de page garde son fond uni).
 *
 * Elle est posée par-dessus le contenu, fondue dans la page (éclaircir en
 * sombre, produit en clair : sur le texte, rien ne change) et découpée autour
 * des images. Posée dessous, elle obligeait le navigateur à ranger tout le
 * texte dans un calque transparent, lissé en gris : un texte « pixelisé »
 * sous Windows (constat de Paul, 28 oct. 2026).
 */

const INK = { dark: "#f5f2f4", light: "#18171c" };

/** Éléments de lecture au-dessus desquels la grille s'atténue. */
const TEXT = "p, h1, h2, h3, h4, li, blockquote, figcaption, dt, dd";

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
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-[1]", theme === "light" ? "mix-blend-multiply" : "mix-blend-screen")}
    >
      <div className="sticky top-0 h-[100lvh]">
        <CursorGrid
          color={color}
          gridColor={INK[theme]}
          cellSize={60}
          radius={140}
          // Traînée un peu plus courte que l'original (0,4 s + 0,8 s).
          holdTime={250}
          fadeDuration={600}
          maxOpacity={theme === "light" ? 0.65 : 0.55}
          fillOpacity={theme === "light" ? 0.1 : 0.06}
          gridOpacity={theme === "light" ? 0.06 : 0.05}
          spotlight={0.6}
          edgeFade={0.2}
          clickPulse
          // Lignes fines et diffuses : une définition simple suffit, soit
          // quatre fois moins de calcul sur les écrans haute définition.
          dpr={1}
          // Plus discrète sur le texte, pleine dans les marges ; les images restent intactes.
          quietOver={TEXT}
          quietLevel={0.3}
          holes="[data-grid-hole]"
        />
      </div>
    </div>
  );
}
