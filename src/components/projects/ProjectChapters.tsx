"use client";

import Image from "next/image";
import { Poppins, Roboto } from "next/font/google";
import { useMemo, useRef, useState } from "react";
import { useFigureLoop } from "@/components/method/useFigureLoop";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type { ProjectChapter, ProjectCharter, ProjectWalkthrough } from "@/content/projects";
import { cn } from "@/lib/utils";
import { SYSTEM_LABEL } from "./ProjectStorySection";

// Polices de la charte d'Yves Delorme, pour ses seuls échantillons : sans
// préchargement, elles ne se téléchargent que sur la page qui les affiche.
const poppins = Poppins({ subsets: ["latin"], weight: ["700"], preload: false, display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400"], preload: false, display: "swap" });
const FONT_CLASS = { poppins: poppins.className, roboto: roboto.className } as const;

export function ProjectChapterBlock({ chapter }: { chapter: ProjectChapter }) {
  return chapter.type === "walkthrough" ? <WalkthroughChapter chapter={chapter} /> : <CharterChapter chapter={chapter} />;
}

function ChapterHeader({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <ScrollReveal>
      <div className="mx-auto mb-9 max-w-2xl text-center md:mb-12">
        <span className={SYSTEM_LABEL}>{label}</span>
        <h2 className="mt-4 text-balance text-xl font-medium leading-snug text-ink md:text-2xl">{title}</h2>
        <p className="copy mt-4">{body}</p>
      </div>
    </ScrollReveal>
  );
}

/** Temps d'une image dans son étape ; la dernière, le résultat, reste plus longtemps. */
const FRAME_MS = 1100;
const RESULT_MS = 3400;

/**
 * Le produit pas à pas : les images de chaque étape s'enchaînent en fondu,
 * comme les plans d'un film, et la liste des étapes suit (un trait se remplit
 * le long de l'étape en cours). Un clic mène à une étape ; le survol de la
 * liste arrête le défilement, le temps de lire. Animations réduites : chaque
 * étape montre directement son résultat, rien ne défile.
 *
 * Seules les images bougent, par leur opacité ; le texte reste en place et le
 * trait est un tracé SVG (cf. `useFigureLoop`).
 */
function WalkthroughChapter({ chapter }: { chapter: ProjectWalkthrough }) {
  const ref = useRef<HTMLDivElement>(null);
  const [reading, setReading] = useState(false);
  const timeline = useMemo(
    () =>
      chapter.steps.flatMap((step, stepIndex) =>
        step.frames.map((_, frameIndex) => ({ stepIndex, frameIndex, count: step.frames.length })),
      ),
    [chapter.steps],
  );
  const durations = useMemo(
    () => timeline.map(({ frameIndex, count }) => (frameIndex === count - 1 ? RESULT_MS : FRAME_MS)),
    [timeline],
  );
  const loop = useFigureLoop(ref, durations, reading);
  const { stepIndex, frameIndex, count } = timeline[loop.phase];
  const shown = `${stepIndex}-${loop.still ? count - 1 : frameIndex}`;

  // L'image précédente reste pleine sous la nouvelle le temps du fondu : sans
  // elle, les deux images à moitié transparentes laisseraient voir le fond.
  const [layers, setLayers] = useState({ shown, under: "" });
  if (layers.shown !== shown) setLayers({ shown, under: layers.shown });

  // Écrans de téléphone (en hauteur) : un cadre étroit aux coins arrondis, et
  // plus de place pour les étapes.
  const { width, height } = chapter.steps[0].frames[0];
  const phone = height > width;

  return (
    <section aria-label={chapter.title}>
      <ChapterHeader label={chapter.label} title={chapter.title} body={chapter.body} />
      <ScrollReveal delay={0.05}>
        <div
          ref={ref}
          className={cn(
            "grid gap-8 md:items-center md:gap-12",
            phone ? "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]",
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden border border-ink/10",
              phone ? "mx-auto w-full max-w-[18rem] rounded-[1.75rem] bg-black" : "rounded-[0.35rem] bg-white",
            )}
            style={{ aspectRatio: `${width} / ${height}` }}
          >
            {chapter.steps.map((step, s) =>
              step.frames.map((frame, f) => {
                const key = `${s}-${f}`;
                return (
                  <Image
                    key={key}
                    src={frame}
                    alt={key === shown ? step.title : ""}
                    aria-hidden={key !== shown}
                    fill
                    sizes={phone ? "288px" : "(max-width: 768px) 92vw, 600px"}
                    quality={90}
                    className={cn(
                      "object-cover",
                      key === shown
                        ? "z-10 opacity-100 transition-opacity duration-500 ease-out"
                        : key === layers.under
                          ? "opacity-100"
                          : "opacity-0",
                    )}
                  />
                );
              }),
            )}
          </div>

          <div>
            <ol
              onPointerEnter={(event) => event.pointerType === "mouse" && setReading(true)}
              onPointerLeave={() => setReading(false)}
            >
              {chapter.steps.map((step, s) => {
                const active = s === stepIndex;
                // Part de l'étape déjà jouée : le trait atteint chaque palier
                // en même temps que l'image correspondante se termine.
                const filled = active ? (loop.still ? 1 : (frameIndex + 1) / count) : 0;
                return (
                  <li key={step.title} className="relative">
                    <svg aria-hidden className="absolute inset-y-0 left-0 h-full w-0.5 overflow-visible">
                      <line x1="1" y1="0" x2="1" y2="100%" className="stroke-ink/12" strokeWidth={2} />
                      <line
                        x1="1"
                        y1="0"
                        x2="1"
                        y2="100%"
                        pathLength={1}
                        strokeDasharray="1 1"
                        strokeWidth={2}
                        className="stroke-ink"
                        style={{
                          strokeDashoffset: 1 - filled,
                          transition:
                            active && !loop.still
                              ? `stroke-dashoffset ${durations[loop.phase]}ms linear`
                              : "none",
                        }}
                      />
                    </svg>
                    <button
                      type="button"
                      onClick={() => loop.setPhase(timeline.findIndex((item) => item.stepIndex === s))}
                      aria-current={active ? "step" : undefined}
                      className="group flex w-full items-baseline gap-3 py-2.5 pl-5 text-left"
                    >
                      <span
                        className={cn(
                          "text-[0.6875rem] font-semibold tabular-nums tracking-[0.16em] transition-colors",
                          active ? "text-ink" : "text-ink/40",
                        )}
                      >
                        {String(s + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "text-[0.9375rem] font-semibold transition-colors",
                          active ? "text-ink" : "text-ink/55 group-hover:text-ink/80",
                        )}
                      >
                        {step.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {/* Tous les textes dans la même case : elle prend la hauteur du plus
                long, et rien ne bouge quand l'étape change. */}
            <div className="mt-6 grid pl-5" aria-live="polite">
              {chapter.steps.map((step, s) => (
                <p key={step.title} className={cn("copy [grid-area:1/1]", s !== stepIndex && "invisible")}>
                  {step.body}
                </p>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/**
 * La charte refaite en page : les deux gammes de couleurs (jeton et valeur
 * sous chaque nuance) et les deux polices, chacune sur un libellé de
 * l'interface. Nette à toutes les tailles, quand la planche d'origine ne
 * faisait que 732 px.
 */
function CharterChapter({ chapter }: { chapter: ProjectCharter }) {
  return (
    <section aria-label={chapter.title}>
      <ChapterHeader label={chapter.label} title={chapter.title} body={chapter.body} />
      <ScrollReveal delay={0.05}>
        <div className="space-y-10 rounded-[0.35rem] border border-ink/10 p-5 md:p-8">
          {chapter.palettes.map((palette) => (
            <div key={palette.name}>
              <h3 className={SYSTEM_LABEL}>{palette.name}</h3>
              <ul className="mt-4 grid grid-cols-5 gap-x-3 gap-y-5 sm:grid-cols-9">
                {palette.swatches.map((swatch) => (
                  <li key={swatch.token}>
                    <span
                      className="block aspect-square rounded-[0.35rem] border border-ink/10"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="mt-2 block text-[0.75rem] font-semibold text-ink">{swatch.token}</span>
                    <span className="block text-[0.6875rem] uppercase tabular-nums text-ink/55">{swatch.hex}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="grid gap-4 border-t border-ink/10 pt-8 md:grid-cols-2">
            {chapter.fonts.map((font) => (
              <div key={font.name} className="rounded-[0.35rem] bg-ink/[0.04] p-5 md:p-6">
                <p className="flex items-baseline justify-between gap-4">
                  <span className="text-[0.8125rem] font-semibold text-ink">{font.name}</span>
                  <span className={SYSTEM_LABEL}>{font.role}</span>
                </p>
                <p className={cn(FONT_CLASS[font.family], "mt-5 text-5xl leading-none text-ink")}>Aa</p>
                <p className={cn(FONT_CLASS[font.family], "mt-4 text-2xl text-ink/80")}>{font.sample}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
