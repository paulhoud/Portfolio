// @ts-check
/**
 * Génère le manifeste média des cartes de projet.
 *
 * Source de vérité : `assets/default/*` (images placeholder) et `assets/webm/*`
 * (animations). Les fichiers sont copiés vers `public/media/**` (seul dossier
 * servi par Next.js) puis appariés automatiquement par « clé normalisée ».
 *
 * Une clé est obtenue en retirant le préfixe `Minia-` / `Anim-` et l'extension,
 * puis en passant en MAJUSCULES. Cela réconcilie les différences de préfixe et
 * de casse entre les deux dossiers (ex. `Minia-MEMENTO.png` ↔ `Anim-Memento.webm`,
 * `Minia-UPIKAJOB.png` ↔ `Anim-UpikaJob.webm`).
 *
 * Lancé automatiquement via les scripts npm `predev` / `prebuild`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SOURCES = [
  { srcDir: "assets/default", pubDir: "public/media/default", slot: "placeholder", exts: [".png"] },
  { srcDir: "assets/webm", pubDir: "public/media/webm", slot: "video", exts: [".webm"] },
];

const OUTPUT = "src/content/generated/media-manifest.ts";

/** @param {string} filename */
function normalizeKey(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/^(minia|anim)-/i, "")
    .toUpperCase();
}

/** @type {Map<string, { placeholder?: string; video?: string }>} */
const entries = new Map();

for (const { srcDir, pubDir, slot, exts } of SOURCES) {
  const absSrc = path.join(ROOT, srcDir);
  const absPub = path.join(ROOT, pubDir);

  if (!fs.existsSync(absSrc)) {
    console.warn(`[media-manifest] dossier source introuvable, ignoré : ${srcDir}`);
    continue;
  }

  fs.mkdirSync(absPub, { recursive: true });

  const files = fs
    .readdirSync(absSrc)
    .filter((f) => exts.includes(path.extname(f).toLowerCase()))
    .sort();

  for (const file of files) {
    // Copie idempotente vers public/ (n'écrit que si le contenu a changé).
    const from = path.join(absSrc, file);
    const to = path.join(absPub, file);
    const changed =
      !fs.existsSync(to) || fs.statSync(from).size !== fs.statSync(to).size;
    if (changed) fs.copyFileSync(from, to);

    const key = normalizeKey(file);
    const entry = entries.get(key) ?? {};
    entry[slot] = `/${pubDir.replace(/^public\//, "")}/${file}`;
    entries.set(key, entry);
  }
}

// Ne conserve que les paires complètes (placeholder + vidéo) ; signale le reste.
/** @type {Record<string, { placeholder: string; video: string }>} */
const manifest = {};
for (const [key, entry] of [...entries].sort(([a], [b]) => a.localeCompare(b))) {
  if (entry.placeholder && entry.video) {
    manifest[key] = { placeholder: entry.placeholder, video: entry.video };
  } else {
    console.warn(
      `[media-manifest] paire incomplète pour "${key}" ` +
        `(placeholder=${entry.placeholder ?? "∅"}, video=${entry.video ?? "∅"}) — ignorée.`,
    );
  }
}

const keys = Object.keys(manifest);
const body = keys
  .map(
    (k) =>
      `  ${k}: { placeholder: ${JSON.stringify(manifest[k].placeholder)}, video: ${JSON.stringify(
        manifest[k].video,
      )} },`,
  )
  .join("\n");

const file = `// AUTO-GÉNÉRÉ par scripts/generate-media-manifest.mjs — ne pas éditer à la main.
// Régénéré automatiquement via les scripts npm \`predev\` / \`prebuild\`.

export type MediaEntry = {
  /** Image fixe affichée par défaut (placeholder de la carte). */
  placeholder: string;
  /** Animation .webm jouée au survol et en mode passif. */
  video: string;
};

export const mediaManifest = {
${body}
} satisfies Record<string, MediaEntry>;

export type MediaKey = keyof typeof mediaManifest;
`;

const absOut = path.join(ROOT, OUTPUT);
fs.mkdirSync(path.dirname(absOut), { recursive: true });
fs.writeFileSync(absOut, file, "utf8");

console.log(`[media-manifest] ${keys.length} paire(s) écrite(s) dans ${OUTPUT} : ${keys.join(", ")}`);
