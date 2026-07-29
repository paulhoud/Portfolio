"use client";

import Image from "next/image";
import { collectProjectMedia } from "@/components/media/collectProjectMedia";
import { MediaButton } from "@/components/media/MediaButton";
import { MediaViewerProvider } from "@/components/media/MediaViewerProvider";
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from "@/components/motion/ScrollReveal";
import type {
  Project,
  ProjectBlock,
  ProjectHeaderLogo,
  ProjectLink,
  ProjectMedia,
  ProjectSection,
} from "@/content/projects";
import { AnimatedLogo } from "./AnimatedLogo";
import { ProjectStorySection } from "./ProjectStorySection";

type ProjectDetailProps = {
  project: Project;
};

export function ProjectDetail({ project }: ProjectDetailProps) {
  const viewerMedia = collectProjectMedia(project);

  let content;
  if (project.detailVariant === "story") {
    content = <StoryProjectDetail project={project} />;
  } else if (project.detailVariant === "editorial") {
    content = <EditorialProjectDetail project={project} />;
  } else if (project.detailVariant === "case-study") {
    content = <CaseStudyProjectDetail project={project} />;
  } else {
    content = <DefaultProjectDetail project={project} />;
  }

  return <MediaViewerProvider media={viewerMedia}>{content}</MediaViewerProvider>;
}

