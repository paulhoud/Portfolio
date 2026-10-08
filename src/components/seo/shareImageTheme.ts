import { readFile } from "node:fs/promises";
import path from "node:path";
import { profile } from "@/content/profile";

/**
 * Direction artistique commune aux images de partage : celle du site
 * (`src/app/opengraph-image.tsx`) et celles des projets
 * (`src/app/projects/[slug]/opengraph-image.tsx`).
 */
export const shareImageTheme = {
  background: "linear-gradient(120deg, #191820 0%, #14131a 100%)",
  text: "#f5f2f4",
  accent: "#46ebb5",
  muted: "rgba(245,242,244,0.66)",
  subtle: "rgba(245,242,244,0.42)",
  fontFamily: "Lato",
};

/**
 * Portrait en data URL. Le rendu est effectué par Satori, qui ne va pas
 * chercher les fichiers de `public/` : l'image doit lui être fournie inline.
 */
export async function readPortrait() {
  const portrait = await readFile(
    path.join(process.cwd(), "public", profile.photo.replace(/^\//, "")),
  );
  return `data:image/jpeg;base64,${portrait.toString("base64")}`;
}

/**
 * Lato, la police du site, en 400 et 700 : les deux graisses employées par les
 * images. Satori ne lit ni le WOFF2 ni les polices de `next/font`, d'où les
 * fichiers TTF de `assets/fonts/lato` (même version que Google Fonts, licence
 * OFL jointe). Sans eux, Satori retombe sur une police à graisse unique.
 */
export async function readShareFonts() {
  const dir = path.join(process.cwd(), "assets", "fonts", "lato");
  const [regular, bold] = await Promise.all([
    readFile(path.join(dir, "Lato-Regular.ttf")),
    readFile(path.join(dir, "Lato-Bold.ttf")),
  ]);

  return [
    { name: shareImageTheme.fontFamily, data: regular, weight: 400 as const, style: "normal" as const },
    { name: shareImageTheme.fontFamily, data: bold, weight: 700 as const, style: "normal" as const },
  ];
}
