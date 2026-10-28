"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { MediaButton } from "@/components/media/MediaButton";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/motion/ScrollReveal";
import type {
  ProjectStoryBeat,
  ProjectStoryPivot,
  ProjectStoryShot,
  ProjectStoryStage,
  ProjectStorySystem,
} from "@/content/projects";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

/** Deux colonnes sur grand écran : chaque cadre occupe la moitié de la colonne. */
const HALF_WIDTH = "(max-width: 768px) 92vw, 560px";

/**
 * Récit d'un projet déroulé au fil du défilement.
 *
 * Deux trajectoires avancent en parallèle : celle du produit et celle du rôle.
 * Chaque étape les montre côte à côte, si bien que leur progression conjointe se
 * lit d'elle-même. Entre deux étapes, une bascule stratégique occupe toute la
 * largeur et sort de l'axe : la rupture de rythme signale un changement de cap
 * plutôt qu'une étape de plus.
 *
 * La liste des temps forts est ouverte : ajouter une étape ou une bascule
 * revient à ajouter une entrée au catalogue, sans toucher à ce composant.
 */
export function ProjectStorySection({
  beats,
  trackLabels,
}: {
  beats: ProjectStoryBeat[];
  trackLabels: { product: string; role: string };
}) {
  return (
    <section
      aria-label="Déroulé du projet"
      className="mt-4 [--axis:0.4rem] md:mt-10 md:[--axis:0.5rem]"
    >
      <ol>
        {beats.map((beat, index) =>
          beat.type === "pivot" ? (
            <PivotBeat key={`pivot-${index}`} beat={beat} />
          ) : (
            <StageBeat key={beat.period} beat={beat} trackLabels={trackLabels} />
          ),
        )}
      </ol>
    </section>
  );
}

function StageBeat({
  beat,
  trackLabels,
}: {
  beat: { type: "stage" } & ProjectStoryStage;
  trackLabels: { product: string; role: string };
}) {
  return (
    <li className="relative pb-16 pl-8 last:pb-0 md:pb-24 md:pl-14">
      {/* L'axe est tracé étape par étape, et non d'un seul trait sur toute la
          section : il ne traverse donc jamais les bascules, dont le fond
          translucide le laissait apparaître au travers. */}
      <span
        aria-hidden="true"
        className="absolute left-[var(--axis)] top-3 bottom-0 w-px -translate-x-1/2 bg-ink/12"
      />
      {/* Le point reste hors de `ScrollReveal` : l'animation y applique un
          `transform`, qui ferait de ce bloc le référent des positions absolues.
          À l'intérieur, le point se calerait sur le texte le temps de
          l'animation, puis sauterait sur l'axe une fois celle-ci terminée. */}
      <span
        aria-hidden="true"
        className="absolute left-[var(--axis)] top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-ink/70 ring-4 ring-page"
      />

      <ScrollReveal>
        <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink/55">
          {beat.period}
        </span>

        {/* Les deux trajectoires, côte à côte : c'est leur mise en regard qui
            raconte que produit et rôle ont avancé ensemble. */}
        <div className="mt-5 grid gap-7 md:grid-cols-2 md:gap-10">
          <Track label={trackLabels.product} title={beat.product.title} body={beat.product.body} />
          <Track label={trackLabels.role} title={beat.role.title} body={beat.role.body} accent />
        </div>

        {beat.shots.length > 0 ? (
          <div className="mt-9">
            <StoryShots shots={beat.shots} layout={beat.shotLayout ?? "stage"} />
          </div>
        ) : null}
      </ScrollReveal>
    </li>
  );
}

function Track({
  label,
  title,
  body,
  accent = false,
}: {
  label: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("border-t pt-4", accent ? "border-ink/25" : "border-ink/10")}>
      <span
        className={cn(
          "block text-[0.6875rem] font-semibold uppercase tracking-[0.16em]",
          accent ? "text-ink/55" : "text-ink/55",
        )}
      >
        {label}
      </span>
      <h3 className="mt-2 text-base font-bold text-ink md:text-lg">{title}</h3>
      <p className="copy mt-2">{body}</p>
    </div>
  );
}

