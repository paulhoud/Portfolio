import type { SiteCopy } from "../types";

export const enSite: SiteCopy = {
  meta: {
    title: "Paul Houdebine - Portfolio",
    description:
      "Portfolio of Paul Houdebine, product designer and digital identity specialist.",
  },
  nav: {
    method: "My method",
    about: "About",
    contact: "Contact",
    home: "Home",
    main: "Main navigation",
    mobile: "Mobile navigation",
  },
  footer: {
    copyright: "© 2026 Paul Houdebine.",
    rights: "All rights reserved.",
  },
  language: {
    switchTo: "Change language",
    french: "French",
    english: "English",
  },
  common: {
    back: "Back",
    projectGallery: "Projects",
    viewOnFigma: "View on Figma",
    watchVideo: "Watch video",
    seeSite: "View website",
    seeVideo: "Watch video",
  },
  method: {
    title: "My method",
    introTitle: "What is it?",
    introOne:
      "Depending on the skills involved in a project and the deliverables expected, tackling problems with a solid methodology is essential.",
    introTwo:
      "Here are the steps that help me approach projects confidently within an Agile framework built around Design Thinking.",
  },
  methodSteps: [
    {
      title: "Understand the context and client needs",
      body: "The first step is to understand the project's goals, needs, target audience, and competitive environment.",
    },
    {
      title: "Research and gather information",
      body: "I conduct in-depth research on the market, trends, users, real needs, and competition.",
    },
    {
      title: "Synthesize and analyze data",
      body: "Information is sorted and analyzed to produce useful conclusions, insights, and a clear direction.",
    },
    {
      title: "Design, prototype, and test",
      body: "I turn hypotheses into interfaces, prototypes, and testable deliverables to validate decisions quickly.",
    },
    {
      title: "Deliver and support",
      body: "Deliverables are prepared cleanly, documented, and designed to be reused or deployed by teams.",
    },
  ],
  about: {
    title: "About",
    intro: [
      "Product designer and digital identity specialist, I help teams build useful, coherent, and lasting experiences.",
      "My work connects strategy, real-world usage, and graphic execution to produce readable interfaces, strong visual systems, and smooth user journeys.",
      "I work on digital products and communication materials alike, through apprenticeships, freelance missions, or collaborations with studios and startups.",
    ],
    sections: [
      {
        title: "What I do",
        body: "Interface design, prototyping, design systems, art direction, print and digital assets, product storytelling, workshop facilitation, and user journey documentation.",
      },
      {
        title: "Skills",
        body: "UX research, UI design, design systems, interactive prototyping, visual identity, light motion design, Agile collaboration, and developer handoff.",
      },
      {
        title: "Tools",
        body: "Figma, Adobe Creative Suite, Miro, Notion, Framer, HTML/CSS, and enough curiosity to understand business challenges before drawing the solution.",
      },
    ],
  },
  contact: {
    title: "Contact",
    intro:
      "Have a project, mission, or collaboration in mind? Let's talk about your needs, timeline, and the best way to work together.",
    channels: [
      {
        label: "Email",
        href: "mailto:contact@paulhoudebine.com",
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/paulhoudebine",
        external: true,
      },
    ],
  },
};
