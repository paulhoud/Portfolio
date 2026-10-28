"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { TechGlyph } from "@/components/about/TechStack";
import { LucideIcon } from "@/components/icons/Lucide";
import { techById } from "@/content/techStack";
import type { SiteCopy } from "@/i18n/types";
import { cn } from "@/lib/utils";
import { useFigureLoop } from "./useFigureLoop";

/**
 * Schémas des cinq temps de la méthode, animés en boucle (28 oct. 2026, brief
 * de Paul : de petites animations de motion design qui expliquent chaque
 * temps). Chacun raconte ce que son temps produit, avec les mots de son texte,
 * et a son propre mouvement :
 *
 * - Comprendre : le chemin se trace du contexte aux pistes ; les hypothèses
 *   passent l'épreuve du terrain (deux confirmées, une écartée) ; les pistes
 *   se rangent par priorité.
 * - Explorer : les directions s'ouvrent, sont sondées une à une, une seule
 *   est retenue (pas la même à chaque tour) ; on peut en choisir une soi-même.
 * - Concevoir : une interface se construit niveau de fidélité après niveau ;
 *   survoler ou toucher un niveau l'affiche.
 * - Expérimenter : un jeton fait le tour de la boucle idée, version, test,
 *   itération ; la version augmente à chaque tour.
 * - Valider : les quatre exigences sont vérifiées une à une, puis la
 *   fonctionnalité avance jusqu'en production, où son suivi s'anime.
 *
 * Le mouvement est fait de transitions de couleur et de position (jamais de
 * fondu ni de déplacement du texte, qui garde son lissage). Il ne tourne que
 * lorsque le schéma est à l'écran. Animations réduites : le schéma s'affiche
 * dans son état complet. Les schémas doublent le texte : ils sont cachés aux
 * lecteurs d'écran.
 */

type Figures = SiteCopy["method"]["figures"];
type State = "idle" | "lit" | "done";

const stateOf = (index: number, current: number): State => (index === current ? "lit" : index < current ? "done" : "idle");