/** Bascule stratégique : pleine largeur, hors de l'axe, pour rompre le rythme. */
function PivotBeat({ beat }: { beat: { type: "pivot" } & ProjectStoryPivot }) {
  return (
    <li className="relative pb-16 md:pb-24">
      <ScrollReveal>
        <div className="rounded-[0.75rem] border border-ink/10 bg-ink/[0.03] px-6 py-10 text-center md:px-12 md:py-14">
          <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink/55">
            {beat.label}
          </span>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg font-medium leading-snug text-ink md:text-2xl">
            {beat.statement}
          </p>
        </div>
      </ScrollReveal>
    </li>
  );
}

/**
 * Mise en avant placée juste après l'en-tête : elle montre le produit tel qu'il
 * est aujourd'hui, avant que le récit ne remonte à ses débuts. Un visiteur qui
 * ne fait que survoler la page a ainsi vu l'essentiel dès le premier écran.
 */
export function ProjectStoryHighlight({
  label,
  title,
  body,
  shots,
}: {
  label: string;
  title: string;
  body: string;
  shots: ProjectStoryShot[];
}) {
  const [lead, ...rest] = shots;

  return (
    <section aria-label={title} className="pb-20 md:pb-28">
      <ScrollReveal>
        <div className="mx-auto mb-9 max-w-2xl text-center md:mb-12">
          <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink/55">
            {label}
          </span>
          <h2 className="mt-4 text-balance text-xl font-medium leading-snug text-ink md:text-2xl">
            {title}
          </h2>
          <p className="copy mt-4">{body}</p>
        </div>
      </ScrollReveal>

      {lead ? (
        <ScrollReveal delay={0.05}>
          <StoryShotFrame shot={lead} sizes="(max-width: 768px) 92vw, 1100px" />
        </ScrollReveal>
      ) : null}

      {rest.length > 0 ? (
        <ScrollReveal delay={0.1}>
          <div className="mt-5 grid gap-5 md:mt-6 md:grid-cols-2">
            {rest.map((shot) => (
              <StoryShotFrame key={shot.caption} shot={shot} sizes={HALF_WIDTH} />
            ))}
          </div>
        </ScrollReveal>
      ) : null}
    </section>
  );
}

const SYSTEM_LABEL = "block text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink/55";

/**
 * Chapitre du design system, entre la mise en avant et le récit (UpikaJob,
 * 28 oct. 2026) : comment le produit tient ensemble. Il avance du général au
 * particulier :
 * - la couverture du fichier, d'où il part (les premières bases, posées
 *   pendant les refontes), puis son organisation en quatre niveaux, du jeton
 *   au bloc d'interface ;
 * - les fondations (couleurs, typographie) ;
 * - trois gros plans sur des composants, chacun avec le nombre de copies
 *   qu'il remplace dans le code ;
 * - une décision et son pourquoi (avant, après), puis les composants
 *   assemblés.
 */
