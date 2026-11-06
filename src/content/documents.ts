import type { ProjectMedia } from "@/content/projects";
import type { Locale } from "@/i18n/types";

/**
 * Documents à partager : le CV (écran et impression) et le Book, en français et
 * en anglais. Chacun a sa page et sa propre image de partage : dans la section
 * Sélection de LinkedIn, la miniature d'un lien vient de la balise `og:image`
 * de la page liée, et un lien direct vers un PDF n'en a pas.
 *
 * Ces pages servent à être partagées : elles ne sont ni dans le menu, ni dans
 * le plan du site, et seule la page Contact y mène, en `nofollow`. Leurs titres,
 * descriptions et miniatures sont ceux fournis par Paul.
 *
 * Les PDF (`public/`) ne se retouchent pas. Les pages en image
 * (`public/documents/<dossier>/01.webp`…) en sont tirées pour la visionneuse, à
 * refaire à chaque nouvelle version d'un PDF, avec le moteur de Chrome.
 */

export type DocumentId = "cv" | "cv-print" | "book";

export type SiteDocument = {
  id: DocumentId;
  /** Adresse de la page, langue comprise. */
  href: string;
  /** PDF servi depuis `public/`. */
  file: string;
  /** Dossier des pages en image, dans `public/documents/`. */
  pagesDir: string;
  pageCount: number;
  /** Taille en pixels des pages en image. */
  pageSize: { width: number; height: number };
  /** Titre de la page. */
  title: string;
  /** Nom du document dans la visionneuse. */
  name: string;
  /** Nom court, dans la liste de la page Contact. */
  shortName: string;
  /** Format, nombre de pages et poids. */
  details: string;
  /** Nom de cette version, dans le choix entre les deux. */
  versionLabel?: string;
  /** L'autre version du même document. */
  sibling?: DocumentId;
  share: { title: string; description: string; image: string };
};

const A4 = { width: 1653, height: 2339 };
const SLIDE = { width: 2000, height: 1125 };

export const documents: Record<Locale, Record<DocumentId, SiteDocument>> = {
  fr: {
    cv: {
      id: "cv",
      href: "/cv",
      file: "/paul-houdebine-cv.pdf",
      pagesDir: "cv-fr",
      pageCount: 1,
      pageSize: A4,
      title: "CV",
      name: "CV de Paul Houdebine",
      shortName: "CV, version écran",
      details: "PDF, une page A4, 1 Mo",
      versionLabel: "Écran",
      sibling: "cv-print",
      share: {
        title: "CV - Product Designer",
        description: "Mon CV en une page, en PDF. Seul designer d'un SIRH déployé chez SPIE, Fayat, RATP et Altrad.",
        image: "/og/miniature-cv.png",
      },
    },
    "cv-print": {
      id: "cv-print",
      href: "/cv/impression",
      file: "/paul-houdebine-cv-impression.pdf",
      pagesDir: "cv-print-fr",
      pageCount: 1,
      pageSize: A4,
      title: "CV",
      name: "CV de Paul Houdebine, version impression",
      shortName: "CV, version impression",
      details: "PDF, une page A4, 420 Ko",
      versionLabel: "Impression",
      sibling: "cv",
      share: {
        title: "CV - Version impression",
        description: "Le même CV sur fond blanc, sans formes 3D, prêt à imprimer. PDF, une page A4.",
        image: "/og/miniature-cv-impression.png",
      },
    },
    book: {
      id: "book",
      href: "/book",
      file: "/paul-houdebine-book.pdf",
      pagesDir: "book-fr",
      pageCount: 30,
      pageSize: SLIDE,
      title: "Book",
      name: "Book de Paul Houdebine",
      shortName: "Book",
      details: "PDF, 30 pages, 7,9 Mo",
      share: {
        title: "Book - Sélection de projets",
        description: "Une sélection de mes projets, à télécharger en PDF.",
        image: "/og/miniature-book.png",
      },
    },
  },
  en: {
    cv: {
      id: "cv",
      href: "/en/resume",
      file: "/paul-houdebine-resume.pdf",
      pagesDir: "cv-en",
      pageCount: 1,
      pageSize: A4,
      title: "Resume",
      name: "Resume of Paul Houdebine",
      shortName: "Resume, screen version",
      details: "One-page A4 PDF, 1 MB",
      versionLabel: "Screen",
      sibling: "cv-print",
      share: {
        title: "Resume - Product Designer",
        description: "My one-page resume, as a PDF. Sole designer of an HRIS deployed at SPIE, Fayat, RATP and Altrad.",
        image: "/og/miniature-resume.png",
      },
    },
    "cv-print": {
      id: "cv-print",
      href: "/en/resume/print",
      file: "/paul-houdebine-resume-print.pdf",
      pagesDir: "cv-print-en",
      pageCount: 1,
      pageSize: A4,
      title: "Resume",
      name: "Resume of Paul Houdebine, print version",
      shortName: "Resume, print version",
      details: "One-page A4 PDF, 420 KB",
      versionLabel: "Print",
      sibling: "cv",
      share: {
        title: "Resume - Print version",
        description: "The same resume on a white background, without 3D shapes, ready to print. One-page A4 PDF.",
        image: "/og/miniature-resume-print.png",
      },
    },
    book: {
      id: "book",
      href: "/en/book",
      file: "/paul-houdebine-book-en.pdf",
      pagesDir: "book-en",
      pageCount: 30,
      pageSize: SLIDE,
      title: "Book",
      name: "Book of Paul Houdebine",
      shortName: "Book",
      details: "PDF, 30 pages, 7.9 MB",
      share: {
        title: "Book - Selected projects",
        description: "A selection of my projects, available as a PDF.",
        image: "/og/miniature-book-en.png",
      },
    },
  },
};

/** Les pages d'un document, au format attendu par la visionneuse. */
export function documentMedia(document: SiteDocument, pageLabel: string): ProjectMedia[] {
  return Array.from({ length: document.pageCount }, (_, index) => {
    const page = index + 1;
    return {
      title: document.pageCount > 1 ? `${document.name}, ${pageLabel} ${page}` : document.name,
      image: { src: `/documents/${document.pagesDir}/${String(page).padStart(2, "0")}.webp`, ...document.pageSize },
    };
  });
}
