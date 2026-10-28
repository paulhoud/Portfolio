"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { TechGlyph } from "@/components/about/TechStack";
import { techById } from "@/content/techStack";
import type { SiteCopy } from "@/i18n/types";
import { cn } from "@/lib/utils";

/**
 * Schémas des cinq temps de la méthode (28 oct. 2026). Chacun montre ce que
 * le temps produit, avec les mots de son texte : rien n'y est ajouté au propos.
 * Ils prennent la teinte du temps (`--step`, posée par MethodTimeline).
 *
 * Ils apparaissent une fois, quand ils entrent à l'écran : les étiquettes en
 * fondu (sans glisser, le texte garde son lissage), les traits qui se tracent.
 * Animations réduites : tout est là d'emblée.
 */

type Figures = SiteCopy["method"]["figures"];

const ease = [0.22, 1, 0.36, 1] as const;
const appear: Variants = {
  hidden: { opacity: 0 },
  shown: (order: number) => ({ opacity: 1, transition: { duration: 0.5, ease, delay: order * 0.14 } }),
};
const draw: Variants = {
  hidden: { pathLength: 0 },
  shown: (order: number) => ({ pathLength: 1, transition: { duration: 0.6, ease, delay: order * 0.14 } }),
};

/** Le schéma entier : ses éléments se dévoilent dans l'ordre (`custom`). */
function Figure({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      initial={reduceMotion ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.45 }}
      className={cn("select-none", className)}
    >
      {children}
    </motion.div>
  );
}

