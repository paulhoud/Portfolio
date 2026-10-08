import type { SiteCopy } from "../types";

export const enSite: SiteCopy = {
  meta: {
    title: "Paul Houdebine — Product Designer",
    description:
      "Portfolio of Paul Houdebine, end-to-end Product Designer: from product vision to front-end.",
  },
  nav: {
    method: "Methodology",
    about: "About",
    contact: "Contact",
    home: "Home",
    main: "Main navigation",
    mobile: "Mobile navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
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
    introTitle: "In short",
    introOne:
      "As the sole designer on a product, I cover the whole cycle: understanding the need, framing it, designing it, testing it, then shipping it in code with the developer.",
    introTwo:
      "These five steps set the pace of my sprints. I adapt them to the team's size and the product's maturity, but never skip the last one.",
  },
  methodSteps: [
    {
      title: "Understand the need",
      body: "I listen to clients, users and business teams to grasp the real goal, the context and the constraints before drawing anything.",
    },
    {
      title: "Go to the field",
      body: "Interviews, user tests, client feedback and a review of what exists: I gather the signals decisions will rest on.",
    },
    {
      title: "Frame and prioritise",
      body: "I turn what I learned into a clear direction — product vision, priorities, scope — and settle the trade-offs with the team.",
    },
    {
      title: "Design, prototype and test",
      body: "I turn hypotheses into journeys, interfaces and prototypes built on the design system, and test them before locking them in.",
    },
    {
      title: "Ship and follow through",
      body: "Specs, sprint follow-up and front-end paired with the developer: I stay on a feature until it is live in production.",
    },
  ],
  about: {
    title: "About",
    intro: [
      "My name is Paul Houdebine and I am a Product Designer. I design products end to end: from product vision and user research through to the front-end, shipped in pair with developers.",
      "At UpikaJob, I have been the sole designer since 2024. I frame the UX decisions, gather client feedback myself, keep the design system alive and take charge of the front-end. I designed and built the screens for its AI features: the chatbot and AI-generated summaries. I also carry the brand: website, print, motion, video.",
      "Based between Bordeaux and Paris.",
    ],
    sections: [
      {
        title: "Background",
        body: "I hold a Master's degree from HETIC (2016–2021), specialising in Product Design. I started in 2018 as a UX/UI designer at Fidesio, then worked for Maison Yves Delorme (2019–2020) before joining SÆGUS as a junior design consultant (2020–2021), on assignments for Orange and Capgemini. I also worked on projects for the Sanofi Espoir Foundation. I then became the first designer at Memento, a startup where I spent a year as an apprentice (2021–2022). Since 2024, I have been UpikaJob's sole designer.",
      },
      {
        title: "What I do",
        body: "Product vision and framing, user research and testing, UX/UI design, AI features, design systems, specs and front-end — plus the brand: website, print, motion design and video.",
      },
      {
        title: "Skills",
        body: "Product discovery, user interviews and testing, UX/UI, prototyping, design systems and tokens, front-end integration, sprint work with developers, motion design.",
      },
      {
        title: "Tools",
        body: "Figma, Miro and the Adobe suite to design; HTML, CSS, JavaScript, Tailwind and Symfony to ship, with Cursor, VS Code and Claude.",
      },
    ],
    photoAlt: "Portrait of Paul Houdebine, Product Designer",
    stack: {
      heading: "Tools & technologies",
      design: "Design tools",
      dev: "Development",
      ai: "AI models",
      os: "Operating systems",
      browsers: "Web browsers",
    },
  },
  contact: {
    title: "Contact",
    intro:
      "A product to grow? Let's talk about your team, your users and what you want to ship.",
    emailLabel: "Send an email",
    socialLabel: "Find me elsewhere",
    locationLabel: "Based between",
    cvLabel: "Download my resume",
  },
};
