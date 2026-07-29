// Le type vit dans `../types` : il était auparavant redéclaré ici, si bien que
// toute évolution du modèle devait être reportée à deux endroits.
import type { ProjectTranslations } from "../types";

export const enProjectTranslations: ProjectTranslations = {
  memento: {
    title: "Memento",
    eyebrow: "Designing tomorrow's photo redistribution service",
    description:
      "A SaaS platform for retrieving and redistributing individual photos at events.",
    sections: [
      {
        title: "Overview",
        body: "I had the opportunity to spend a year in an apprenticeship with Memento, a startup offering a personalized photo retrieval service powered by the cloud and facial recognition.",
      },
      {
        title: "Challenges",
        body: "The company needed to structure its interfaces, mockups, communication materials, and content to support its growth.",
      },
      {
        title: "Solution",
        body: "I worked on interfaces and Figma prototypes, applied a design system approach, and produced communication visuals for social media, flyers, and events.",
      },
      {
        title: "Outcome",
        body: "My work helped modernize Memento's identity. To this day, the presentation video is still used by the founders to showcase the solution, and its distribution helped convert several client leads in the months that followed.",
      },
    ],
    media: [
      { title: "Event photography coverage" },
      { title: "Memento landing page" },
      { title: "Presentation storyboards" },
      { title: "Video statistics" },
      { title: "Commercial poster" },
      { title: "QR code event support" },
      { title: "Offer summary and FAQ" },
    ],
  },

  "yves-delorme": {
    title: "Yves Delorme",
    eyebrow: "L'Odyssée — redesigning the digital ecosystem",
    description:
      "A full redesign of the customer experience for Maison Yves Delorme, from in-store research to high-fidelity prototyping.",
    introParagraphs: [
      "L'Odyssée is a project to fully redesign the digital ecosystem of Maison Yves Delorme. It aims to harmonize the customer experience across the boutique, advisory services, and digital tools.",
      "Working alongside the marketing and sales teams, I contributed to thinking through the customer journey, interface architecture, and priority scenarios to prototype.",
      "The approach combined field immersion, UX/UI formalization, and the production of concrete deliverables to shape a more cohesive, premium, service-oriented experience.",
    ],
    media: [
      { title: "In-store working session with the sales team" },
      { title: "Review of customer expectations and needs" },
      { title: "Defining goals and communication strategy" },
      { title: "Creating the visual identity and brand guidelines" },
      { title: "High-fidelity prototyping of the site's key pages" },
      { title: "Site in context on tablet" },
    ],
  },

  jive: {
    title: "Jive",
    eyebrow: "Improving an intranet platform with a design thinking add-on",
    description:
      "Designing a Jive add-on for Orange to run design thinking workshops directly within the intranet.",
    sections: [
      {
        title: "Overview",
        body: "During my second internship at SÆGUS, I worked as a junior design consultant on an Orange team. The goal was to improve how Jive — the intranet solution used daily by employees — was being used.",
      },
      {
        title: "Challenges",
        body: "Orange needed to run Kanban-style ideation workshops directly in Jive, without multiplying external tools or losing participants in overly complex interfaces.",
      },
      {
        title: "Solution",
        body: "We designed a Jive add-on built on a design thinking approach: a Figma workshop to gather requirements, then the creation of a final tool made up of reusable modules.",
      },
      {
        title: "Outcome",
        body: "The Orange team now has a ready-to-use tool to organize their work in Kanban mode within Jive itself.",
      },
    ],
    media: [
      { title: "Design system organization" },
      { title: "Prototype organization" },
      { title: "Miro board organization" },
    ],
  },

  odyssey: {
    title: "Sanofi Espoir",
    eyebrow: "A project for children's health in Senegal: strengthening local impact",
    description:
      "A design mission for the Sanofi Espoir Foundation focused on maternal and neonatal health in Senegal.",
    sections: [
      {
        title: "Overview",
        body: "A mission carried out for the Sanofi Espoir Foundation around maternal and neonatal health in Senegal. The goal was to better understand local care pathways to strengthen the foundation's impact.",
      },
      {
        title: "Challenge",
        body: "Teams had to reconcile field constraints, healthcare professionals' expectations, and patients' needs in a complex environment, with little visibility into the real on-the-ground experience.",
      },
      {
        title: "Solution",
        body: "An immersive approach combining field immersion, interviews, workshops, and visual synthesis to map journeys, structure insights, and propose user-centered recommendations.",
      },
      {
        title: "Outcome",
        body: "The team was able to rely on concrete deliverables — journey maps, storyboards, and experience maps — to guide decisions and strengthen the coherence of its actions in the field.",
      },
    ],
    media: [
      { title: "A field step with stakeholders to better understand needs" },
      { title: "Identifying and accessing local healthcare facilities" },
      { title: "Supporting local teams to improve their services" },
      { title: "A collective, collaborative ideation process with the Sanofi Espoir Foundation teams" },
      { title: "A visual map of structure and organization" },
      { title: "A detailed analysis of the patient experience and pain points along the journey" },
    ],
  },

  unicorn: {
    title: "Fidesio",
    eyebrow: "Sanofi – spirit of solidarity",
    detailSubtitle: "Healthcare professionals on mission",
    description:
      "Healthcare professionals on mission: redesigning digital tools and design selection for Sanofi Espoir.",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Overview",
            body: "A mission for Sanofi Espoir focused on managing professional time slots and design selection for tools aimed at healthcare professionals on mission.",
          },
          {
            title: "Challenges",
            body: "The goal was to clarify use cases, structure user journeys, and propose more readable interfaces to support teams in their day-to-day work.",
          },
          {
            title: "Solution",
            body: "I contributed to designing application interfaces, defining an editorial website, and producing communication visuals consistent with the Sanofi Espoir identity.",
          },
        ],
      },
      {
        type: "media",
        media: [
          { title: "Management application organization" },
          { title: "Weekly view and activity tracking" },
        ],
      },
      {
        type: "sections",
        sections: [
          {
            title: "Design direction",
            body: "The design selection focused on a sober, institutional, and reassuring universe, with a clear hierarchy between editorial content, data, and primary actions.",
          },
          {
            title: "Editorial website",
            body: "The public site highlights performance, news, and institutional messages from Sanofi Espoir in a modular, responsive layout.",
          },
          {
            title: "Professional portal",
            body: "The dedicated space for healthcare professionals offers dashboards, indicators, and visualizations to track activity and support decision-making.",
          },
        ],
      },
      {
        type: "media",
        media: [
          { title: "Landing page and editorial architecture" },
          { title: "Healthcare professional dashboard" },
        ],
      },
      {
        type: "sections",
        sections: [
          {
            title: "Communication",
            body: "Visual variations draw on Sanofi Espoir codes through colored blocks, product imagery, and strong calls to action.",
          },
          {
            title: "Outcome",
            body: "The full set of deliverables provides a cohesive foundation for deploying a clearer, more engaging digital experience better aligned with the brand's solidarity missions.",
          },
        ],
      },
      {
        type: "media",
        media: [
          { title: "Spirit of solidarity visual variation" },
          { title: "Institutional communication support" },
        ],
      },
    ],
  },

  capgemini: {
    title: "Capgemini",
    eyebrow: "Illustrating use cases to reach a broad audience",
    description:
      "Creating animated videos for Capgemini to illustrate Microsoft 365 use cases.",
    sections: [
      {
        title: "Overview",
        body: "During my internship at SÆGUS, I worked for Capgemini on creating animated videos featuring characters and sets using After Effects and the Duik plugin.",
      },
      {
        title: "Challenges",
        body: "The brief called for four animated use cases, with many scenes and a heavy animation workload, within a tight deadline for a long-standing client.",
      },
      {
        title: "Solution",
        body: "I became more autonomous in production, drawing on my skills in graphic design and art direction, as well as my interest in video and animation.",
      },
      {
        title: "Outcome",
        body: "The project was delivered on time and allowed the SÆGUS design team to maintain the client's trust on a demanding assignment.",
      },
    ],
    media: [
      { title: "Use case 1: how to collaborate with Teams and SharePoint?" },
      { title: "Use case 2: how to boost productivity with OneDrive?" },
      { title: "Use case 3: how to work from anywhere using Office Online?" },
    ],
  },

  lemon: {
    title: "Baio",
    eyebrow: "Building a gamified app that encourages healthy product consumption",
    description:
      "Designing a gamified mobile app to encourage healthier eating habits.",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Overview",
            body: "A project to design a gamified mobile app aimed at encouraging users to consume healthier products on a daily basis.",
          },
          {
            title: "Challenge",
            body: "Deliver a simple, engaging experience to help consumers make better product choices and track their eating habits.",
          },
          {
            title: "Solution",
            body: "I designed a complete mobile journey: onboarding, search, shopping lists, receipt scanning, and a points system with partner offers.",
          },
          {
            title: "Outcome",
            body: "The app was structured into key screens and organized in Figma to facilitate iteration and concept presentation.",
          },
        ],
      },
      {
        type: "media",
        caption: "Screens from the previous version of the Lemon app",
        media: [
          { title: "Eco-friendly groceries" },
          { title: "Informed community" },
          { title: "Shopping lists" },
          { title: "Receipt scanning" },
          { title: "Exclusive offers" },
        ],
      },
      {
        type: "media",
        media: [{ title: "In-app onboarding journey" }],
      },
      {
        type: "media",
        media: [{ title: "View organization and filters in Figma" }],
      },
      {
        type: "links",
        links: [{ label: "View on Figma" }],
      },
    ],
  },

  alpha: {
    title: "SÆGUS",
    eyebrow: "10th anniversary Saegus x Le Trianon",
    description:
      "Designing the digital greeting card and communication materials for SÆGUS's 10th anniversary.",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Overview",
            body: "A design mission for SÆGUS's 10th anniversary: digital greeting card, desktop/mobile variations, and communication materials for the event at Le Trianon.",
          },
          {
            title: "Challenges",
            body: "Create a premium, festive experience that reflects SÆGUS's identity while highlighting the year's successes and the team's outlook.",
          },
          {
            title: "Solution",
            body: "I developed a strong visual direction around purple, key figures, and testimonials, with a modular architecture designed for web and email.",
          },
          {
            title: "Outcome",
            body: "The deliverables enabled a cohesive campaign across multiple touchpoints, from the landing page to social media visuals.",
          },
        ],
      },
      {
        type: "media",
        media: [
          { title: "2021 digital greeting card" },
          { title: "Editorial version of the greeting card" },
        ],
      },
      {
        type: "media",
        media: [{ title: "Screen organization in Figma" }],
      },
      {
        type: "media",
        media: [{ title: "Agile support — long-term partnership" }],
      },
      {
        type: "media",
        media: [
          { title: "Key project moments" },
          { title: "Thanks to the teams" },
        ],
      },
    ],
  },

  studio: {
    title: "Film Amateur",
    eyebrow: "Making a short film in a short timeframe to encourage digital teamwork",
    description:
      "The short film « Le Grand Ménage », produced as a team over two weeks, from writing to editing.",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Overview",
            body: "A short film project produced end to end in two weeks with a multidisciplinary team, as part of an amateur audiovisual production experience.",
          },
          {
            title: "Challenges",
            body: "Organize a team, stick to a tight shooting schedule, and converge on a coherent film despite strong technical and human constraints.",
          },
          {
            title: "Solution",
            body: "We divided roles, structured the production stages — writing, preparation, filming, editing — and maintained continuous coordination on set.",
          },
          {
            title: "Outcome",
            body: "The film was delivered on time and proved to be a formative experience for the whole team around collective work.",
          },
        ],
      },
      {
        type: "media",
        media: [{ title: "Short film poster" }],
      },
      {
        type: "links",
        links: [
          { label: "Watch the short film" },
          { label: "Les voix les traits" },
          { label: "Production dossier" },
        ],
      },
      {
        type: "media",
        media: [
          { title: "The team and myself filming a murder scene" },
          { title: "Me editing the short film on Mac" },
          { title: "The boom operator and I filming a lobby scene" },
        ],
      },
    ],
  },

  archive: {
    title: "Archive",
    eyebrow: "Personal drawings and creations",
    description:
      "A selection of graphic work, illustrations, and personal experiments.",
    media: [
      { title: "Illustrations created for stickers" },
      { title: "Graphic research project around a Bauhaus exhibition" },
      { title: "Graphic research for a space-themed video game project" },
      { title: "Dreamcatcher illustration" },
      { title: "Digital landscape painting at dusk" },
      { title: "Graphic experiment in the form of a short comic strip" },
      { title: "Brand identity proposal for an audiovisual production studio" },
      { title: "Skate video filming and editing" },
    ],
  },

  upikajob: {
    title: "UpikaJob",
    eyebrow: "Career coaching & professional support platform",
    description: "My current role: product design for a career coaching platform.",
    sections: [
      {
        title: "Overview",
        body: "UpikaJob is an HR platform born out of supporting young talent. I have been its Product Designer, from the first redesigns through to the product as it stands today.",
      },
      {
        title: "Challenge",
        body: "Turning a tool built for training organisations into an HRIS able to serve HR teams and managers — without losing the expertise that made it strong in the first place.",
      },
      {
        title: "Solution",
        body: "Successive redesigns, a reworked visual identity, a shared design system, and features designed end to end alongside the engineering team.",
      },
      {
        title: "Outcome",
        body: "A complete HR platform — and a role that grew from designing interfaces to shaping the product, all the way to implementation.",
      },
    ],
    story: {
      lead: "A platform born to support young talent, now an HRIS. I grew alongside it.",
      trackLabels: { product: "The product", role: "My role" },
      beats: [
        {
          type: "stage",
          period: "At first",
          product: {
            title: "A tool for training organisations",
            body: "UpikaJob supported young talent entering the workforce: tracking apprentices, interns and junior employees, with day-to-day guidance built in.",
          },
          role: {
            title: "UI/UX Designer",
            body: "I took over the existing journeys, made the screens more reliable and brought components into line.",
          },
          shots: [
            { caption: "The dashboard when I arrived" },
            { caption: "Young talent, by the numbers" },
            { caption: "An apprentice's tracking record" },
            { caption: "Skills validation" },
          ],
        },
        {
          type: "pivot",
          label: "First turn",
          statement:
            "The expertise built around young talent turns out to matter far beyond training organisations.",
        },
        {
          type: "stage",
          period: "Then",
          product: {
            title: "The scope widens",
            body: "HR teams and managers become users in their own right. The product moves beyond training and into talent management.",
          },
          role: {
            title: "Designer of the redesigns",
            body: "I carried the successive redesigns, evolved the visual identity, and laid the foundations of the design system with the team.",
          },
          shots: [
            { caption: "Logotype variations" },
            { caption: "Type scale and tokens" },
            { caption: "Component library" },
            { caption: "File structure and shared styles" },
          ],
        },
        {
          type: "pivot",
          label: "Change of course",
          statement:
            "UpikaJob becomes an HRIS — a complete HR platform, without giving up what it does best.",
        },
        {
          type: "stage",
          period: "Next",
          product: {
            title: "An HR platform",
            body: "Talent management, team tracking, tools for managers: the product gains functional depth and a higher bar for quality.",
          },
          role: {
            title: "Product Designer",
            body: "I design the interface of the new product, screen after screen, setting the bearings of a platform built for HR professionals.",
          },
          shots: [
            { caption: "The new platform's dashboard" },
            { caption: "New identity, new interface" },
            { caption: "HR and managerial steering" },
          ],
        },
        {
          type: "stage",
          period: "In depth",
          product: {
            title: "Features in their own right",
            body: "Annual reviews, skills mapping, steering indicators, employee profiles: each building block calls for its own framing.",
          },
          role: {
            title: "Designing end to end",
            body: "From framing the need through to release, working with developers every single day.",
          },
          shots: [
            { caption: "Annual review campaigns" },
            { caption: "Skills mapping" },
            { caption: "Indicators and global filters" },
            { caption: "Employee profile" },
          ],
        },
        {
          type: "stage",
          period: "Today",
          product: {
            title: "An HRIS in its own right",
            body: "The platform serves HR teams and managers — and speaks to them right down to its public site: offering, pricing, documentation.",
          },
          role: {
            title: "Product Designer — design & implementation",
            body: "I designed the marketing site, then built it on my own. Vibe Coding now lets me ship part of what I design myself.",
          },
          shots: [
            { caption: "Site home page" },
            { caption: "Solution overview" },
            { caption: "Pricing" },
          ],
        },
      ],
      closing: {
        title: "What it adds up to",
        body: "The platform as it stands online today, and the marketing site I designed then built on my own.",
        link: { label: "Visit the site" },
      },
    },
  },
};

export const enMethodSteps = [
  {
    title: "Understand the client's context and needs",
    body: "The first step is to understand the project's goals, needs, target audience, and competitive landscape.",
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
    body: "I turn hypotheses into interfaces, prototypes, and testable deliverables to quickly validate decisions.",
  },
  {
    title: "Deliver and support",
    body: "Deliverables are prepared cleanly, documented, and designed to be handed off or deployed by teams.",
  },
];
