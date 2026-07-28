export type Locale = "fr" | "en";

export const defaultLocale: Locale = "fr";
export const locales: Locale[] = ["fr", "en"];

export type NavItem = {
  href: string;
  label: string;
};

export type MethodStep = {
  title: string;
  body: string;
};

export type AboutSection = {
  title: string;
  body: string;
};

export type SiteCopy = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    method: string;
    about: string;
    contact: string;
    home: string;
    main: string;
    mobile: string;
    openMenu: string;
    closeMenu: string;
  };
  footer: {
    copyright: string;
    rights: string;
  };
  language: {
    switchTo: string;
    french: string;
    english: string;
  };
  common: {
    back: string;
    projectGallery: string;
    viewOnFigma: string;
    watchVideo: string;
    seeSite: string;
    seeVideo: string;
  };
  method: {
    title: string;
    introTitle: string;
    introOne: string;
    introTwo: string;
  };
  methodSteps: MethodStep[];
  about: {
    title: string;
    intro: string[];
    sections: AboutSection[];
    /** Texte alternatif du portrait. */
    photoAlt: string;
    /** Intitulés des catégories d'outils (les données vivent dans techStack.ts). */
    stack: {
      heading: string;
      design: string;
      dev: string;
      ai: string;
      os: string;
      browsers: string;
    };
  };
  contact: {
    title: string;
    intro: string;
    /** Intitulé du bloc principal menant à l'adresse e-mail. */
    emailLabel: string;
    /** Intitulé de la liste des profils externes. */
    socialLabel: string;
    /** Intitulé précédant les villes d'exercice. */
    locationLabel: string;
  };
};

export type ProjectCopy = {
  title: string;
  eyebrow: string;
  description: string;
  detailSubtitle?: string;
  introParagraphs?: string[];
  sections?: { title: string; body: string }[];
  media?: { title: string }[];
  /**
   * Récit scrollé. Seuls les textes sont traduits : les captures viennent du
   * catalogue et restent communes aux deux langues.
   */
  story?: {
    lead: string;
    chapters: {
      period: string;
      role: string;
      title: string;
      body: string;
      shots: { caption: string }[];
    }[];
    closing: { title: string; body: string; link?: { label: string } };
  };
  blocks?: (
    | { type: "sections"; sections: { title: string; body: string }[] }
    | { type: "media"; caption?: string; media: { title: string }[] }
    | { type: "links"; links: { label: string }[] }
  )[];
};

export type ProjectTranslations = Record<string, ProjectCopy>;

export type Translations = {
  site: SiteCopy;
  projects: ProjectTranslations;
};