export function ProjectDesignSystem({ system }: { system: ProjectStorySystem }) {
  const [main, ...side] = system.zooms;
  const { decision } = system;

  return (
    <section aria-label={system.title} className="pb-20 md:pb-28">
      <ScrollReveal>
        <div className="mx-auto mb-9 max-w-2xl text-center md:mb-12">
          <span className={SYSTEM_LABEL}>{system.label}</span>
          <h2 className="mt-4 text-balance text-xl font-medium leading-snug text-ink md:text-2xl">{system.title}</h2>
          <p className="copy mt-4">{system.body}</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <StoryShotFrame shot={system.cover} sizes="(max-width: 768px) 92vw, 1100px" />
      </ScrollReveal>

      <SystemHeading>{system.origins.title}</SystemHeading>
      <ScrollReveal>
        <p className="copy -mt-2 mb-6 max-w-2xl md:mb-8">{system.origins.body}</p>
        <div className="grid gap-5 sm:grid-cols-3">
          {system.origins.shots.map((shot) => (
            <StoryShotFrame key={shot.caption} shot={shot} compact sizes="(max-width: 640px) 92vw, 360px" />
          ))}
        </div>
      </ScrollReveal>

      <SystemHeading>{system.levelsTitle}</SystemHeading>
      <ScrollRevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {system.levels.map((level, index) => (
          <ScrollRevealItem key={level.name} className="rounded-[0.75rem] border border-ink/10 bg-ink/[0.03] p-5">
            <LevelGlyph level={index} />
            <h4 className="mt-4 text-base font-bold text-ink">{level.name}</h4>
            <p className="mt-1 text-sm leading-snug text-ink/80">{level.role}</p>
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink/60">{level.items}</p>
          </ScrollRevealItem>
        ))}
      </ScrollRevealGroup>
      <ScrollReveal>
        <div className="mt-5 grid gap-5 md:mt-6 md:grid-cols-2">
          {system.foundations.map((shot) => (
            <StoryShotFrame key={shot.caption} shot={shot} sizes={HALF_WIDTH} />
          ))}
        </div>
      </ScrollReveal>

      <SystemHeading>{system.zoomsTitle}</SystemHeading>
      <div className="grid gap-8 md:grid-cols-[1.05fr_1fr] md:gap-6">
        {main ? (
          <ScrollReveal>
            <Zoom zoom={main} sizes="(max-width: 768px) 92vw, 560px" />
          </ScrollReveal>
        ) : null}
        <div className="grid content-start gap-8 md:gap-6">
          {side.map((zoom, index) => (
            <ScrollReveal key={zoom.caption} delay={0.05 * (index + 1)}>
              <Zoom zoom={zoom} sizes={HALF_WIDTH} />
            </ScrollReveal>
          ))}
        </div>
      </div>

      <ScrollReveal>
        <div className="mt-16 rounded-[0.75rem] border border-ink/10 bg-ink/[0.03] p-5 md:mt-24 md:p-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12">
            <div>
              <span className={SYSTEM_LABEL}>{decision.label}</span>
              <h3 className="mt-3 text-lg font-bold text-ink md:text-xl">{decision.title}</h3>
              <p className="copy mt-3 max-w-xl">{decision.body}</p>
            </div>
            <div className="flex gap-3">
              <FieldSample {...decision.before} />
              <FieldSample {...decision.after} />
            </div>
          </div>
          <div className="mt-8">
            <StoryShotFrame shot={decision.shot} sizes="(max-width: 768px) 92vw, 1000px" />
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="mx-auto mt-16 max-w-3xl md:mt-24">
          <StoryShotFrame shot={system.assembled} sizes="(max-width: 768px) 92vw, 768px" />
        </div>
      </ScrollReveal>
    </section>
  );
}

function SystemHeading({ children }: { children: React.ReactNode }) {
  return (
    <ScrollReveal>
      <h3 className="mb-6 mt-16 text-balance text-lg font-medium text-ink md:mb-8 md:mt-24 md:text-xl">{children}</h3>
    </ScrollReveal>
  );
}

/**
 * Repère de chaque niveau, du plus petit au plus grand : des jetons, un
 * élément, des éléments assemblés, un bloc d'interface.
 */
const levelGlyphs = [
  <>
    <circle cx="8" cy="12" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="20" cy="12" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="32" cy="12" r="2.5" fill="currentColor" stroke="none" />
  </>,
  <>
    <rect x="13" y="5" width="14" height="14" rx="3" />
  </>,
  <>
    <rect x="3" y="7" width="10" height="10" rx="2.5" />
    <rect x="15" y="7" width="10" height="10" rx="2.5" />
    <rect x="27" y="7" width="10" height="10" rx="2.5" />
  </>,
  <>
    <rect x="2" y="2" width="36" height="20" rx="3" />
    <path d="M2 8h36" />
    <rect x="6" y="11.5" width="8" height="7" rx="1.5" />
    <rect x="17" y="11.5" width="8" height="7" rx="1.5" />
  </>,
];