function DefaultProjectDetail({ project }: ProjectDetailProps) {
  const hasTextSections = project.sections.length > 0;

  return (
    <article className="min-h-screen bg-[#1a1921] px-6 py-8 md:px-20 md:py-12">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <header className="flex min-h-[360px] flex-col items-center justify-center text-center md:min-h-[420px]">
            {/* Le nom du projet est porté par le h1 (lu par les moteurs et les
                lecteurs d'écran) sans modifier le rendu visuel existant. */}
            <h1 className="mb-6 max-w-[42rem] text-balance text-xl font-medium uppercase tracking-[0.06em] text-white/65 md:text-2xl">
              <span className="sr-only">{project.title} — </span>
              {project.eyebrow}
            </h1>
            <div
              className="flex h-44 w-full items-center justify-center rounded-[2rem]"
              style={{ color: project.foreground }}
            >
              <AnimatedLogo
                animation={project.animation}
                foreground={project.foreground}
                logo={project.logo}
                logoAlt={project.logoAlt}
                logoKind={project.logoKind}
                logoSize={project.logoSize}
                logoScale={project.logoScale}
                priority
              />
            </div>
            <div className="mt-6">
              <CompanySiteLink site={project.companySite} />
            </div>
          </header>
        </ScrollReveal>

        {hasTextSections ? (
          <ScrollRevealGroup className="mx-auto grid max-w-4xl gap-8 pb-20 md:gap-10">
            {project.sections.map((section) => (
              <ScrollRevealItem key={section.title} className="copy">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.04em] text-white">
                  {section.title}
                </h2>
                <p>{section.body}</p>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        ) : null}

        <ProjectMediaGallery project={project} />
      </div>
    </article>
  );
}

function CaseStudyProjectDetail({ project }: ProjectDetailProps) {
  const inlineSections = project.sectionStyle === "inline";
  const hasBlocks = Boolean(project.blocks?.length);

  return (
    <article className="min-h-screen bg-[#121212] px-6 py-8 md:px-20 md:py-12">
      <div className="mx-auto max-w-5xl">
        <ScrollRevealGroup className="mx-auto flex max-w-3xl flex-col items-center pb-12 pt-6 text-center md:pb-16 md:pt-10">
          <ScrollRevealItem className="mb-10 max-w-2xl md:mb-14">
            {/* Idem : h1 sémantique, rendu visuel inchangé. */}
            <h1 className="text-balance text-xs font-medium uppercase tracking-[0.14em] text-white/55 md:text-sm">
              <span className="sr-only">{project.title} — </span>
              {project.eyebrow}
            </h1>
            {project.detailSubtitle ? (
              <p className="mt-3 text-balance text-xs font-medium uppercase tracking-[0.14em] text-white/45 md:text-sm">
                {project.detailSubtitle}
              </p>
            ) : null}
          </ScrollRevealItem>

          {project.headerLogo ? (
            <ScrollRevealItem className="mb-12 md:mb-16">
              <CaseStudyHeaderLogo headerLogo={project.headerLogo} />
            </ScrollRevealItem>
          ) : null}

          {project.companySite ? (
            <ScrollRevealItem className="mb-12 md:mb-16">
              <CompanySiteLink site={project.companySite} />
            </ScrollRevealItem>
          ) : null}
        </ScrollRevealGroup>

        {hasBlocks ? (
          <div className="mx-auto max-w-3xl space-y-12 pb-24 md:space-y-16">
            {project.blocks?.map((block, index) => (
              <CaseStudyBlock
                key={`${block.type}-${index}`}
                block={block}
                inlineSections={inlineSections}
              />
            ))}
          </div>
        ) : (
          <>
            {project.sections.length ? (
              <ScrollRevealGroup className="mx-auto mb-16 max-w-3xl space-y-6 md:mb-20 md:space-y-8">
                {project.sections.map((section) => (
                  <ScrollRevealItem key={section.title}>
                    <CaseStudySection section={section} inline={inlineSections} />
                  </ScrollRevealItem>
                ))}
              </ScrollRevealGroup>
            ) : null}

            <ProjectMediaGallery project={project} editorial />
          </>
        )}
      </div>
    </article>
  );
}

function CaseStudyBlock({
  block,
  inlineSections,
}: {
  block: ProjectBlock;
  inlineSections: boolean;
}) {
  if (block.type === "sections") {
    return (
      <ScrollRevealGroup className="space-y-6 md:space-y-8">
        {block.sections.map((section) => (
          <ScrollRevealItem key={section.title}>
            <CaseStudySection section={section} inline={inlineSections} />
          </ScrollRevealItem>
        ))}
      </ScrollRevealGroup>
    );
  }

  if (block.type === "links") {
    return (
      <ScrollReveal>
        <ProjectLinks links={block.links} />
      </ScrollReveal>
    );
  }

  if (block.layout === "feature-grid") {
    return (
      <ScrollRevealGroup className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {block.media.map((media) => (
            <ScrollRevealItem key={media.title}>
              <MediaButton media={media} className="rounded-[0.35rem]">
                <Image
                  src={media.image}
                  alt={media.title}
                  sizes="(max-width: 768px) 45vw, 180px"
                  className="h-auto w-full rounded-[0.35rem] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
                />
              </MediaButton>
            </ScrollRevealItem>
          ))}
        </div>
        {block.caption ? (
          <ScrollRevealItem>
            <p className="text-center text-xs uppercase tracking-[0.18em] text-white/55">
              {block.caption}
            </p>
          </ScrollRevealItem>
        ) : null}
      </ScrollRevealGroup>
    );
  }

  if (block.layout === "row") {
    return (
      <ScrollRevealGroup className="grid gap-8 md:grid-cols-2 md:gap-6">
        {block.media.map((media) => (
          <ScrollRevealItem key={media.title}>
            <ProjectMediaBlock media={media} priority={false} editorial />
          </ScrollRevealItem>
        ))}
      </ScrollRevealGroup>
    );
  }

  return (
    <div className="space-y-16 md:space-y-20">
      {block.media.map((media, index) => (
        <ScrollReveal key={media.title} delay={index === 0 ? 0 : 0.04}>
          <ProjectMediaBlock media={media} priority={index < 2} editorial />
        </ScrollReveal>
      ))}
    </div>
  );
}

function CaseStudySection({
  section,
  inline,
}: {
  section: ProjectSection;
  inline: boolean;
}) {
  if (inline) {
    return (
      <p className="copy text-left text-white/80">
        <span className="font-bold uppercase tracking-[0.04em] text-white">
          {section.title}
        </span>
        <span className="text-white/45"> — </span>
        {section.body}
      </p>
    );
  }

  return (
    <div className="copy text-left text-white/80">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.04em] text-white">
        {section.title}
      </h2>
      <p>{section.body}</p>
    </div>
  );
}

function CaseStudyHeaderLogo({ headerLogo }: { headerLogo: ProjectHeaderLogo }) {
  if (headerLogo.kind === "jive-orange") {
    return (
      <div className="flex items-center justify-center gap-4 md:gap-5">
        <Image
          src="/assets/Logo-3.svg"
          alt="Jive"
          width={120}
          height={48}
          priority
          className="h-10 w-auto md:h-12"
        />
        <span aria-hidden="true" className="text-lg text-white/45 md:text-xl">
          ×
        </span>
        <span className="inline-flex h-10 items-end overflow-hidden rounded-sm bg-[#FF7900] px-2.5 pb-1.5 md:h-12 md:px-3 md:pb-2">
          <span className="text-sm font-bold lowercase tracking-tight text-white md:text-base">
            orange
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl md:h-52 md:w-52"
      />
      <Image
        src={headerLogo.src}
        alt={headerLogo.alt}
        width={headerLogo.width}
        height={headerLogo.height ?? 80}
        priority
        className={`relative ${headerLogo.className ?? "h-auto w-48"}`}
      />
    </div>
  );
}

/**
 * Attributs d'ouverture d'un lien de projet. Les liens sortants (vidéos
 * YouTube, sites clients) s'ouvrent dans un nouvel onglet pour ne pas faire
 * quitter le portfolio ; les ancres internes gardent le comportement par défaut.
 */
function externalLinkProps(href: string) {
  return href.startsWith("http")
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}

/**
 * Lien vers le site officiel de l'entreprise concernée, placé sous le logo.
 * Discret par défaut : il situe le projet sans détourner de la lecture.
 */
function CompanySiteLink({ site }: { site?: ProjectLink }) {
  if (!site) return null;

  return (
    <a
      href={site.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white/80 focus-visible:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white/50"
    >
      {site.label}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
    </a>
  );
}

function ProjectLinks({ links }: { links: ProjectLink[] }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          {...externalLinkProps(link.href)}
          className="text-xs uppercase tracking-[0.18em] text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white/80"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

/**
 * Variante « récit » : la page se lit comme une progression, portée par le
 * défilement plutôt que par le volume de texte. Voir {@link ProjectStorySection}
 * pour la mise en scène.
 */
function StoryProjectDetail({ project }: ProjectDetailProps) {
  const story = project.story;
  if (!story) return <DefaultProjectDetail project={project} />;

  return (
    <article className="min-h-screen bg-[#121212] px-6 py-8 md:px-20 md:py-12">
      <div className="mx-auto max-w-6xl">
        {/* En-tête commun aux pages projet : accroche puis logo flottant.
            C'est le repère qui rattache visuellement cette page aux autres. */}
        <ScrollReveal>
          <header className="flex min-h-[360px] flex-col items-center justify-center text-center md:min-h-[420px]">
            <h1 className="mb-6 max-w-[42rem] text-balance text-xl font-medium uppercase tracking-[0.06em] text-white/65 md:text-2xl">
              <span className="sr-only">{project.title} — </span>
              {project.eyebrow}
            </h1>
            <div
              className="flex h-44 w-full items-center justify-center rounded-[2rem]"
              style={{ color: project.foreground }}
            >
              <AnimatedLogo
                animation={project.animation}
                foreground={project.foreground}
                logo={project.logo}
                logoAlt={project.logoAlt}
                logoKind={project.logoKind}
                logoSize={project.logoSize}
                logoScale={project.logoScale}
                priority
              />
            </div>
            <div className="mt-6">
              <CompanySiteLink site={project.companySite} />
            </div>
          </header>
        </ScrollReveal>

        {/* Vue d'ensemble, enjeu, solution, résultat : même grille de lecture
            que les autres études de cas. */}
        {project.sections.length ? (
          <ScrollRevealGroup className="mx-auto max-w-3xl space-y-6 pb-20 md:space-y-8 md:pb-28">
            {project.sections.map((section) => (
              <ScrollRevealItem key={section.title}>
                <CaseStudySection section={section} inline={project.sectionStyle === "inline"} />
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        ) : null}

        {/* À partir d'ici, la page quitte le format d'étude de cas pour dérouler
            l'histoire du produit et celle du rôle, en parallèle. */}
        <ScrollReveal>
          <p className="mx-auto max-w-3xl text-balance pb-16 text-center text-xl font-medium leading-snug text-white md:pb-24 md:text-3xl">
            {story.lead}
          </p>
        </ScrollReveal>

        <ProjectStorySection beats={story.beats} trackLabels={story.trackLabels} />

        <section className="mt-24 border-t border-white/10 pt-16 md:mt-32 md:pt-20">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/35">
                {story.closing.title}
              </h2>
              <p className="copy mt-5">{story.closing.body}</p>
            </div>
          </ScrollReveal>

          {project.media?.length ? (
            <ScrollRevealGroup className="mx-auto mt-12 grid max-w-4xl gap-8 md:mt-16 md:grid-cols-2">
              {project.media.map((media) => (
                <ScrollRevealItem key={media.title}>
                  <ProjectMediaBlock media={media} priority={false} editorial />
                </ScrollRevealItem>
              ))}
            </ScrollRevealGroup>
          ) : null}

          {story.closing.link ? (
            <ScrollReveal delay={0.06}>
              <div className="mt-14">
                <ProjectLinks links={[story.closing.link]} />
              </div>
            </ScrollReveal>
          ) : null}
        </section>
      </div>
    </article>
  );
}

function EditorialProjectDetail({ project }: ProjectDetailProps) {
  return (
    <article className="min-h-screen bg-[#121212] px-6 py-8 md:px-20 md:py-12">
      <div className="mx-auto max-w-5xl">
        <ScrollRevealGroup className="mx-auto flex max-w-3xl flex-col items-center pb-16 pt-8 text-center md:pb-24 md:pt-12">
          {/* Cette variante n'affiche pas de titre : le h1 reste accessible
              aux moteurs sans altérer la mise en page éditoriale. */}
          <h1 className="sr-only">
            {project.title} — {project.eyebrow}
          </h1>
          <ScrollRevealItem className="relative mb-10 flex flex-col items-center md:mb-14">
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl md:h-52 md:w-52"
            />
            <Image
              src={project.logo}
              alt={project.logoAlt}
              width={220}
              height={120}
              priority
              className="relative h-auto w-44 md:w-52"
            />
          </ScrollRevealItem>

          {project.companySite ? (
            <ScrollRevealItem className="mb-10 md:mb-14">
              <CompanySiteLink site={project.companySite} />
            </ScrollRevealItem>
          ) : null}

          {project.introParagraphs?.map((paragraph) => (
            <ScrollRevealItem key={paragraph} className="copy mb-6 max-w-2xl text-white/80">
              <p>{paragraph}</p>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>

        <ProjectMediaGallery project={project} editorial />
      </div>
    </article>
  );
}

function ProjectMediaGallery({
  project,
  editorial = false,
}: {
  project: Project;
  editorial?: boolean;
}) {
  return (
    <section
      aria-label="Visuels du projet"
      className={editorial ? "space-y-16 pb-24 md:space-y-24" : "space-y-8 pb-20"}
    >
      {project.media?.length ? (
        project.media.map((media, index) => (
          <ScrollReveal key={media.title} delay={index === 0 ? 0 : 0.04}>
            <ProjectMediaBlock media={media} priority={index < 2} editorial={editorial} />
          </ScrollReveal>
        ))
      ) : (
        <ScrollRevealGroup className="grid gap-4 md:grid-cols-3">
          {project.gallery.map((item, index) => (
            <ScrollRevealItem
              key={item}
              className="flex aspect-[4/3] items-end overflow-hidden rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5"
            >
              <div>
                <span className="text-xs uppercase tracking-[0.18em] text-white/35">
                  0{index + 1}
                </span>
                <p className="mt-2 text-lg font-semibold text-white">{item}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      )}
    </section>
  );
}

function ProjectMediaBlock({
  media,
  priority,
  editorial = false,
}: {
  media: ProjectMedia;
  priority: boolean;
  editorial?: boolean;
}) {
  const widthClass = {
    narrow: "max-w-[480px]",
    regular: "max-w-[720px]",
    wide: "max-w-5xl",
  }[media.size ?? "regular"];

  const isLightVariant = media.variant === "light";

  return (
    <figure className={`mx-auto ${widthClass}`}>
      <MediaButton media={media}>
        <div
          className={
            isLightVariant
              ? "overflow-hidden rounded-[0.35rem] bg-white px-4 py-6 md:px-8 md:py-8"
              : undefined
          }
        >
          <Image
            src={media.image}
            alt={media.title}
            priority={priority}
            sizes="(max-width: 768px) 92vw, 1000px"
            // Visuels de projet : la qualité par défaut (75) marque trop les
            // captures d'interface et les aplats.
            quality={92}
            className={`h-auto w-full ${
              isLightVariant ? "" : "rounded-[0.35rem] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
            }`}
          />
        </div>
      </MediaButton>
      <figcaption
        className={`mt-4 text-center text-xs uppercase tracking-[0.18em] ${
          editorial ? "text-white/55" : "text-white/35"
        }`}
      >
        {media.title}
      </figcaption>
      {media.link ? (
        <p className="mt-3 text-center">
          <a
            href={media.link.href}
            {...externalLinkProps(media.link.href)}
            className="text-xs uppercase tracking-[0.18em] text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white/80"
          >
            {media.link.label}
          </a>
        </p>
      ) : null}
    </figure>
  );
}
