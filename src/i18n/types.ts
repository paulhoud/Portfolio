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

export type ContactChannel = {
  label: string;
  href: string;
  external?: boolean;
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
  };
  contact: {
    title: string;
    intro: string;
    channels: ContactChannel[];
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
