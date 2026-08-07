"use client";

import Image from "next/image";
import { MediaButton } from "@/components/media/MediaButton";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type {
  ProjectStoryBeat,
  ProjectStoryPivot,
  ProjectStoryShot,
  ProjectStoryStage,
} from "@/content/projects";
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
        className="absolute left-[var(--axis)] top-3 bottom-0 w-px -translate-x-1/2 bg-white/12"
      />
      {/* Le point reste hors de `ScrollReveal` : l'animation y applique un
          `transform`, qui ferait de ce bloc le référent des positions absolues.
          À l'intérieur, le point se calerait sur le texte le temps de
          l'animation, puis sauterait sur l'axe une fois celle-ci terminée. */}
      <span
        aria-hidden="true"
        className="absolute left-[var(--axis)] top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/70 ring-4 ring-[#121212]"
      />

      <ScrollReveal>
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
          <span className="block text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/35">
            {label}
          </span>
          <h2 className="mt-4 text-balance text-xl font-medium leading-snug text-white md:text-2xl">
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

  // « stage » : une capture dominante, la seconde en incrustation.
  return (
    <div className={cn("relative", shots.length > 1 && "pb-10 pr-6 md:pb-12 md:pr-10")}>
      <StoryShotFrame shot={shots[0]} />
      {shots[1] ? (
        <div className="absolute -bottom-1 -right-1 w-[42%] md:w-[38%]">
          <StoryShotFrame shot={shots[1]} compact sizes="(max-width: 768px) 40vw, 420px" />
        </div>
      ) : null}
      {shots.slice(2).length > 0 ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {shots.slice(2).map((shot) => (
            <StoryShotFrame key={shot.caption} shot={shot} sizes={HALF_WIDTH} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Habillage d'écran : châssis vectoriel, net à toute résolution, qui donne aux
 * captures d'application l'allure d'un logiciel plutôt que d'une image collée.
 * Réservé aux captures d'interface — une planche d'identité ou une page web
 * entière n'a rien à y gagner.
 */
function ScreenChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Halo diffus derrière l'écran : il détache la dalle du fond et suggère
          une source lumineuse, plutôt qu'un cadre posé à plat. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -top-6 bottom-0 rounded-[2.5rem] bg-[radial-gradient(55%_50%_at_50%_45%,rgba(122,150,255,0.14),rgba(122,150,255,0.05)_45%,transparent_72%)] blur-2xl"
      />
      {/* Ombre de contact, resserrée sous l'écran : c'est elle qui donne
          l'impression que la dalle flotte au-dessus du fond. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 -bottom-4 h-10 rounded-[50%] bg-black/55 blur-2xl"
      />

      {/* Ombres empilées plutôt qu'une seule : une ombre courte et dense pour
          l'épaisseur du châssis, une longue et douce pour la profondeur. */}
      <div className="relative rounded-[0.7rem] bg-gradient-to-b from-[#34343e] to-[#1b1b21] p-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.3),0_14px_32px_rgba(0,0,0,0.34),0_52px_100px_-28px_rgba(0,0,0,0.7)]">
        <div className="overflow-hidden rounded-[0.55rem] border border-white/[0.06] bg-[#0e0e12]">
          <div className="flex h-6 items-center gap-1.5 border-b border-white/[0.06] bg-gradient-to-b from-[#2c2c34] to-[#22222a] px-3 md:h-7">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#ff5f57]/75" />
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#febc2e]/75" />
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#28c840]/75" />
          </div>
          {children}
        </div>
        {/* Reflet oblique très discret sur la dalle. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[0.7rem] bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent"
        />
      </div>
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
   * ensuite — l'image paraît alors floue sur les écrans non retina.
   */
  sizes?: string;
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
    // Page entière : trop haute pour être montrée en entier dans le fil. Elle
    // est plafonnée et fondue en bas — un repère visuel que la suite se
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
            <ScreenChrome>{picture}</ScreenChrome>
          ) : (
            <div className="relative overflow-hidden rounded-[0.6rem] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
              {picture}
              {isTallPage ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#121212] to-transparent"
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
