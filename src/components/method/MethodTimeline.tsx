"use client";

import { motion, useScroll } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { TechGlyph } from "@/components/about/TechStack";
import { LucideIcon, type LucideName } from "@/components/icons/Lucide";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { techById } from "@/content/techStack";
import type { MethodStep, SiteCopy } from "@/i18n/types";
import { cn } from "@/lib/utils";
import { DesignFigure, ExperimentFigure, ExploreFigure, UnderstandFigure, ValidateFigure } from "./MethodFigures";

/**
 * Pictogrammes des cinq temps de la méthode.
 *
 * Dessinés au trait dans une grammaire commune (même graisse, mêmes
 * arrondis, formes géométriques abstraites) pour illustrer chaque temps sans
 * détourner l'attention du texte : loupe et indices pour comprendre, points
 * reliés pour explorer, cadres superposés pour concevoir, cube pour
 * expérimenter et construire, boucle validée pour valider et itérer.
 *
 * L'ordre suit celui des temps ; un temps supplémentaire s'afficherait sans
 * pictogramme plutôt que d'en réutiliser un à contresens. Les traits portent
 * une longueur de 1 : ils se retracent quand un temps devient le temps lu, ou
 * au survol de la carte d'ensemble.
 */
const stepGlyphs = [
  // Comprendre : observer, réunir des indices dispersés.
  <>
    <circle cx="10.5" cy="10.5" r="6.5" pathLength={1} />
    <path d="M15.5 15.5 L20.5 20.5" pathLength={1} />
    <circle cx="8.4" cy="9.6" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="11.4" cy="12.4" r="0.85" fill="currentColor" stroke="none" />
    <circle cx="12.6" cy="8.4" r="0.85" fill="currentColor" stroke="none" />
  </>,
  // Explorer : des pistes reliées, une encore ouverte.
  <>
    <path d="M6.2 16.2 L10.3 8.3" pathLength={1} />
    <path d="M12.9 7.6 L17.4 10.2" pathLength={1} />
    <path d="M18.4 12.6 L16 17" strokeDasharray="1.2 2" />
    <circle cx="5.4" cy="17.8" r="1.7" pathLength={1} />
    <circle cx="11.4" cy="6.4" r="1.7" pathLength={1} />
    <circle cx="18.9" cy="11" r="1.7" pathLength={1} />
    <circle cx="15.2" cy="18.6" r="1.7" pathLength={1} />
  </>,
  // Concevoir : versions successives qui se superposent.
  <>
    <rect x="3" y="3" width="13" height="13" rx="2.5" pathLength={1} />
    <rect x="8" y="8" width="13" height="13" rx="2.5" pathLength={1} />
  </>,
  // Expérimenter : un volume qu'on construit.
  <>
    <path d="M12 3.2 L19.8 7.6 V16.4 L12 20.8 L4.2 16.4 V7.6 Z" pathLength={1} />
    <path d="M4.2 7.6 L12 12 L19.8 7.6" pathLength={1} />
    <path d="M12 12 V20.8" pathLength={1} />
  </>,
  // Valider : la boucle des itérations, et ce qui est acquis.
  <>
    <path d="M19.6 12a7.6 7.6 0 1 1-2.2-5.4" pathLength={1} />
    <path d="M19.8 4.2 V8.4 H15.6" pathLength={1} />
    <path d="M8.6 12.3 L11 14.7 L15.4 10" pathLength={1} />
  </>,
];

export function StepGlyph({ index, className }: { index: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-[1.15rem] w-[1.15rem] md:h-[1.3rem] md:w-[1.3rem]"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {stepGlyphs[index]}
    </svg>
  );
}

/** Teinte d'un temps (cf. `--step-1` à `--step-5` dans globals.css). */
export function stepColor(index: number) {
  return { "--step": `var(--step-${index + 1})` } as CSSProperties;
}

/** Outils dont le logo est connu ; les autres (méthodes) restent en toutes lettres. */
const TOOL_LOGOS: [RegExp, string][] = [
  [/claude/i, "claude"],
  [/gpt/i, "chatgpt"],
  [/figma/i, "figma"],
  [/blender/i, "blender"],
  [/unity/i, "unity"],
];

export function toolLogo(name: string) {
  const id = TOOL_LOGOS.find(([pattern]) => pattern.test(name))?.[1];
  return id ? techById(id)?.icon : undefined;
}

/**
 * Icône Lucide d'une méthode (français ou anglais), choisie pour ce qu'elle
 * désigne. L'ordre compte : « Analyse des retours » est une analyse avant
 * d'être un retour.
 */
const TOOL_ICONS: [RegExp, LucideName][] = [
  [/entretien|interview/i, "messages-square"],
  [/analys/i, "chart-no-axes-column"],
  [/utilisateur|user test/i, "users"],
  [/^tests?$/i, "flask-conical"],
  [/benchmark/i, "scale"],
  [/veille|watch/i, "radar"],
  [/r[ée]f[ée]rence/i, "bookmark"],
  [/syst[eè]m/i, "component"],
  [/croquis|sketch/i, "pencil"],
  [/wireframe/i, "layout-template"],
  [/prototype/i, "mouse-pointer-click"],
  [/animation/i, "clapperboard"],
  [/^3d$/i, "box"],
  [/front/i, "code-xml"],
  [/it[ée]ration/i, "refresh-cw"],
  [/suivi|follow/i, "activity"],
  [/retour|feedback/i, "message-square-text"],
];