/** Étiquette d'un schéma, dans l'un de ses trois états : à venir, en cours, passée. */
function Node({ state, children, className }: { state: State; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-center text-[0.8125rem] font-medium leading-tight transition-[color,background-color,border-color] duration-500",
        state === "lit" && "border-[color:var(--step)] bg-[color-mix(in_srgb,var(--step)_18%,transparent)] text-ink",
        state === "done" && "border-[color:color-mix(in_srgb,var(--step)_55%,transparent)] text-ink/85",
        state === "idle" && "border-ink/15 text-ink/55",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Flèche entre deux étiquettes : grise à venir, en pointillés qui avancent
 * pendant le passage, pleine une fois passée. Vers le bas sur téléphone, vers
 * la droite au-delà, ou dans le sens fixé par `turn`.
 */
function Arrow({ state, turn }: { state: State; turn?: "right" | "down" | "left" | "up" }) {
  const rotation = { right: "", down: "rotate-90", left: "rotate-180", up: "-rotate-90" };
  return (
    <svg
      viewBox="0 0 32 12"
      className={cn(
        "h-3 w-8 shrink-0 transition-colors duration-500",
        turn ? rotation[turn] : "rotate-90 md:rotate-0",
        state === "idle" ? "text-ink/20" : "text-[var(--step)]",
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 6h27" className={state === "lit" ? "flow-dash" : undefined} />
      <path d="M24 2l4 4-4 4" />
    </svg>
  );
}

/** Choix de la personne dans un schéma : au survol, ou au doigt pour quelques secondes. */
function usePick(hold: number) {
  const [picked, setPicked] = useState<number | null>(null);
  const release = useRef(0);
  useEffect(() => () => window.clearTimeout(release.current), []);
  const pick = (index: number, event: PointerEvent) => {
    setPicked(index);
    window.clearTimeout(release.current);
    // Au doigt, pas de sortie de survol : le choix tient quelques secondes.
    if (event.pointerType !== "mouse") release.current = window.setTimeout(() => setPicked(null), hold);
  };
  const leave = (event: PointerEvent) => {
    if (event.pointerType === "mouse") setPicked(null);
  };
  return { picked, pick, leave };
}

/* ------------------------------------------------------------------ */

const UNDERSTAND = [1400, 1400, 1900, 2400, 1800] as const;

/** Comprendre : du contexte aux pistes, en passant par des hypothèses vérifiées sur le terrain. */
export function UnderstandFigure({ copy }: { copy: Figures["understand"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const loop = useFigureLoop(ref, UNDERSTAND);
  // Dernier temps : tout est en place, le temps de le lire.
  const phase = loop.still ? 4 : loop.phase;
  const node = (index: number): State => (phase === 4 ? (index === 3 ? "lit" : "done") : stateOf(index, phase));
  const arrow = (index: number): State => (phase === 4 || phase > index + 1 ? "done" : phase === index + 1 ? "lit" : "idle");
  const tested = phase >= 2;
  // Deux hypothèses confirmées, une écartée.
  const verdicts = [true, true, false];

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="flex select-none flex-col items-center gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.5fr)] md:gap-2"
    >
      <Node state={node(0)} className="md:w-full">
        {copy.context}
      </Node>
      <Arrow state={arrow(0)} />
      <span className="flex flex-col items-center gap-1.5 md:w-full">
        <Node state={node(1)} className="w-full">
          {copy.hypotheses}
        </Node>
        <span className="flex gap-1.5">
          {verdicts.map((confirmed, index) => (
            <span
              key={index}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-500",
                !tested
                  ? phase >= 1
                    ? "border-ink/25 text-ink/55"
                    : "border-ink/10 text-ink/25"
                  : confirmed
                    ? "border-[color:var(--step)] bg-[var(--step)] text-page"
                    : "border-ink/20 text-ink/40",
              )}
              style={{ transitionDelay: tested ? `${index * 220}ms` : "0ms" }}
            >
              <LucideIcon name={!tested ? "circle-help" : confirmed ? "check" : "x"} className="h-3 w-3" strokeWidth={2.5} />
            </span>
          ))}
        </span>
      </span>
      <Arrow state={arrow(1)} />
      <Node state={node(2)} className="md:w-full">
        <LucideIcon name="users" className="h-3.5 w-3.5 shrink-0" />
        {copy.field}
      </Node>
      <Arrow state={arrow(2)} />
      <span
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-500",
          phase >= 3 ? "border-[color:var(--step)]" : "border-ink/15",
        )}
      >
        {/* Trois pistes, rangées de la plus prioritaire à la moins. */}
        <span className="flex w-12 flex-col gap-1.5">
          {[1, 0.7, 0.45].map((width, rank) => (
            <span key={width} className="flex items-center gap-1.5">
              <span className={cn("text-[0.625rem] font-semibold tabular-nums transition-colors duration-500", phase >= 3 ? "text-[var(--step)]" : "text-ink/30")}>
                {rank + 1}
              </span>
              <span
                className="h-1.5 rounded-full bg-[var(--step)] transition-[width] duration-700 ease-out"
                style={{ width: phase >= 3 ? `${width * 100}%` : "0%", transitionDelay: phase >= 3 ? `${rank * 250}ms` : "0ms" }}
              />
            </span>
          ))}
        </span>
        <span className={cn("max-w-[11rem] text-[0.8125rem] font-medium leading-tight transition-colors duration-500", phase >= 3 ? "text-ink" : "text-ink/55")}>
          {copy.output}
        </span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const EXPLORE = [1200, 1300, 850, 850, 850, 850, 2400, 1200] as const;
const ENDS = [14, 38, 62, 86];

/** Explorer : un sujet, plusieurs directions ouvertes et sondées, une seule retenue. */
export function ExploreFigure({ copy }: { copy: Figures["explore"] }) {
  const ref = useRef<HTMLDivElement>(null);
  // Une direction choisie par la personne : la boucle s'arrête dessus.
  const { picked, pick, leave } = usePick(4000);
  const loop = useFigureLoop(ref, EXPLORE, picked !== null);
  const phase = picked !== null || loop.still ? 6 : loop.phase;
  const kept = picked ?? (loop.still ? 1 : loop.cycle % ENDS.length);
  const opened = phase >= 1;
  const probing = phase >= 2 && phase <= 5 ? phase - 2 : -1;
  const decided = phase >= 6;

  return (
    <div ref={ref} aria-hidden="true" className="@container select-none" onPointerLeave={leave}>
      <div className="flex flex-col items-center gap-2 @[30rem]:flex-row @[30rem]:justify-center @[30rem]:gap-0">
        <Node state={phase === 0 ? "lit" : "done"}>{copy.subject}</Node>
        <div className="flex flex-col items-center @[30rem]:flex-row">
          {/* L'éventail : les directions s'ouvrent depuis le sujet. */}
          <svg viewBox="0 0 80 100" preserveAspectRatio="none" className="h-16 w-16 rotate-90 @[30rem]:h-28 @[30rem]:w-20 @[30rem]:rotate-0" fill="none" strokeWidth="1.5" strokeLinecap="round">
            {ENDS.map((y, index) => (
              <path
                key={y}
                d={`M0 50 C40 50 40 ${y} 80 ${y}`}
                pathLength={1}
                className={cn(
                  "transition-[stroke-dashoffset,stroke] duration-700",
                  decided ? (index === kept ? "stroke-[var(--step)]" : "stroke-ink/12") : index === probing ? "stroke-[var(--step)]" : "stroke-ink/30",
                )}
                style={{ strokeDasharray: 1, strokeDashoffset: opened ? 0 : 1, transitionDelay: opened && phase === 1 ? `${index * 120}ms` : "0ms" }}
              />
            ))}
          </svg>
          <div className="flex flex-col items-center gap-1.5">
            <span className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink/60">{copy.directions}</span>
            <span className="flex gap-2 @[30rem]:flex-col @[30rem]:gap-2.5">
              {ENDS.map((y, index) => {
                const isKept = decided && index === kept;
                return (
                  <span
                    key={y}
                    onPointerEnter={(event) => event.pointerType === "mouse" && pick(index, event)}
                    onPointerDown={(event) => pick(index, event)}
                    className={cn(
                      "h-3.5 w-3.5 cursor-pointer rounded-full border transition-colors duration-500",
                      isKept && "border-[color:var(--step)] bg-[var(--step)]",
                      decided && !isKept && "border-dashed border-ink/25",
                      // Sondée : une onde s'élargit autour.
                      !decided && index === probing && "probe-pulse border-[color:var(--step)] bg-[color-mix(in_srgb,var(--step)_45%,transparent)]",
                      !decided && probing > index && "border-[color:var(--step)]",
                      !decided && index > probing && (opened ? "border-ink/35" : "border-ink/15"),
                    )}
                  />
                );
              })}
            </span>
          </div>
          {/* Une seule direction continue jusqu'au choix. */}
          <svg viewBox="0 0 80 100" preserveAspectRatio="none" className="h-16 w-16 rotate-90 @[30rem]:h-28 @[30rem]:w-20 @[30rem]:rotate-0" fill="none" strokeWidth="1.5" strokeLinecap="round">
            <path
              d={`M0 ${ENDS[kept]} C40 ${ENDS[kept]} 40 50 80 50`}
              pathLength={1}
              className="stroke-[var(--step)] transition-[stroke-dashoffset] duration-700"
              style={{ strokeDasharray: 1, strokeDashoffset: decided ? 0 : 1, transitionDelay: decided ? "200ms" : "0ms" }}
            />
          </svg>
        </div>
        <Node state={decided ? "lit" : "idle"}>{copy.chosen}</Node>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const DESIGN = [2600, 2600, 2600, 3400] as const;

/** Les quatre niveaux de fidélité, dessinés de l'esquisse au prototype. */
const fidelityDrawings = [
  // Concept : quelques traits à main levée.
  <g key="concept">
    <path d="M14 22c10-7 20 5 30-2s18-5 26 0" />
    <path d="M14 38c13-5 22 2 35-1" />
    <path d="M14 54c8-4 15 1 23-1" />
    <circle cx="86" cy="44" r="11" />
    <path d="M78 64c6 3 12 3 18 0" />
  </g>,
  // Wireframe : des blocs, sans contenu.
  <g key="wireframe">
    <rect x="10" y="10" width="100" height="14" rx="3" />
    <rect x="10" y="32" width="46" height="40" rx="3" />
    <path d="M64 36h46M64 47h34M64 58h40" />
  </g>,
  // Maquette : les mêmes blocs, remplis.
  <g key="mockup">
    <rect x="10" y="10" width="100" height="14" rx="3" className="fill-[var(--step)] stroke-none" />
    <rect x="10" y="32" width="46" height="40" rx="3" className="fill-ink/15 stroke-none" />
    <path d="M64 36h46M64 47h34" />
    <rect x="64" y="58" width="28" height="12" rx="6" className="fill-[var(--step)] stroke-none" />
  </g>,
  // Prototype : la maquette, et un geste qui la fait réagir.
  <g key="prototype">
    <rect x="10" y="10" width="100" height="14" rx="3" className="fill-[var(--step)] stroke-none" />
    <rect x="10" y="32" width="46" height="40" rx="3" className="fill-ink/15 stroke-none" />
    <path d="M64 36h46M64 47h34" />
    <rect x="64" y="58" width="28" height="12" rx="6" className="proto-button fill-[var(--step)] stroke-none" />
    <circle cx="80" cy="64" r="9" className="proto-ripple stroke-[var(--step)]" />
    <path d="M84 66l9 13 3-6 6-2z" className="proto-cursor fill-ink stroke-none" />
  </g>,
];

/**
 * Concevoir : une interface qui se construit, niveau de fidélité après niveau.
 * Survoler ou toucher un niveau l'affiche (la boucle s'arrête dessus).
 */
export function DesignFigure({ copy }: { copy: Figures["design"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { picked, pick, leave } = usePick(5000);
  const loop = useFigureLoop(ref, DESIGN, picked !== null);
  const level = picked ?? (loop.still ? 3 : loop.phase);
  const settles = [null, copy.structure, null, copy.interaction];

  return (
    <div ref={ref} aria-hidden="true" className="grid select-none items-center gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-10" onPointerLeave={leave}>
      {/* L'aperçu : le même écran, à la fidélité affichée. */}
      <div className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-ink/12">
        {fidelityDrawings.map((drawing, index) => (
          <svg
            key={index}
            viewBox="0 0 120 80"
            className={cn("absolute inset-0 h-full w-full p-3 text-ink/60 transition-opacity duration-500", index === level ? "opacity-100" : "opacity-0")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {drawing}
          </svg>
        ))}
      </div>

      {/* Les niveaux, du moins au plus fidèle ; le fil se remplit jusqu'au niveau affiché. */}
      <div>
        <span className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink/60">
          <LucideIcon name="layout-template" className="h-3.5 w-3.5" />
          {copy.axis}
        </span>
        <ol className="relative mt-4 space-y-2">
          <span className="absolute bottom-3 left-[0.6875rem] top-3 w-px bg-ink/12">
            <span className="absolute inset-x-0 top-0 bg-[var(--step)] transition-[height] duration-500" style={{ height: `${(level / 3) * 100}%` }} />
          </span>
          {copy.levels.map((label, index) => (
            <li
              key={label}
              onPointerEnter={(event) => event.pointerType === "mouse" && pick(index, event)}
              onPointerDown={(event) => pick(index, event)}
              className="relative flex cursor-pointer items-start gap-3 py-1"
            >
              <span
                className={cn(
                  "relative mt-0.5 h-[1.375rem] w-[1.375rem] shrink-0 rounded-full border-2 transition-colors duration-500",
                  index === level ? "border-[color:var(--step)] bg-[var(--step)]" : index < level ? "border-[color:var(--step)] bg-page" : "border-ink/20 bg-page",
                )}
              />
              <span>
                <span className={cn("block text-[0.875rem] font-medium leading-tight transition-colors duration-500", index === level ? "text-ink" : "text-ink/60")}>
                  {label}
                </span>
                {settles[index] ? (
                  <span className={cn("mt-0.5 block text-[0.75rem] leading-tight transition-colors duration-500", index === level ? "text-[var(--step)]" : "text-ink/45")}>
                    → {settles[index]}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const EXPERIMENT = [1500, 1500, 1500, 1500] as const;
/** Les quatre étapes de la boucle et les flèches entre elles, sur une grille 3 × 3. */
const LOOP_CELLS = ["col-start-1 row-start-1", "col-start-3 row-start-1", "col-start-3 row-start-3", "col-start-1 row-start-3"];
const LOOP_ARROWS = [
  { turn: "right", cell: "col-start-2 row-start-1" },
  { turn: "down", cell: "col-start-3 row-start-2" },
  { turn: "left", cell: "col-start-2 row-start-3" },
  { turn: "up", cell: "col-start-1 row-start-2" },
] as const;

/**
 * Expérimenter : un jeton fait le tour de la boucle (idée, version, test,
 * itération), et la version augmente à chaque tour ; au centre, Claude, qui
 * aide à raccourcir la boucle.
 */
export function ExperimentFigure({ copy }: { copy: Figures["experiment"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const claude = techById("claude");
  const loop = useFigureLoop(ref, EXPERIMENT);
  const at = loop.phase;
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const [token, setToken] = useState<{ x: number; y: number } | null>(null);

  // Le jeton se pose sur l'étape en cours (mesurée : la grille change de taille).
  useEffect(() => {
    if (loop.still) return;
    const place = () => {
      const box = ref.current?.getBoundingClientRect();
      const node = nodes.current[at]?.getBoundingClientRect();
      if (box && node) setToken({ x: node.left - box.left + node.width / 2, y: node.top - box.top - 7 });
    };
    const frame = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
    };
  }, [at, loop.still]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative mx-auto grid max-w-[26rem] select-none grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[auto_auto_auto] items-center justify-items-center gap-x-2 gap-y-4 pt-2"
    >
      {copy.steps.map((label, index) => (
        <span
          key={label}
          ref={(element) => {
            nodes.current[index] = element;
          }}
          className={cn("w-full", LOOP_CELLS[index])}
        >
          <Node state={loop.still ? "done" : index === at ? "lit" : "idle"} className="w-full">
            {label}
          </Node>
        </span>
      ))}
      {LOOP_ARROWS.map((arrow, index) => (
        <span key={arrow.turn} className={arrow.cell}>
          <Arrow state={loop.still ? "done" : index === at ? "lit" : "idle"} turn={arrow.turn} />
        </span>
      ))}
      <span className="col-start-2 row-start-2 flex flex-col items-center gap-2 py-2 text-center">
        {claude ? <TechGlyph icon={claude.icon} size="chip" /> : null}
        <span className="max-w-[7rem] text-[0.75rem] font-semibold leading-tight text-ink/75">{copy.center}</span>
        {/* Une version de plus à chaque tour de boucle. */}
        <span className="flex items-center gap-1 rounded-full border border-[color:var(--step)] px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-[var(--step)]">
          <LucideIcon name="refresh-cw" className="h-3 w-3" />v{loop.still ? 3 : (loop.cycle % 9) + 1}
        </span>
      </span>
      {token && !loop.still ? (
        <span
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--step)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--step)_25%,transparent)] transition-[left,top] duration-1000 ease-in-out"
          style={{ left: token.x, top: token.y }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const VALIDATE = [900, 900, 900, 900, 1300, 1100, 1100, 1100, 2600, 1200] as const;
const CRITERIA_ICONS = ["users", "component", "code-xml", "chart-no-axes-column"] as const;

/**
 * Valider : les quatre exigences sont vérifiées une à une, la solution les
 * concilie, puis la fonctionnalité avance jusqu'en production, où son suivi
 * s'anime (une courbe d'activité, un retour).
 */
export function ValidateFigure({ copy }: { copy: Figures["validate"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const loop = useFigureLoop(ref, VALIDATE);
  const phase = loop.still ? 8 : loop.phase;
  const checked = Math.min(phase, 4);
  const solved = phase >= 4;
  const stage = phase >= 4 ? Math.min(phase - 4, 3) : -1;
  const living = phase >= 8;

  return (
    <div ref={ref} aria-hidden="true" className="grid select-none items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-12">
      {/* Les quatre exigences, vérifiées tour à tour, autour de la solution. */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {copy.criteria.map((criterion, index) => (
          <Node key={criterion} state={index < checked ? "done" : index === checked && phase < 4 ? "lit" : "idle"} className="w-full justify-start text-left">
            <LucideIcon
              name={index < checked ? "check" : CRITERIA_ICONS[index]}
              className={cn("h-3.5 w-3.5 shrink-0 transition-colors duration-500", index < checked && "text-[var(--step)]")}
              strokeWidth={index < checked ? 2.5 : 2}
            />
            {criterion}
          </Node>
        ))}
        <span className="col-span-2 row-start-2 flex justify-center">
          <Node state={solved ? "lit" : "idle"}>
            <LucideIcon name="circle-check-big" className={cn("h-3.5 w-3.5 transition-colors duration-500", solved && "text-[var(--step)]")} />
            {copy.center}
          </Node>
        </span>
      </div>

      {/* Jusqu'en production, et après. */}
      <div>
        <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink/60">{copy.trackLabel}</span>
        <ol className="mt-4 grid grid-cols-4 gap-1.5">
          {copy.track.map((label, index) => (
            <li key={label}>
              <span
                className={cn("block h-1.5 rounded-full transition-colors duration-500", index <= stage ? "bg-[var(--step)]" : "bg-ink/15")}
                style={{ transitionDelay: index <= stage ? "150ms" : "0ms" }}
              />
              <span className={cn("mt-2 block text-[0.75rem] leading-tight transition-colors duration-500", index === stage ? "font-medium text-ink" : index < stage ? "text-ink/75" : "text-ink/50")}>
                {label}
              </span>
            </li>
          ))}
        </ol>
        {/* En production : la fonctionnalité vit, on la suit. */}
        <div className={cn("mt-5 flex items-center gap-3 transition-colors duration-500", living ? "text-[var(--step)]" : "text-ink/15")}>
          <svg viewBox="0 0 120 24" className="h-6 w-28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M0 16h22l6-9 8 14 7-18 7 13h12l5-6 6 6h47"
              pathLength={1}
              className="transition-[stroke-dashoffset] duration-[1600ms] ease-out"
              style={{ strokeDasharray: 1, strokeDashoffset: living ? 0 : 1 }}
            />
          </svg>
          <LucideIcon name="activity" className="h-4 w-4" />
          <LucideIcon name="message-square-text" className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
