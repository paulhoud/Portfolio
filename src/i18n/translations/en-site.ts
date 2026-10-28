import type { SiteCopy } from "../types";

export const enSite: SiteCopy = {
  meta: {
    title: "Paul Houdebine - Product Designer",
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
    footer: "Footer links",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    skipToContent: "Skip to content",
  },
  footer: {
    copyright: "© 2026 Paul Houdebine.",
    rights: "All rights reserved.",
    models: "3D models",
    by: "by",
    legal: "Legal notice",
    audience: "Anonymous audience measurement, no cookies.",
    optOut: "Opt out",
    optedOut: "You are no longer counted on this device.",
    optIn: "Undo",
  },
  theme: {
    label: "Light theme",
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
  },
  sound: {
    mute: "Mute sound",
    unmute: "Turn sound on",
    label: "Sound",
    volume: "Volume",
    unmuteShort: "Turn on",
    on: "On",
    off: "Off",
  },
  gallery: {
    intro:
      "End-to-end Product Designer: product vision, user research, UX/UI, design systems and front-end, from framing to production.",
    listLabel: "Projects",
    viewProject: "View project",
    nextProject: "Next project",
    scrollHint: "Scroll",
    swipeHint: "Swipe up",
    headphones: "Better experience with headphones",
    lostTitle: "You are drifting through another dimension.",
    lostHint: "The projects are floating somewhere around here…",
    lostHintDofus: "A golden marsh, somewhere in the World of Twelve…",
    lostHintSouthPark: "It is snowing on a small Colorado town…",
    disclaimerDofus: "Unofficial nod to Dofus (© Ankama). Non-commercial, not affiliated.",
    disclaimerSouthPark: "Unofficial nod to South Park (© Comedy Central). Non-commercial, not affiliated.",
    lostBack: "Back",
    portal: "Another dimension",
    secretHint: "Psst… type “destroy” on the home page.",
  },
  projectNav: {
    label: "More projects",
    previous: "Previous project",
    next: "Next project",
  },
  language: {
    switchTo: "Change language",
    french: "French",
    english: "English",
  },
  common: {
    back: "Back",
    viewOnFigma: "View on Figma",
    watchVideo: "Watch video",
    seeSite: "View website",
    seeVideo: "Watch video",
  },
  method: {
    title: "My method",
    introTitle: "In short",
    introOne:
      "I am a Product Designer, and design does not start in Figma. It starts with understanding the problem, looking for leads beyond existing solutions, then making ideas concrete as early as possible: a mock-up, a prototype or a first version that works.",
    introTwo:
      "These five moments are not a straight line. They overlap and repeat, and I scale them to the project, the time available and what is at stake. AI supports me in each of them, without deciding for me.",
    phasesLabel: "The five moments of the method",
    loop: "and back again",
    aiLabel: "With AI",
    toolsLabel: "Methods and tools",
    loopNote:
      "Often, we go back to an earlier moment: what testing teaches sends us back to understanding the need, and an experiment can reopen the exploration.",
    map: { label: "From problem to solution", from: "A need, a problem", to: "A solution in use" },
    progressLabel: "Progress through the method",
    figures: {
      understand: {
        context: "The context",
        hypotheses: "Hypotheses to check",
        field: "Checked in the field",
        output: "Improvement leads, ranked by priority",
      },
      explore: { subject: "A subject", directions: "Several directions", chosen: "One direction kept" },
      design: {
        axis: "Fidelity",
        levels: ["Concept", "Flows and wireframes", "Mock-ups", "Interactive prototype"],
        structure: "settles a structure",
        interaction: "settles an interaction",
      },
      experiment: {
        center: "Shorten the loop",
        steps: ["An idea", "A version that works", "Tested in real conditions", "Iterated"],
      },
      validate: {
        center: "The solution",
        criteria: ["Usability", "Visual consistency", "Technical feasibility", "Business goals"],
        trackLabel: "Into production, and beyond",
        track: ["Mock-up", "Prototype", "In production", "Follow-up"],
      },
    },
    ai: {
      title: "AI as a design partner",
      intro:
        "AI is now part of how I work. Not to go faster at all costs: to explore more possibilities, and to bring to life ideas I would not have had time to build.",
      partners: [
        {
          name: "GPT",
          use: "Structuring my thinking, exploring leads, digging into a subject, and writing precise prompts, suited to what I want to get.",
        },
        {
          name: "Claude and Claude Code",
          use: "Supporting implementation and development: going from an idea to a first version, then iterating on the product.",
        },
      ],
      mine: "What remains mine: framing the problem, choosing the creative direction, assessing the results and making the calls. AI does not replace my reasoning as a Product Designer, it equips it.",
    },
    tools: {
      title: "Tools chosen for the experience in mind",
      intro:
        "I choose tools according to the experience I want to design, not the other way round. My working environment, depending on the project:",
      items: [
        { name: "GPT", use: "Thinking, exploring leads, writing prompts" },
        { name: "Claude, Claude Code", use: "Development, implementation, product iterations" },
        { name: "Figma", use: "Interfaces, wireframes, prototypes, design systems, journeys" },
        { name: "Blender", use: "3D elements, when a project calls for it" },
        { name: "Unity", use: "Prototypes of interactive environments, when relevant" },
      ],
      note: "I do not use all of them on every project, nor to the same depth: they are possibilities I choose from, or explore.",
    },
  },
  methodSteps: [
    {
      id: "comprendre",
      phase: "Understand",
      title: "Understand before designing",
      lead: "Finding the right problem to solve matters more than the first solution that comes to mind.",
      body: [
        "I start with the context: who uses the product, in what situation, with which business goals and constraints. I then phrase what I think I have understood as hypotheses, so I can check them rather than assume them.",
        "To find needs, pain points and opportunities, I pick the tools that fit the context: user interviews, feedback analysis, tests on what exists, benchmarks of solutions and market practices. At UpikaJob, I gather client feedback myself: that is often where the real priorities lie. When time is short, I do less, but I never skip this step.",
        "I come out of it with improvement leads ranked by priority, shared with the team.",
      ],
      ai: "Structuring what I have learned: grouping feedback, surfacing trends, rephrasing a problem, listing angles I might have missed. The conclusions come from the field.",
      tools: ["Interviews", "Feedback analysis", "Tests", "Benchmark", "GPT"],
    },
    {
      id: "explorer",
      phase: "Explore",
      title: "Feeding the thinking",
      lead: "Looking elsewhere, so as not to mechanically reproduce what already exists.",
      body: [
        "My watch is not about collecting pretty interfaces. I follow how Product Design and UX/UI evolve, new uses and emerging interactions, immersive web experiences and animation, prototyping and development tools, and what AI makes possible.",
        "Faced with a subject, this material helps me open several directions before choosing one: comparing approaches, seeing how other products solved a similar problem, spotting what can surprise without confusing. The 3D home page of this portfolio came out of this kind of exploration.",
      ],
      ai: "Widening the field: weighing several approaches, digging into a subject I know little about, generating first creative leads that I then sort.",
      tools: ["Design watch", "References", "Design systems", "GPT"],
    },
    {
      id: "concevoir",
      phase: "Design",
      title: "Making ideas tangible",
      lead: "The sooner an idea takes shape, the sooner we see whether it holds.",
      body: [
        "I take an idea through several levels of fidelity: formalising the concept, sketching journeys and wireframes, then mock-ups and interactive prototypes in Figma, built on a design system when one exists.",
        "Each level is there to decide something: a wireframe validates a structure, a prototype validates an interaction. I only add detail once the previous question is settled.",
      ],
      ai: "Preparing the ground: realistic content, wording variants, edge cases to plan for in the screens.",
      tools: ["Sketches", "Wireframes", "Prototypes", "Design system", "Figma"],
    },
    {
      id: "experimenter",
      phase: "Experiment",
      title: "Experimenting and building",
      lead: "Between the mock-up and the product, the line has become more fluid.",
      body: [
        "When the project calls for it, I push experimentation further: animation, 3D elements, interactive environments. I then explore Blender to create 3D elements, or Unity to prototype an interactive environment.",
        "I also move from design to implementation. At UpikaJob, I take charge of the front-end, paired with the developer. With Claude and Claude Code, I can go as far as a first version that works, test it in real conditions and iterate on it: this portfolio was built that way.",
        "Not every project needs code, 3D or AI. I choose the level of execution according to what we are trying to learn.",
      ],
      ai: "This is where Claude plays the biggest part: supporting development, implementing, fixing, and shortening the loop between an idea and a testable version.",
      tools: ["Animation", "3D", "Front-end", "Claude", "Claude Code", "Blender", "Unity"],
    },
    {
      id: "valider",
      phase: "Validate",
      title: "Validating, iterating, improving",
      lead: "Experimentation stays in the service of the user experience.",
      body: [
        "I check that the solution answers the original need: are the interfaces and interactions understood? Where are the friction points? I gather feedback, observe, and adjust the design choices.",
        "The aim is to reconcile usability, visual consistency, technical feasibility and business goals. The work does not stop at delivering a mock-up or a prototype: I follow a feature all the way to production, then watch how it lives.",
      ],
      ai: "Analysing feedback at scale and preparing tests. The final assessment remains mine, and the users'.",
      tools: ["User testing", "Feedback", "Iterations", "Production follow-up"],
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
        body: "I graduated from HETIC's Grande École programme (2016–2021), a master's degree combining web design, web development and digital marketing. I started with a UX/UI internship at Fidesio, a web agency (2018), then did two internships as a junior consultant at SÆGUS, in 2019 and 2020, for clients such as Orange, Capgemini and the Sanofi Espoir Foundation. At HETIC, I also worked on a professional project for Maison Yves Delorme (2019–2020). I then became the first designer at Memento, a startup where I spent a year as an apprentice (2021–2022). Since 2024, I have been UpikaJob's sole designer.",
      },
      {
        title: "What I do",
        body: "Product vision and framing, user research and testing, UX/UI design, AI features, design systems, specs and front-end - plus the brand: website, print, motion design and video.",
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
    write: "Write",
    copy: "Copy address",
    copied: "Address copied",
    localTime: "local time",
  },
};
