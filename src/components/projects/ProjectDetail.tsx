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
import { cn } from "@/lib/utils";
import { AnimatedLogo } from "./AnimatedLogo";
import { ProjectStoryHighlight, ProjectStorySection } from "./ProjectStorySection";

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
    <article className="min-h-screen bg-page page-top px-6 pb-8 md:px-20 md:pb-12">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <header className="flex min-h-[360px] flex-col items-center justify-center text-center md:min-h-[420px]">
            {/* Le nom du projet est porté par le h1 (lu par les moteurs et les
                lecteurs d'écran) sans modifier le rendu visuel existant. */}
            <h1 className="mb-6 max-w-[42rem] text-balance text-xl font-medium uppercase tracking-[0.06em] text-ink/65 md:text-2xl">
              <span className="sr-only">{project.title} - </span>
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
                logoVideoZoom={project.logoVideoZoom}
                logoFallback={project.logoFallback}
                logoLoop={project.logoLoop}
                logoOnLight={project.logoOnLight}
                priority
              />
            </div>
            <div className="mt-6 flex flex-col items-center gap-3">
              <ProjectContext context={project.context} />
              <CompanySiteLink site={project.companySite} />
            </div>
          </header>
        </ScrollReveal>

        {hasTextSections ? (
          <ScrollRevealGroup className="mx-auto max-w-3xl space-y-8 pb-20 md:space-y-10">
            {project.sections.map((section) => (
              <ScrollRevealItem key={section.title}>
                <CaseStudySection section={section} />
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
  const hasBlocks = Boolean(project.blocks?.length);

  return (
    <article className="min-h-screen bg-page page-top px-6 pb-8 md:px-20 md:pb-12">
      <div className="mx-auto max-w-5xl">
        <ScrollRevealGroup className="mx-auto flex max-w-3xl flex-col items-center pb-12 pt-6 text-center md:pb-16 md:pt-10">
          <ScrollRevealItem className="mb-10 max-w-2xl md:mb-14">
            {/* Idem : h1 sémantique, rendu visuel inchangé. */}
            <h1 className="text-balance text-xs font-medium uppercase tracking-[0.14em] text-ink/55 md:text-sm">
              <span className="sr-only">{project.title} - </span>
              {project.eyebrow}
            </h1>
            {project.detailSubtitle ? (
              <p className="mt-3 text-balance text-xs font-medium uppercase tracking-[0.14em] text-ink/55 md:text-sm">
                {project.detailSubtitle}
              </p>
            ) : null}
          </ScrollRevealItem>

          {project.headerLogo ? (
            <ScrollRevealItem className="mb-12 md:mb-16">
              <CaseStudyHeaderLogo headerLogo={project.headerLogo} />
            </ScrollRevealItem>
          ) : null}

          {project.context || project.companySite ? (
            <ScrollRevealItem className="mb-12 flex flex-col items-center gap-3 md:mb-16">
              <ProjectContext context={project.context} />
              <CompanySiteLink site={project.companySite} />
            </ScrollRevealItem>
          ) : null}
        </ScrollRevealGroup>

        {hasBlocks ? (
          <div className="mx-auto max-w-3xl space-y-12 pb-24 md:space-y-16">
            {project.blocks?.map((block, index) => (
              <CaseStudyBlock key={`${block.type}-${index}`} block={block} />
            ))}
          </div>
        ) : (
          <>
            {project.sections.length ? (
              <ScrollRevealGroup className="mx-auto mb-16 max-w-3xl space-y-8 md:mb-20 md:space-y-10">
                {project.sections.map((section) => (
                  <ScrollRevealItem key={section.title}>
                    <CaseStudySection section={section} />
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

function CaseStudyBlock({ block }: { block: ProjectBlock }) {
  if (block.type === "sections") {
    return (
      <ScrollRevealGroup className="space-y-8 md:space-y-10">
        {block.sections.map((section) => (
          <ScrollRevealItem key={section.title}>
            <CaseStudySection section={section} />
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
                  className="h-auto w-full rounded-[0.35rem] border border-ink/10"
                />
              </MediaButton>
            </ScrollRevealItem>
          ))}
        </div>
        {block.caption ? (
          <ScrollRevealItem>
            <p className={CAPTION}>{block.caption}</p>
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
            <ProjectMediaBlock media={media} priority={false} />
          </ScrollRevealItem>
        ))}
      </ScrollRevealGroup>
    );
  }

  return (
    <div className="space-y-16 md:space-y-20">
      {block.media.map((media, index) => (
        <ScrollReveal key={media.title} delay={index === 0 ? 0 : 0.04}>
          <ProjectMediaBlock media={media} priority={index < 2} />
        </ScrollReveal>
      ))}
    </div>
  );
}

/**
 * Légende sous un visuel : en minuscules et à 13 px, alignée sur le bord de
 * l'image. Les capitales espacées ne servent plus qu'aux étiquettes de
 * quelques mots ; sur une phrase entière, elles ralentissaient la lecture.
 */
const CAPTION = "mt-3 text-left text-[0.8125rem] leading-snug text-ink/65";

/**
 * Partie d'un texte de projet (« Vue d'ensemble », « Enjeux »…). Sur grand
 * écran, l'intitulé occupe une colonne étroite à gauche et le texte la colonne
 * de lecture : la page se parcourt d'un coup d'œil en descendant la marge,
 * comme un rapport imprimé. Sur téléphone, l'intitulé passe au-dessus du texte.
 */
function CaseStudySection({ section }: { section: ProjectSection }) {
  return (
    <div className="grid gap-2 text-left md:grid-cols-[9.5rem_1fr] md:gap-10">
      <h2 className="text-[0.6875rem] font-bold uppercase leading-7 tracking-[0.14em] text-ink/65">
        {section.title}
      </h2>
      <p className="copy">{section.body}</p>
    </div>
  );
}

function CaseStudyHeaderLogo({ headerLogo }: { headerLogo: ProjectHeaderLogo }) {
  if (headerLogo.kind === "jive-orange") {
    return (
      <div className="flex items-center justify-center gap-4 md:gap-5">
        <ThemedImage
          src="/assets/Logo-3.svg"
          srcOnLight="/assets/Logo-3-ink.svg"
          alt="Jive"
          width={120}
          height={48}
          className="h-10 w-auto md:h-12"
        />
        <span aria-hidden="true" className="text-lg text-ink/55 md:text-xl">
          ×
        </span>
        {/* Le logo d'Orange : texte blanc sur carré orange, quel que soit le thème. */}
        <span className="inline-flex h-10 items-end overflow-hidden rounded-sm bg-[#FF7900] px-2.5 pb-1.5 md:h-12 md:px-3 md:pb-2">
          <span className="text-sm font-bold lowercase tracking-tight text-white md:text-base">
            orange
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <ThemedImage
        src={headerLogo.src}
        srcOnLight={headerLogo.srcOnLight}
        alt={headerLogo.alt}
        width={headerLogo.width}
        height={headerLogo.height ?? 80}
        className={headerLogo.className ?? "h-auto w-48"}
      />
    </div>
  );
}

/**
 * Logo d'en-tête, avec sa version foncée en thème clair quand l'original est
 * blanc. Les deux sont rendus et le CSS n'affiche que celle du thème courant
 * (`theme-dark-only`, `theme-light-only` dans globals.css).
 */
function ThemedImage({
  src,
  srcOnLight,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  srcOnLight?: string;
  alt: string;
  width: number;
  height: number;
  className: string;
}) {
  if (!srcOnLight) {
    return <Image src={src} alt={alt} width={width} height={height} priority className={className} />;
  }

  return (
    <>
      <Image src={src} alt={alt} width={width} height={height} priority className={cn(className, "theme-dark-only")} />
      <Image src={srcOnLight} alt={alt} width={width} height={height} priority className={cn(className, "theme-light-only")} />
    </>
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
 * Cadre du projet (contrat, employeur, client, période), placé au-dessus du
 * lien vers le site de l'entreprise. Même registre typographique que ce lien :
 * il situe le projet sans concurrencer le titre.
 */
function ProjectContext({ context }: { context?: string }) {
  if (!context) return null;

  return (
    <p className="text-balance text-[0.6875rem] uppercase tracking-[0.16em] text-ink/55">
      {/* Espace insécable avant « : » et « · » : sur mobile, une ligne ne doit
          jamais commencer par un deux-points ou un séparateur. */}
      {context.replace(/ ([:·])/g, " $1")}
    </p>
  );
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
      className="group inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-ink/60 transition-colors hover:text-ink/90 focus-visible:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink/50"
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
          className="text-xs uppercase tracking-[0.18em] text-ink/55 underline decoration-ink/25 underline-offset-4 transition hover:text-ink/80"
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
    <article className="min-h-screen bg-page page-top px-6 pb-8 md:px-20 md:pb-12">
      <div className="mx-auto max-w-6xl">
        {/* En-tête commun aux pages projet : accroche puis logo flottant.
            C'est le repère qui rattache visuellement cette page aux autres. */}
        <ScrollReveal>
          <header className="flex min-h-[360px] flex-col items-center justify-center text-center md:min-h-[420px]">
            <h1 className="mb-6 max-w-[42rem] text-balance text-xl font-medium uppercase tracking-[0.06em] text-ink/65 md:text-2xl">
              <span className="sr-only">{project.title} - </span>
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
                logoVideoZoom={project.logoVideoZoom}
                logoFallback={project.logoFallback}
                logoLoop={project.logoLoop}
                logoOnLight={project.logoOnLight}
                priority
              />
            </div>
            <div className="mt-6 flex flex-col items-center gap-3">
              <ProjectContext context={project.context} />
              <CompanySiteLink site={project.companySite} />
            </div>
          </header>
        </ScrollReveal>

        {/* L'arc du récit posé en une phrase, juste sous l'en-tête. */}
        <ScrollReveal>
          <p className="mx-auto max-w-3xl text-balance pb-14 text-center text-xl font-medium leading-snug text-ink md:pb-20 md:text-3xl">
            {story.lead}
          </p>
        </ScrollReveal>

        {/* Le produit abouti vient avant son histoire : un visiteur qui ne fait
            que survoler la page doit avoir vu ce qui compte dès le premier
            écran. Le récit remonte ensuite à ses débuts. */}
        {story.highlight ? (
          <ProjectStoryHighlight
            label={story.highlight.label}
            title={story.highlight.title}
            body={story.highlight.body}
            shots={story.highlight.shots}
          />
        ) : null}

        {/* Vue d'ensemble, enjeu, solution, résultat : même grille de lecture
            que les autres études de cas. */}
        {project.sections.length ? (
          <ScrollRevealGroup className="mx-auto max-w-3xl space-y-6 pb-16 md:space-y-8 md:pb-24">
            {project.sections.map((section) => (
              <ScrollRevealItem key={section.title}>
                <CaseStudySection section={section} />
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        ) : null}

        {/* Bascule vers le récit : elle justifie le retour en arrière. */}
        {story.bridge ? (
          <ScrollReveal>
            <p className="mx-auto max-w-2xl text-balance pb-14 text-center text-lg font-medium text-ink/70 md:pb-20 md:text-xl">
              {story.bridge}
            </p>
          </ScrollReveal>
        ) : null}

        <ProjectStorySection beats={story.beats} trackLabels={story.trackLabels} />

        <section className="mt-24 border-t border-ink/10 pt-16 md:mt-32 md:pt-20">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink/55">
                {story.closing.title}
              </h2>
              <p className="copy mt-5">{story.closing.body}</p>
            </div>
          </ScrollReveal>

          {project.media?.length ? (
            <ScrollRevealGroup className="mx-auto mt-12 grid max-w-4xl gap-8 md:mt-16 md:grid-cols-2">
              {project.media.map((media) => (
                <ScrollRevealItem key={media.title}>
                  <ProjectMediaBlock media={media} priority={false} />
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
    <article className="min-h-screen bg-page page-top px-6 pb-8 md:px-20 md:pb-12">
      <div className="mx-auto max-w-5xl">
        <ScrollRevealGroup className="mx-auto flex max-w-3xl flex-col items-center pb-16 pt-8 text-center md:pb-24 md:pt-12">
          {/* Cette variante n'affiche pas de titre : le h1 reste accessible
              aux moteurs sans altérer la mise en page éditoriale. */}
          <h1 className="sr-only">
            {project.title} - {project.eyebrow}
          </h1>
          <ScrollRevealItem className="mb-10 flex flex-col items-center md:mb-14">
            <ThemedImage
              src={project.logo}
              srcOnLight={project.logoOnLight}
              alt={project.logoAlt}
              width={220}
              height={120}
              className="h-auto w-44 md:w-52"
            />
          </ScrollRevealItem>

          {project.context || project.companySite ? (
            <ScrollRevealItem className="mb-10 flex flex-col items-center gap-3 md:mb-14">
              <ProjectContext context={project.context} />
              <CompanySiteLink site={project.companySite} />
            </ScrollRevealItem>
          ) : null}

          {project.introParagraphs?.map((paragraph) => (
            <ScrollRevealItem key={paragraph} className="copy mb-6 max-w-2xl text-ink/80">
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
            <ProjectMediaBlock media={media} priority={index < 2} />
          </ScrollReveal>
        ))
      ) : (
        <ScrollRevealGroup className="grid gap-4 md:grid-cols-3">
          {project.gallery.map((item, index) => (
            <ScrollRevealItem
              key={item}
              className="flex aspect-[4/3] items-end overflow-hidden rounded-[1.5rem] border border-ink/8 bg-ink/[0.04] p-5"
            >
              <div>
                <span className="text-xs uppercase tracking-[0.18em] text-ink/55">
                  0{index + 1}
                </span>
                <p className="mt-2 text-lg font-semibold text-ink">{item}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      )}
    </section>
  );
}

/** Largeur maximale d'un visuel selon sa taille déclarée dans le catalogue. */
const MEDIA_MAX_WIDTH = { narrow: 480, regular: 720, wide: 1024 } as const;

function ProjectMediaBlock({ media, priority }: { media: ProjectMedia; priority: boolean }) {
  const isLightVariant = media.variant === "light";

  // Jamais plus large que l'image elle-même : les visuels des anciens projets
  // ne font que 732 px, et les étirer sur toute la colonne les rendait flous.
  // Montrés à leur taille, ils restent nets sur un écran standard.
  const maxWidth = Math.min(MEDIA_MAX_WIDTH[media.size ?? "regular"], media.image.width);

  return (
    <figure className="mx-auto" style={{ maxWidth }}>
      <MediaButton media={media}>
        <div
          className={
            isLightVariant
              ? "overflow-hidden rounded-[0.35rem] border border-ink/10 bg-white px-4 py-6 md:px-8 md:py-8"
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
            className={cn("h-auto w-full", !isLightVariant && "rounded-[0.35rem] border border-ink/10")}
          />
        </div>
      </MediaButton>
      <figcaption className={CAPTION}>{media.title}</figcaption>
      {media.link ? (
        <p className="mt-3 text-center">
          <a
            href={media.link.href}
            {...externalLinkProps(media.link.href)}
            className="text-xs uppercase tracking-[0.18em] text-ink/55 underline decoration-ink/25 underline-offset-4 transition hover:text-ink/80"
          >
            {media.link.label}
          </a>
        </p>
      ) : null}
    </figure>
  );
}