function LevelGlyph({ level }: { level: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 24" className="h-6 w-10 text-ink/60" fill="none" stroke="currentColor" strokeWidth="1.4">
      {levelGlyphs[level]}
    </svg>
  );
}

/** Gros plan sur un composant, et le nombre de copies qu'il remplace. */
function Zoom({ zoom, sizes }: { zoom: ProjectStorySystem["zooms"][number]; sizes: string }) {
  return (
    <div>
      <StoryShotFrame shot={zoom} sizes={sizes} />
      <p className="mt-3 flex items-baseline gap-3 border-t border-ink/10 pt-3">
        <span className="shrink-0 text-2xl font-medium tabular-nums text-ink md:text-[1.75rem]">
          ≈ <CountUp to={zoom.figure} />
        </span>
        <span className="text-[0.8125rem] leading-snug text-ink/65">{zoom.figureNote}</span>
      </p>
    </div>
  );
}

/**
 * Chiffre qui défile jusqu'à sa valeur quand il entre à l'écran (d'après Count
 * Up de React Bits). La place du chiffre final est réservée : rien ne bouge
 * autour pendant qu'il défile. Animations réduites : le chiffre reste fixe.
 */
function CountUp({ to }: { to: number }) {
  const { locale } = useTranslation();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const reduceMotion = useReducedMotion();
  const value = useMotionValue(to);
  const format = (n: number) => new Intl.NumberFormat(locale).format(Math.round(n));
  const text = useTransform(value, format);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    value.set(0);
    const controls = animate(value, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, reduceMotion, to, value]);

  return (
    <span ref={ref} className="inline-grid">
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {format(to)}
      </span>
      <motion.span className="col-start-1 row-start-1">{text}</motion.span>
    </span>
  );
}

/**
 * Bordure de champ telle que dans l'application, sur son fond blanc : avant
 * et après la décision, avec son contraste.
 */