function toolIcon(name: string) {
  return TOOL_ICONS.find(([pattern]) => pattern.test(name))?.[1];
}

type Labels = { ai: string; tools: string; progress: string; figures: SiteCopy["method"]["figures"] };

/**
 * Les cinq temps de la méthode, refaits le 28 oct. 2026 (brief de Paul :
 * plus de caractère, de couleur et de variété).
 *
 * - Chaque temps a sa teinte, son grand numéro et son schéma, tiré de son
 *   texte ; la mise en page change d'un temps à l'autre (schéma pleine
 *   largeur, à côté du texte, avant ou après lui).
 * - Un repère reste visible pendant la lecture : la colonne des cinq temps
 *   sur ordinateur, une pastille en haut de l'écran sur téléphone. Le temps
 *   lu y prend sa couleur. Rien n'est imposé au défilement.
 * - Les outils cités montrent leur logo ; les méthodes, une icône Lucide de
 *   la teinte du temps.
 */
export function MethodTimeline({ steps, labels }: { steps: MethodStep[]; labels: Labels }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  // Le temps lu : le dernier dont le début a passé une ligne un peu au-dessus
  // du milieu de l'écran (le premier tant qu'aucun ne l'a passée). Mesuré à
  // chaque image de défilement, au plus.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = [...list.querySelectorAll<HTMLElement>("[data-step]")];
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * 0.45;
      let current = 0;
      items.forEach((item, index) => {
        if (item.getBoundingClientRect().top <= line) current = index;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="relative mt-20 md:mt-28 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14">
      <MethodRail steps={steps} active={active} label={labels.progress} />
      <MobileProgress steps={steps} active={active} label={labels.progress} />
      <ol ref={listRef} className="min-w-0">
        {steps.map((step, index) => (
          <MethodStepItem key={step.id} step={step} index={index} labels={labels} />
        ))}
      </ol>
    </div>
  );
}

/**
 * Colonne des cinq temps, à gauche, qui suit la lecture (ordinateur). Posée
 * sur le fond même de la page : collée en haut, elle a son propre calque, et
 * un calque transparent lisserait son texte en gris.
 *
 * Trois états nets (revus le 28 oct. 2026, l'état en cours manquait de
 * lisibilité) : le temps lu est surligné de sa teinte, pastille pleine et
 * nom en gras ; les temps passés gardent leur teinte en contour ; les temps
 * à venir restent gris. Rien ne clignote ni ne se retrace en changeant.
 */
function MethodRail({ steps, active, label }: { steps: MethodStep[]; active: number; label: string }) {
  const progress = steps.length > 1 ? active / (steps.length - 1) : 1;
  return (
    <nav aria-label={label} className="hidden lg:block">
      <div className="sticky top-28 -mx-3 px-3 py-2 [background:var(--reading-surface)_fixed]">
        <ol className="relative space-y-1">
          {/* Le fil, de la première pastille à la dernière, rempli jusqu'au temps lu. */}
          <span aria-hidden="true" className="absolute bottom-[1.375rem] left-[1.625rem] top-[1.375rem] w-px -translate-x-1/2 bg-ink/15">
            <span
              className="absolute inset-x-0 top-0 bg-[var(--step)] transition-[height,background-color] duration-500 ease-out"
              style={{ ...stepColor(active), height: `${progress * 100}%` }}
            />
          </span>
          {steps.map((step, index) => {
            const current = index === active;
            const passed = index < active;
            return (
              <li key={step.id} style={stepColor(index)}>
                <a
                  href={`#${step.id}`}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-300",
                    "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/50",
                    current ? "bg-[color-mix(in_srgb,var(--step)_14%,transparent)]" : "hover:bg-ink/[0.05]",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-300",
                      current
                        ? "border-[color:var(--step)] bg-[var(--step)] text-page"
                        : passed
                          ? "border-[color:var(--step)] text-[var(--step)] [background:var(--reading-surface)_fixed]"
                          : "border-ink/20 text-ink/50 [background:var(--reading-surface)_fixed]",
                    )}
                  >
                    <StepGlyph index={index} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-[0.625rem] font-semibold tabular-nums tracking-[0.2em] transition-colors duration-300",
                        current || passed ? "text-[var(--step)]" : "text-ink/50",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "block text-[0.8125rem] leading-tight transition-colors duration-300",
                        current ? "font-bold text-ink" : passed ? "font-semibold text-ink/75" : "font-semibold text-ink/55 group-hover:text-ink/80",
                      )}
                    >
                      {step.phase}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/**
 * Sur téléphone et tablette : une pastille collée en haut de l'écran, le
 * temps lu et cinq traits de progression. L'en-tête du site, quand il
 * réapparaît, passe par-dessus.
 */
function MobileProgress({ steps, active, label }: { steps: MethodStep[]; active: number; label: string }) {
  const step = steps[active];
  return (
    <div className="pointer-events-none sticky top-3 z-30 -mt-2 mb-10 flex justify-center lg:hidden" aria-label={label} role="status">
      <span
        className="flex items-center gap-3 rounded-full border border-ink/10 px-3.5 py-2 [background:var(--reading-surface)_fixed]"
        style={stepColor(active)}
      >
        <span className="flex gap-1" aria-hidden="true">
          {steps.map((item, index) => (
            <span
              key={item.id}
              className={cn("h-1 w-4 rounded-full transition-colors duration-500", index <= active ? "bg-[var(--step)]" : "bg-ink/15")}
              style={index <= active ? stepColor(index) : undefined}
            />
          ))}
        </span>
        <span className="flex items-center gap-1.5 text-[0.75rem] font-semibold tabular-nums text-ink">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--step)] text-page">
            <StepGlyph index={active} className="h-3 w-3" />
          </span>
          <span className="text-[var(--step)]">{String(active + 1).padStart(2, "0")}</span> · {step?.phase}
        </span>
      </span>
    </div>
  );
}

function MethodStepItem({ step, index, labels }: { step: MethodStep; index: number; labels: Labels }) {
  const figures = labels.figures;
  const body = (
    <div className="space-y-4">
      {step.body.map((paragraph) => (
        <p key={paragraph} className="copy">
          {paragraph}
        </p>
      ))}
    </div>
  );
  const figure = [
    <UnderstandFigure key="understand" copy={figures.understand} />,
    <ExploreFigure key="explore" copy={figures.explore} />,
    <DesignFigure key="design" copy={figures.design} />,
    <ExperimentFigure key="experiment" copy={figures.experiment} />,
    <ValidateFigure key="validate" copy={figures.validate} />,
  ][index];

  // Une composition par temps, pour que la page ne devienne pas une suite de
  // blocs identiques : schéma après le texte, à côté, avant, de l'autre côté,
  // puis de nouveau après.
  let content: ReactNode;
  if (index === 1) {
    content = (
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
        {body}
        {figure}
      </div>
    );
  } else if (index === 2) {
    content = (
      <>
        {figure}
        <div className="mt-10">{body}</div>
      </>
    );
  } else if (index === 3) {
    content = (
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-12">
        <div className="md:order-2">{body}</div>
        <div className="md:order-1">{figure}</div>
      </div>
    );
  } else {
    content = (
      <>
        <div className={cn(index === 0 && "md:columns-2 md:gap-10 [&_p]:break-inside-avoid")}>{body}</div>
        <div className="mt-12">{figure}</div>
      </>
    );
  }

  return (
    <li data-step={index} id={step.id} className="relative scroll-mt-28 pb-24 last:pb-0 md:pb-36" style={stepColor(index)}>
      <ScrollReveal>
        <span aria-hidden="true" className="block h-0.5 w-12 rounded-full bg-[var(--step)]" />
        <div className="mt-6 flex items-end gap-5 md:gap-7">
          <span aria-hidden="true" className="text-[4rem] font-light leading-[0.78] tabular-nums text-[var(--step)] md:text-[6rem]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 pb-0.5">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-[var(--step)]">{step.phase}</p>
            <h2 className="mt-1.5 text-balance text-2xl font-medium leading-tight text-ink md:text-3xl">{step.title}</h2>
          </div>
        </div>
        <p className="mt-7 max-w-2xl text-balance text-lg leading-snug text-ink md:text-xl">{step.lead}</p>
      </ScrollReveal>

      <ScrollReveal className="mt-10">{content}</ScrollReveal>

      <ScrollReveal className="mt-12 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-12">
        {/* Ce que l'IA apporte à ce temps : dans le déroulé, pas en annexe. */}
        <div className="relative pl-5">
          <ReadingRule />
          <p className="flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink/65">
            <LucideIcon name="sparkles" className="h-3.5 w-3.5 text-[var(--step)]" />
            {labels.ai}
          </p>
          <p className="copy mt-2">{step.ai}</p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-ink/65">
            <LucideIcon name="wrench" className="h-3.5 w-3.5 text-[var(--step)]" />
            {labels.tools}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {step.tools.map((tool) => {
              const logo = toolLogo(tool);
              const icon = logo ? undefined : toolIcon(tool);
              return (
                <li key={tool} className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-3 py-1.5 text-[0.8125rem] leading-none text-ink/80">
                  {logo ? (
                    <TechGlyph icon={logo} size="chip" />
                  ) : icon ? (
                    <LucideIcon name={icon} className="h-4 w-4 text-[var(--step)]" />
                  ) : (
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--step)]" />
                  )}
                  {tool}
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollReveal>
    </li>
  );
}

/** Filet de l'apport de l'IA, à la teinte du temps : il se remplit pendant qu'on le lit. */
function ReadingRule() {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress: read } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  return (
    <span ref={ref} aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-ink/15">
      <motion.span className="absolute inset-0 origin-top bg-[var(--step)]" style={{ scaleY: read }} />
    </span>
  );
}
