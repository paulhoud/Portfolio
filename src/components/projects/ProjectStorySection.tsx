"use client";

import Image from "next/image";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type {
  ProjectStoryBeat,
  ProjectStoryPivot,
  ProjectStoryShot,
  ProjectStoryStage,
} from "@/content/projects";
import { cn } from "@/lib/utils";

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
  // Position de l'axe, partagée par le fil et les points. Tous deux sont centrés
  // dessus par la même translation : l'alignement tient donc à toutes les
  // largeurs d'écran, sans ajustement au cas par cas.
  return (
    <section
      aria-label="Déroulé du projet"
      className="relative mt-4 [--axis:0.4rem] md:mt-10 md:[--axis:0.5rem]"
    >
      <span
        aria-hidden="true"
        className="absolute left-[var(--axis)] top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/12 to-transparent"
      />

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
      <ScrollReveal>
        <span
          aria-hidden="true"
          className="absolute left-[var(--axis)] top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/70 ring-4 ring-[#121212]"
        />

        <span className="block text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/30">
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
    <div className={cn("border-t pt-4", accent ? "border-white/25" : "border-white/10")}>
      <span
        className={cn(
          "block text-[0.55rem] font-semibold uppercase tracking-[0.24em]",
          accent ? "text-white/55" : "text-white/30",
        )}
      >
        {label}
      </span>
      <h3 className="mt-2 text-base font-bold text-white md:text-lg">{title}</h3>
      <p className="copy mt-2">{body}</p>
    </div>
  );
}

/** Bascule stratégique : pleine largeur, hors de l'axe, pour rompre le rythme. */
function PivotBeat({ beat }: { beat: { type: "pivot" } & ProjectStoryPivot }) {
  return (
    <li className="relative pb-16 md:pb-24">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-[0.75rem] border border-white/10 bg-white/[0.03] px-6 py-10 text-center md:px-12 md:py-14">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          <span className="block text-[0.55rem] font-semibold uppercase tracking-[0.28em] text-white/40">
            {beat.label}
          </span>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg font-medium leading-snug text-white md:text-2xl">
            {beat.statement}
          </p>
        </div>
      </ScrollReveal>
    </li>
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
  if (layout === "identity") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5">
        {shots.map((shot) => (
          <StoryShotFrame key={shot.caption} shot={shot} ratio="square" />
        ))}
      </div>
    );
  }

  if (layout === "row") {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        {shots.map((shot) => (
          <StoryShotFrame key={shot.caption} shot={shot} />
        ))}
      </div>
    );
  }

  // « stage » : une capture dominante, la seconde en incrustation.
  return (
    <div className={cn("relative", shots.length > 1 && "pb-10 pr-6 md:pb-12 md:pr-10")}>
      <StoryShotFrame shot={shots[0]} />
      {shots[1] ? (
        <div className="absolute -bottom-1 -right-1 w-[42%] md:w-[38%]">
          <StoryShotFrame shot={shots[1]} compact />
        </div>
      ) : null}
      {shots.slice(2).length > 0 ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {shots.slice(2).map((shot) => (
            <StoryShotFrame key={shot.caption} shot={shot} />
          ))}
        </div>
      ) : null}
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
}: {
  shot: ProjectStoryShot;
  compact?: boolean;
  ratio?: "wide" | "square";
}) {
  const caption = (
    <figcaption
      className={cn(
        "mt-3 text-center uppercase tracking-[0.18em] text-white/35",
        compact ? "text-[0.55rem]" : "text-[0.62rem]",
      )}
    >
      {shot.caption}
    </figcaption>
  );

  if (shot.image) {
    return (
      <figure>
        <div className="overflow-hidden rounded-[0.6rem] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
          <Image
            src={shot.image}
            alt={shot.caption}
            sizes="(max-width: 768px) 92vw, 720px"
            className="h-auto w-full"
          />
        </div>
        {caption}
      </figure>
    );
  }

  return (
    <figure>
      <div
        className={cn(
          "flex items-center justify-center rounded-[0.6rem] border border-dashed border-white/15 bg-white/[0.02]",
          ratio === "square" ? "aspect-square p-4" : compact ? "aspect-[4/3] p-4" : "aspect-[16/10] p-6",
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={cn("text-white/20", compact ? "h-5 w-5" : "h-7 w-7")}
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
