"use client";

import Image from "next/image";
import Link from "next/link";
import { MediaButton } from "@/components/media/MediaButton";
import { MediaViewerProvider, useMediaViewer } from "@/components/media/MediaViewerProvider";
import { TextPage } from "@/components/layout/TextPage";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { documentMedia, documents, type DocumentId, type SiteDocument } from "@/content/documents";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60";

/**
 * Page d'un document à partager (CV, Book ; cf. `content/documents.ts`) : un
 * aperçu qui s'ouvre dans la visionneuse du site, et le PDF à télécharger.
 * Un document de plusieurs pages les montre toutes en vignettes.
 */
export function DocumentPageView({ id }: { id: DocumentId }) {
  const { t, locale } = useTranslation();
  const copy = t.site.documents;
  const document = documents[locale][id];
  const sibling = document.sibling ? documents[locale][document.sibling] : null;
  const [cover, ...otherPages] = documentMedia(document, copy.page);
  const media = [cover, ...otherPages];
  const portrait = document.pageSize.height > document.pageSize.width;

  return (
    <TextPage title={document.title} wide revealChildren={false}>
      <MediaViewerProvider media={media} download={{ href: document.file, label: copy.download }}>
        <ScrollReveal>
          <div
            className={cn(
              "mx-auto grid items-center gap-10 md:gap-14",
              portrait ? "max-w-4xl md:grid-cols-2" : "max-w-5xl md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
            )}
          >
            <MediaButton media={cover} className={portrait ? "mx-auto max-w-md" : undefined}>
              <Image
                src={cover.image.src}
                width={cover.image.width}
                height={cover.image.height}
                alt={document.name}
                priority
                quality={92}
                sizes={portrait ? "(min-width: 768px) 28rem, 90vw" : "(min-width: 768px) 38rem, 90vw"}
                className="h-auto w-full rounded-xl shadow-[var(--glass-shadow)] ring-1 ring-ink/10"
              />
            </MediaButton>

            <div>
              <p className="text-base font-bold text-ink">{profile.name}</p>
              <p className="text-sm text-ink/60">{profile.jobTitle}</p>

              {sibling ? <VersionSwitch label={copy.version} current={document} other={sibling} /> : null}

              <p className="mt-6 text-balance text-xl font-medium leading-snug text-ink md:text-2xl">{document.share.description}</p>
              <p className="mt-4 text-sm text-ink/60">{document.details}</p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <a
                  href={document.file}
                  // `download` enregistre le fichier, et les statistiques le comptent.
                  download
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-page transition duration-300 hover:-translate-y-0.5 hover:opacity-90",
                    FOCUS,
                  )}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />
                  </svg>
                  {copy.download}
                </a>
                <ViewButton label={copy.view} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {otherPages.length > 0 ? (
          <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-3 md:mt-20 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {otherPages.map((page) => (
              <li key={page.image.src}>
                <MediaButton media={page}>
                  <Image
                    src={page.image.src}
                    width={page.image.width}
                    height={page.image.height}
                    alt={page.title}
                    sizes="(min-width: 1024px) 15rem, (min-width: 768px) 30vw, 45vw"
                    className="h-auto w-full rounded-md ring-1 ring-ink/10"
                  />
                </MediaButton>
              </li>
            ))}
          </ul>
        ) : null}
      </MediaViewerProvider>
    </TextPage>
  );
}

/**
 * Les deux versions d'un même document : deux onglets, toujours dans le même
 * ordre (écran, puis impression). Chacune a sa page, à partager ; le bouton de
 * téléchargement vaut pour la version affichée. Le passage de l'une à l'autre
 * remplace l'entrée de l'historique : « retour » ramène à la page Contact.
 */
function VersionSwitch({ label, current, other }: { label: string; current: SiteDocument; other: SiteDocument }) {
  const versions = current.id === "cv" ? [current, other] : [other, current];
  return (
    <nav aria-label={label} className="mt-6 inline-flex rounded-full border border-ink/15 p-1">
      {versions.map((version) => {
        const active = version.id === current.id;
        return (
          <Link
            key={version.id}
            href={version.href}
            replace
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-300",
              active ? "bg-ink text-page" : "text-ink/65 hover:text-ink",
              FOCUS,
            )}
          >
            {version.versionLabel}
          </Link>
        );
      })}
    </nav>
  );
}

/** Ouvre la visionneuse sur la première page. */
function ViewButton({ label }: { label: string }) {
  const viewer = useMediaViewer();
  return (
    <button
      type="button"
      onClick={() => viewer?.openIndex(0)}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink/80 transition duration-300 hover:-translate-y-0.5 hover:border-ink/35 hover:text-ink",
        FOCUS,
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
        <circle cx="12" cy="12" r="2.75" />
      </svg>
      {label}
    </button>
  );
}