/** Étiquette d'un schéma ; `strong` : l'aboutissement, à la teinte du temps. */
function Node({ children, order, strong = false, className }: { children: ReactNode; order: number; strong?: boolean; className?: string }) {
  return (
    <motion.span
      variants={appear}
      custom={order}
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-3.5 py-1.5 text-center text-[0.8125rem] font-medium leading-tight",
        strong
          ? "border-[color:var(--step)] bg-[color-mix(in_srgb,var(--step)_16%,transparent)] text-ink"
          : "border-ink/15 text-ink/80",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

/**
 * Flèche entre deux étapes d'un schéma. Par défaut vers le bas sur téléphone,
 * vers la droite au-delà ; `turn` la fixe dans un sens.
 */
function Arrow({ order, turn }: { order: number; turn?: "right" | "down" | "left" | "up" }) {
  const rotation = { right: "", down: "rotate-90", left: "rotate-180", up: "-rotate-90" };
  return (
    <svg
      viewBox="0 0 32 12"
      className={cn("h-3 w-8 shrink-0 text-[var(--step)]", turn ? rotation[turn] : "rotate-90 md:rotate-0")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path d="M1 6h28" variants={draw} custom={order} />
      <motion.path d="M25 2l4 4-4 4" variants={appear} custom={order + 0.5} />
    </svg>
  );
}

/** Comprendre : du contexte aux pistes, en passant par des hypothèses vérifiées sur le terrain. */
export function UnderstandFigure({ copy }: { copy: Figures["understand"] }) {
  return (
    // En ligne au-delà du téléphone : chaque étiquette prend sa part de la
    // largeur et passe à la ligne au besoin.
    <Figure className="flex flex-col items-center gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.5fr)] md:gap-2">
      <Node order={0}>{copy.context}</Node>
      <Arrow order={0.5} />
      <Node order={1}>{copy.hypotheses}</Node>
      <Arrow order={1.5} />
      <Node order={2} className="border-dashed">
        {copy.field}
      </Node>
      <Arrow order={2.5} />
      <motion.span variants={appear} custom={3} className="flex items-center gap-3 rounded-2xl border border-[color:var(--step)] px-4 py-3">
        {/* Trois pistes, de la plus prioritaire à la moins. */}
        <span className="flex w-10 flex-col gap-1.5">
          {[1, 0.7, 0.45].map((width, rank) => (
            <span key={width} className="flex items-center gap-1.5">
              <span className="text-[0.625rem] font-semibold tabular-nums text-[var(--step)]">{rank + 1}</span>
              <motion.span
                variants={appear}
                custom={3.3 + rank * 0.4}
                className="h-1.5 rounded-full bg-[var(--step)]"
                style={{ width: `${width * 100}%` }}
              />
            </span>
          ))}
        </span>
        <span className="max-w-[11rem] text-[0.8125rem] font-medium leading-tight text-ink">{copy.output}</span>
      </motion.span>
    </Figure>
  );
}

/** Explorer : un sujet, plusieurs directions ouvertes, une seule retenue. */
export function ExploreFigure({ copy }: { copy: Figures["explore"] }) {
  const ends = [14, 38, 62, 86];
  const kept = 1;
  // En ligne quand la place le permet, en colonne sinon (à côté du texte sur
  // tablette, sur téléphone) : selon la largeur du schéma, pas de l'écran.
  return (
    <div className="@container">
      <Figure className="flex flex-col items-center gap-2 @[30rem]:flex-row @[30rem]:justify-center @[30rem]:gap-0">
        <Node order={0}>{copy.subject}</Node>
        <div className="flex flex-col items-center @[30rem]:flex-row">
          {/* L'éventail : quatre pistes partent du sujet. */}
          <svg viewBox="0 0 80 100" preserveAspectRatio="none" className="h-16 w-16 rotate-90 @[30rem]:h-28 @[30rem]:w-20 @[30rem]:rotate-0" fill="none" strokeWidth="1.5" strokeLinecap="round">
            {ends.map((y, index) => (
              <motion.path
                key={y}
                d={`M0 50 C40 50 40 ${y} 80 ${y}`}
               
                className={index === kept ? "stroke-[var(--step)]" : "stroke-ink/25"}
                  variants={draw}
                custom={1 + index * 0.15}
              />
            ))}
          </svg>
          <div className="flex flex-col items-center gap-1.5">
            <motion.span variants={appear} custom={1.4} className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink/60">
              {copy.directions}
            </motion.span>
            <span className="flex gap-2 @[30rem]:flex-col @[30rem]:gap-2.5">
              {ends.map((y, index) => (
                <motion.span
                  key={y}
                  variants={appear}
                  custom={1.6 + index * 0.15}
                  className={cn(
                    "h-3 w-3 rounded-full border",
                    index === kept ? "border-[color:var(--step)] bg-[var(--step)]" : "border-ink/30 border-dashed",
                  )}
                />
              ))}
            </span>
          </div>
          {/* Une seule piste continue. */}
          <svg viewBox="0 0 80 100" preserveAspectRatio="none" className="h-16 w-16 rotate-90 @[30rem]:h-28 @[30rem]:w-20 @[30rem]:rotate-0" fill="none" strokeWidth="1.5" strokeLinecap="round">
            <motion.path d={`M0 ${ends[kept]} C40 ${ends[kept]} 40 50 80 50`} className="stroke-[var(--step)]" variants={draw} custom={2.4} />
          </svg>
        </div>
        <Node order={3} strong>
          {copy.chosen}
        </Node>
      </Figure>
    </div>
  );
}

/** Les quatre niveaux de fidélité, dessinés de l'esquisse au prototype. */
const fidelityDrawings = [
  // Concept : quelques traits à main levée.
  <>
    <path d="M10 18c8-6 16 4 24-2s14-4 20 0" />
    <path d="M10 30c10-4 18 2 28-1" />
    <path d="M10 42c6-3 12 1 18-1" />
    <circle cx="60" cy="38" r="8" />
  </>,
  // Wireframe : des blocs, sans contenu.
  <>
    <rect x="8" y="8" width="64" height="10" rx="2" />
    <rect x="8" y="24" width="30" height="28" rx="2" />
    <path d="M44 27h28M44 35h22M44 43h26" />
  </>,
  // Maquette : les mêmes blocs, remplis.
  <>
    <rect x="8" y="8" width="64" height="10" rx="2" className="fill-[var(--step)] stroke-none" />
    <rect x="8" y="24" width="30" height="28" rx="2" className="fill-ink/15 stroke-none" />
    <path d="M44 27h28M44 35h22" />
    <rect x="44" y="42" width="18" height="8" rx="4" className="fill-[var(--step)] stroke-none" />
  </>,
  // Prototype : la maquette, et un geste.
  <>
    <rect x="8" y="8" width="64" height="10" rx="2" className="fill-[var(--step)] stroke-none" />
    <rect x="8" y="24" width="30" height="28" rx="2" className="fill-ink/15 stroke-none" />
    <path d="M44 27h28M44 35h22" />
    <rect x="44" y="42" width="18" height="8" rx="4" className="fill-[var(--step)] stroke-none" />
    <circle cx="56" cy="46" r="7" className="stroke-[var(--step)]" />
    <path d="M58 49l6 9 2-4 4-1z" className="fill-ink stroke-none" />
  </>,
];

/** Concevoir : quatre niveaux de fidélité, chacun pour décider quelque chose. */
export function DesignFigure({ copy }: { copy: Figures["design"] }) {
  const settles = [null, copy.structure, null, copy.interaction];
  return (
    <Figure>
      <div className="mb-4 flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink/60">
        {copy.axis}
        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2 flex-1 text-[var(--step)]" fill="none" stroke="currentColor" strokeWidth="1.5">
          <motion.path d="M0 4h98" variants={draw} custom={0} />
        </svg>
      </div>
      <ol className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {copy.levels.map((level, index) => (
          <motion.li key={level} variants={appear} custom={0.5 + index * 0.5}>
            <span className="block rounded-xl border border-ink/12 p-2.5">
              <svg viewBox="0 0 80 60" className="block h-auto w-full text-ink/55" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {fidelityDrawings[index]}
              </svg>
            </span>
            <span className="mt-2 block text-[0.8125rem] font-medium leading-tight text-ink">{level}</span>
            {settles[index] ? (
              <span className="mt-1 inline-block text-[0.75rem] leading-tight text-[var(--step)]">→ {settles[index]}</span>
            ) : null}
          </motion.li>
        ))}
      </ol>
    </Figure>
  );
}

/**
 * Expérimenter : la boucle entre une idée et sa version testable, en carré
 * (idée, version, test, itération), que Claude aide à raccourcir (au centre).
 */
export function ExperimentFigure({ copy }: { copy: Figures["experiment"] }) {
  const claude = techById("claude");
  const [idea, version, tested, iterated] = copy.steps;
  return (
    <Figure className="mx-auto grid max-w-[26rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center justify-items-center gap-x-2 gap-y-4">
      <Node order={0} className="w-full">
        {idea}
      </Node>
      <Arrow order={0.5} turn="right" />
      <Node order={1} strong className="w-full">
        {version}
      </Node>

      <Arrow order={3.5} turn="up" />
      <motion.span variants={appear} custom={2.4} className="flex flex-col items-center gap-2 py-2 text-center">
        {claude ? <TechGlyph icon={claude.icon} size="chip" /> : null}
        <span className="max-w-[7rem] text-[0.75rem] font-semibold leading-tight text-ink/75">{copy.center}</span>
      </motion.span>
      <Arrow order={1.5} turn="down" />

      <Node order={3} className="w-full">
        {iterated}
      </Node>
      <Arrow order={2.5} turn="left" />
      <Node order={2} className="w-full">
        {tested}
      </Node>
    </Figure>
  );
}

/** Valider : quatre exigences à concilier, puis un suivi qui ne s'arrête pas à la livraison. */
export function ValidateFigure({ copy }: { copy: Figures["validate"] }) {
  return (
    <Figure className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-12">
      {/* Les quatre exigences, autour de la solution. */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {copy.criteria.map((criterion, index) => (
          <Node key={criterion} order={index * 0.3}>
            {criterion}
          </Node>
        ))}
        <Node order={1.5} strong className="col-span-2 row-start-2 justify-self-center">
          {copy.center}
        </Node>
      </div>

      {/* Jusqu'en production, et après. */}
      <div>
        <motion.span variants={appear} custom={2} className="block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink/60">
          {copy.trackLabel}
        </motion.span>
        <ol className="mt-4 grid grid-cols-4 gap-1.5">
          {copy.track.map((stage, index) => (
            <motion.li key={stage} variants={appear} custom={2.3 + index * 0.3}>
              <span className={cn("block h-1.5 rounded-full", index < 2 ? "bg-ink/20" : "bg-[var(--step)]")} />
              <span className={cn("mt-2 block text-[0.75rem] leading-tight", index < 2 ? "text-ink/60" : "font-medium text-ink")}>{stage}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </Figure>
  );
}