function FieldSample({ label, color, ratio }: { label: string; color: string; ratio: string }) {
  return (
    <figure className="min-w-0 flex-1 md:w-40 md:flex-none">
      <div className="rounded-lg bg-white p-3">
        <div aria-hidden="true" className="h-9 rounded-md border bg-white" style={{ borderColor: color }} />
      </div>
      <figcaption className="mt-2 text-[0.8125rem] leading-snug text-ink/65">
        <span className="font-semibold text-ink">{label}</span> · <span className="tabular-nums">{ratio}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Présentation des captures. Le mode varie d'une étape à l'autre pour éviter
 * qu'une longue suite d'étapes ne devienne monotone.
 */
function StoryShots({
  shots,
  layout,
}: {
  shots: ProjectStoryShot[];
  layout: NonNullable<ProjectStoryStage["shotLayout"]>;
}) {
  if (layout === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:gap-5">
        {shots.map((shot) => (
          <StoryShotFrame key={shot.caption} shot={shot} ratio="square" sizes={HALF_WIDTH} />
        ))}
      </div>
    );
  }

  if (layout === "row") {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        {shots.map((shot) => (
          <StoryShotFrame key={shot.caption} shot={shot} sizes={HALF_WIDTH} />
        ))}
      </div>
    );
  }

  // « stage » : une capture dominante, la seconde en incrustation, les
  // suivantes en grille dessous. L'incrustation est rattachée à la capture
  // dominante seule : rattachée à tout le bloc, elle chevauchait la grille.
  return (
    <div>
      <div className={cn("relative", shots.length > 1 && "pb-10 pr-6 md:pb-12 md:pr-10")}>
        <StoryShotFrame shot={shots[0]} />
        {shots[1] ? (
          <div className="absolute -bottom-1 -right-1 w-[42%] md:w-[38%]">
            <StoryShotFrame shot={shots[1]} compact sizes="(max-width: 768px) 40vw, 420px" />
          </div>
        ) : null}
      </div>
      {shots.slice(2).length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {shots.slice(2).map((shot) => (
            <StoryShotFrame key={shot.caption} shot={shot} sizes={HALF_WIDTH} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Cadre des captures d'interface : une marge teintée et un filet, sans ombre,
 * sans reflet ni fausse barre de fenêtre. Il distingue un écran de logiciel
 * d'une planche ou d'une page web, et laisse toute l'attention à l'interface.
 * Réservé aux captures d'interface - une planche d'identité ou une page web
 * entière n'a rien à y gagner.
 */
function ScreenFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[0.7rem] border border-ink/10 bg-ink/[0.04] p-1.5 md:p-2">
      <div className="overflow-hidden rounded-[0.45rem] border border-ink/[0.06]">{children}</div>
    </div>
  );
}

/**
 * Cadre d'une capture. Tant que l'image n'est pas fournie, un emplacement
 * réservé tient sa place : la mise en page est déjà définitive.
 */
function StoryShotFrame({
  shot,
  compact = false,
  ratio = "wide",
  sizes = "(max-width: 768px) 92vw, 1000px",
}: {
  shot: ProjectStoryShot;
  compact?: boolean;
  ratio?: "wide" | "square";
  /**
   * Doit couvrir la largeur réelle d'affichage. Une valeur sous-estimée fait
   * choisir au navigateur une variante plus petite que le cadre, qu'il étire
   * ensuite - l'image paraît alors floue sur les écrans non retina.
   */
  sizes?: string;
}) {
  const caption = (
    // Légende en minuscules, alignée sur le bord de l'image (cf. `CAPTION`
    // dans ProjectDetail).
    <figcaption
      className={cn(
        "mt-3 text-left leading-snug text-ink/65",
        compact ? "text-[0.75rem]" : "text-[0.8125rem]",
      )}
    >
      {shot.caption}
    </figcaption>
  );

  if (shot.image) {
    // Page entière : trop haute pour être montrée en entier dans le fil. Elle
    // est plafonnée et fondue en bas - un repère visuel que la suite se
    // découvre dans la visionneuse, où elle se parcourt au défilement.
    const isTallPage = shot.image.height / shot.image.width > 1.6;
    const framed = shot.frame === "screen" && !isTallPage;

    // Un PNG est servi intact, sauf demande explicite du catalogue : voir
    // `ProjectStoryShot.optimize` pour le raisonnement et les exceptions.
    const lossless = shot.image.src.endsWith(".png") && !shot.optimize;

    const picture = (
      <Image
        src={shot.image}
        alt={shot.caption}
        sizes={sizes}
        unoptimized={lossless}
        // Les captures d'interface marquent vite la compression : on s'écarte
        // ici de la qualité par défaut (75).
        quality={92}
        className={cn(
          "w-full",
          isTallPage ? "h-[420px] object-cover object-top md:h-[520px]" : "h-auto",
        )}
      />
    );

    return (
      <figure>
        <MediaButton media={{ title: shot.caption, image: shot.image }} className="rounded-[0.7rem]">
          {framed ? (
            <ScreenFrame>{picture}</ScreenFrame>
          ) : (
            <div className="relative overflow-hidden rounded-[0.6rem] border border-ink/10 bg-ink/[0.03]">
              {picture}
              {isTallPage ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-page to-transparent"
                />
              ) : null}
            </div>
          )}
        </MediaButton>
        {caption}
      </figure>
    );
  }

  return (
    <figure>
      <div
        className={cn(
          "flex items-center justify-center rounded-[0.6rem] border border-dashed border-ink/15 bg-ink/[0.02]",
          ratio === "square" ? "aspect-square p-4" : compact ? "aspect-[4/3] p-4" : "aspect-[16/10] p-6",
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={cn("text-ink/20", compact ? "h-5 w-5" : "h-7 w-7")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
          <circle cx="8.5" cy="10" r="1.6" />
          <path d="M3.5 17l4.8-4.4a2 2 0 0 1 2.7 0l6.4 5.9M14 13.2l1.6-1.5a2 2 0 0 1 2.7 0l2.2 2" />
        </svg>
      </div>
      {caption}
    </figure>
  );
}
