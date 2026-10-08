// Le type vit dans `../types` : il était auparavant redéclaré ici, si bien que
// toute évolution du modèle devait être reportée à deux endroits.
import type { ProjectTranslations } from "../types";

export const enProjectTranslations: ProjectTranslations = {
  memento: {
    title: "Memento",
    eyebrow: "First designer at a startup: product, design system and content",
    description:
      "A one-year apprenticeship as Memento's first designer, a SaaS redistributing event photos: interfaces, design system, videos and print.",
    context: "Apprenticeship · January 2021 – January 2022",
    sections: [
      {
        title: "Overview",
        body: "Memento is a SaaS that hands every guest the photos taken of them at an event, using the cloud and facial recognition. I spent a year there as an apprentice, from January 2021 to January 2022. The startup has since taken the idea further: an AI-driven photo agent now delivers each attendee their own shots automatically.",
      },
      {
        title: "Challenges",
        body: "Memento had no designer yet. To grow, the team needed to improve its app and produce a lot of content at the same time: social media visuals, videos explaining the service, event materials.",
      },
      {
        title: "Solution",
        body: "I designed the app's new mockups and prototypes in Figma, and built then maintained an atomic design system so it could grow without losing consistency. Alongside, I produced motion design videos in After Effects and print materials — roll-up banners, posters, flyers — in InDesign.",
      },
      {
        title: "Outcome",
        body: "My work modernised Memento's identity. The presentation video became the founders' go-to support to showcase the solution, and its release went hand in hand with the client count tripling over three months.",
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
      { title: "B2B presentation video" },
    ],
  },

  "yves-delorme": {
    title: "Yves Delorme",
    eyebrow: "L'Odyssée — redesigning the digital ecosystem",
    description:
      "A full redesign of the customer experience for Maison Yves Delorme, from in-store research to high-fidelity prototyping.",
    context: "Client: Maison Yves Delorme · 2019–2020",
    introParagraphs: [
      "L'Odyssée is a project to fully redesign the digital ecosystem of Maison Yves Delorme. It aims to harmonize the customer experience across the boutique, advisory services, and digital tools.",
      "With the marketing and sales teams, I worked on the customer journey, the interface architecture and the priority scenarios to prototype.",
      "The approach combined field immersion, UX/UI formalization, and the production of concrete deliverables to shape a more cohesive, premium, service-oriented experience.",
    ],
    media: [
      { title: "In-store working session with the sales team" },
      { title: "Review of customer expectations and needs" },
      { title: "Defining goals and communication strategy" },
      { title: "Creating the visual identity and brand guidelines" },
      { title: "High-fidelity prototyping of the site's key pages" },
      { title: "Site in context on tablet" },
      { title: "Product configurator video" },
    ],
  },

  jive: {
    title: "Jive",
    eyebrow: "Improving an intranet platform with a design thinking add-on",
    description:
      "Designing a Jive add-on for Orange to run design thinking workshops directly within the intranet.",
    context: "Internship at SÆGUS · Client: Orange · 2020",
    sections: [
      {
        title: "Overview",
        body: "During my second internship at SÆGUS, I joined an Orange team as a junior design consultant. The goal: improve how Jive, the intranet employees use every day, was being used.",
      },
      {
        title: "Challenges",
        body: "Orange needed to run Kanban-style ideation workshops directly in Jive, without multiplying external tools or losing participants in overly complex interfaces.",
      },
      {
        title: "Solution",
        body: "I led the design of a Jive add-on following a design thinking approach: a design thinking workshop (Miro, Figma) to gather needs, then a tool made of reusable modules, designed together with a developer, from mockup through to integration.",
      },
      {
        title: "Outcome",
        body: "By the end of the mission, the Orange team had a ready-to-use tool to organise its work in Kanban within Jive itself.",
      },
    ],
    media: [
      { title: "Design system organization" },
      { title: "Prototype organization" },
      { title: "Agile training feedback video, made for Orange during my first internship (2019)" },
      { title: "Miro board organization" },
    ],
  },

  "sanofi-espoir": {
    title: "Sanofi Espoir",
    eyebrow: "Maternal and neonatal health in Senegal: strengthening local impact",
    description:
      "A design mission for the Sanofi Espoir Foundation focused on maternal and neonatal health in Senegal.",
    context: "Internship at SÆGUS · Client: Sanofi Espoir Foundation · 2019",
    sections: [
      {
        title: "Overview",
        body: "During my first internship at SÆGUS, I worked on a mission for the Sanofi Espoir Foundation around maternal and neonatal health in Senegal. The goal was to better understand local care pathways to strengthen the foundation's impact. I produced the workshop wrap-up content and contributed to the experience map of the women's journey.",
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
      { title: "Film storyboard" },
      { title: "Accelerating Local Impact — wrap-up film" },
      { title: "Project presentation video" },
      { title: "A detailed analysis of the patient experience and pain points along the journey" },
    ],
  },

  fidesio: {
    title: "Fidesio",
    eyebrow: "UX/UI internship at an agency: a website, an internal tool and newsletters",
    detailSubtitle: "UX/UI and branding work at a web agency",
    description:
      "A UX/UI internship at the Fidesio web agency: mockups for the Montaigne Capital website, an internal project-tracking tool and newsletter banners for a museum shop.",
    context: "UX/UI internship at the Fidesio agency · Jul–Sep 2018",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Overview",
            body: "In summer 2018, I spent three months as a UX/UI intern at Fidesio, a Paris web agency. I worked on interface and branding assignments for several clients, and on the agency's internal tools.",
          },
          {
            title: "Challenges",
            body: "Designing web and software interfaces that stay consistent from one project to the next, both for tender responses and for in-house tools.",
          },
          {
            title: "Solution",
            body: "I designed these interfaces following an atomic design convention, and ran \"How Might We\" UX workshops with user interviews and tests.",
          },
        ],
      },
      {
        type: "media",
        media: [
          { title: "Internal project-tracking tool" },
          { title: "Weekly view and activity tracking" },
        ],
      },
      {
        type: "sections",
        sections: [
          {
            title: "Internal tool",
            body: "For the agency, a project-tracking application: tickets by client and by team member, time spent, weekly and monthly views.",
          },
          {
            title: "Montaigne Capital",
            body: "Mockups for an asset manager's website: home page, fund pages with performance indicators, regulatory documents to download and a historical price simulator.",
          },
        ],
      },
      {
        type: "media",
        media: [
          { title: "Montaigne Capital — home page" },
          { title: "Montaigne Capital — fund page" },
        ],
      },
      {
        type: "sections",
        sections: [
          {
            title: "Newsletters",
            body: "Banners for a museum shop's newsletters: time-limited promotional offers on products inspired by works by Van Gogh and Monet, with a strong call to action.",
          },
        ],
      },
      {
        type: "media",
        media: [
          { title: "Newsletter — fashion offer" },
          { title: "Newsletter — Impressionist selection" },
        ],
      },
    ],
  },

  capgemini: {
    title: "Capgemini",
    eyebrow: "Illustrating use cases to reach a broad audience",
    description:
      "Creating animated videos for Capgemini to illustrate Microsoft 365 use cases.",
    context: "Internship at SÆGUS · Client: Capgemini · 2019",
    sections: [
      {
        title: "Overview",
        body: "During my first internship at SÆGUS, I worked for Capgemini on animated videos featuring characters and sets, made in After Effects with the Duik plugin.",
      },
      {
        title: "Challenges",
        body: "The brief called for four animated use cases — three are shown below — with many scenes and a heavy animation workload, on a tight deadline for a long-standing client.",
      },
      {
        title: "Solution",
        body: "I ran production more and more autonomously, drawing on my skills in graphic design, art direction and animation.",
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

  baio: {
    title: "Baio",
    eyebrow: "Building a gamified app that encourages healthier shopping",
    description:
      "Designing a gamified mobile app to encourage healthier eating habits.",
    context: "Mobile app concept",
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
        caption: "Screens from the previous version of the app",
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
        media: [{ title: "Animated app presentation" }],
      },
      {
        type: "media",
        media: [{ title: "View organization and filters in Figma" }],
      },
    ],
  },

  saegus: {
    title: "SÆGUS",
    eyebrow: "2021 greeting card: landing page, emailing and social media",
    description:
      "Designing SÆGUS's 2021 digital greeting card: desktop and mobile landing page, personalised email, print version and LinkedIn visuals.",
    context: "Internship at SÆGUS · internal project · 2020",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Overview",
            body: "During my second internship at SÆGUS, in 2020, I designed the firm's digital greeting card for 2021: a landing page in desktop and mobile versions, adapted for emailing, print and LinkedIn.",
          },
          {
            title: "Challenges",
            body: "Create a premium, festive experience that reflects SÆGUS's identity while highlighting the year's successes and the team's outlook.",
          },
          {
            title: "Solution",
            body: "I worked on a strong visual direction around purple, key figures, and testimonials, with a modular architecture designed for web and email.",
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
          { title: "Digital greeting card" },
          { title: "Editorial version of the greeting card" },
        ],
      },
      {
        type: "media",
        media: [{ title: "Screen organization in Figma" }],
      },
    ],
  },

  "le-grand-menage": {
    title: "Le Grand Ménage",
    eyebrow: "Making a short film in two weeks, from writing to editing",
    context: "Short film · multidisciplinary team · 2 weeks",
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
    eyebrow: "An HRIS for HR teams and managers",
    description:
      "Sole designer of an HRIS since 2024: product vision, user research, UX/UI, design system and front-end, paired with the developer.",
    context: "Current role · since January 2024 · sole designer",
    sections: [
      {
        title: "Overview",
        body: "UpikaJob is now an HRIS: a platform that equips HR teams and managers to follow their people — reviews, skills, objectives, steering indicators. It began as something quite different, a tool for training organisations supporting young talent into work. I have been its sole designer since January 2024, and I lived that transformation from the inside, from the first redesigns through to the product as it stands today.",
      },
      {
        title: "Challenge",
        body: "The company realised its craft — structuring guidance, making progress measurable, equipping a mentor — reached far beyond apprenticeships. That meant speaking to a far more demanding audience, HR professionals, without disowning the expertise that made the product strong. A change of scale as much as of audience: more data, more roles, more business rules, and the usability expectations of a tool people live in all day.",
      },
      {
        title: "Solution",
        body: "Several successive redesigns, each carrying a shift in vision rather than a simple refresh. A visual identity reworked in depth, then a design system shared with the developer — primitives, tokens, documented components — so that coherence would hold as the product grew. And features taken end to end: user interviews and tests, framing, trade-offs, specs, design, then front-end in pair through to release.",
      },
      {
        title: "Outcome",
        body: "A complete HR platform whose design I now carry end to end: product vision, UX/UI, design system and front-end. I also designed then built the marketing site on my own, with AI-assisted coding tools, and I produce the brand's content: video, motion design, print, social media.",
      },
      {
        title: "By the numbers",
        body: "Reviews, the chatbot and AI-generated summaries, whose screens I designed and built, have taken off since I joined. Between 2024 and 2025, reviews held rose from 2,870 to 7,901 (×2.8), active employees from 1,915 to 3,552, and AI-generated summaries from 2,880 to 9,216. Growth continues in 2026: as of 8 October, 6,403 reviews had already been held, 21% more than at the same date in 2025. In total since 2024: more than 17,000 reviews held and nearly 800,000 messages exchanged with the chatbot.",
      },
    ],
    story: {
      lead: "A platform born to support young talent, now an HRIS. I am its sole designer, from product vision through to the front-end.",
      highlight: {
        label: "The product today",
        title: "An HRIS that equips HR teams and managers day to day",
        body: "People steering, review campaigns, skills mapping, tracking indicators: designed screen by screen, then shipped in pair with the developer.",
        shots: [
          { caption: "The dashboard" },
          { caption: "HR and managerial steering" },
          { caption: "Skills mapping" },
        ],
      },
      bridge: "The product did not always look like this.",
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
            body: "I led the successive redesigns, reworked the visual identity and logotype, and laid the foundations of a design system shared with the developer.",
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
            body: "I frame the product vision and UX decisions, then design the new product's interface, screen after screen, for HR professionals.",
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
            body: "Annual reviews, AI-generated summaries, chatbot, skills mapping, steering indicators, employee profiles: each building block calls for its own framing.",
          },
          role: {
            title: "Designing end to end",
            body: "User interviews and tests, client feedback gathered first-hand, specs, sprints: every feature, AI screens included, goes from framing to release, paired daily with the developer.",
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
            body: "I take charge of the product's front-end, paired with the developer. The marketing site, I designed then built on my own.",
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
        body: "The platform as it stands online today, its presentation videos, and the marketing site I designed then built on my own.",
        link: { label: "Visit the site" },
      },
    },
    media: [
      { title: "The platform in ninety seconds" },
      { title: "Platform presentation trailer" },
    ],
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
