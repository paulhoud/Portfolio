import type { SiteCopy } from "../types";

export const frSite: SiteCopy = {
  meta: {
    title: "Paul Houdebine - Product Designer",
    description:
      "Portfolio de Paul Houdebine, Product Designer de bout en bout : de la vision produit au front-end.",
  },
  nav: {
    method: "Méthodologie",
    about: "À propos",
    contact: "Contact",
    home: "Accueil",
    main: "Navigation principale",
    mobile: "Navigation mobile",
    footer: "Liens du pied de page",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    skipToContent: "Aller au contenu",
  },
  footer: {
    copyright: "© 2026 Paul Houdebine.",
    rights: "Tous droits réservés.",
    models: "Modèles 3D",
    by: "par",
    legal: "Mentions légales",
    audience: "Mesure d'audience anonyme, sans cookie.",
    optOut: "Ne pas être compté",
    optedOut: "Vous n'êtes plus compté sur cet appareil.",
    optIn: "Annuler",
  },
  theme: {
    label: "Thème clair",
    toLight: "Passer en thème clair",
    toDark: "Passer en thème sombre",
  },
  sound: {
    mute: "Couper le son",
    unmute: "Activer le son",
    label: "Son",
    volume: "Volume",
    unmuteShort: "Activer",
    on: "Activé",
    off: "Coupé",
  },
  gallery: {
    intro:
      "Product Designer de bout en bout : vision produit, recherche utilisateur, UX/UI, design system et front-end, du cadrage à la mise en production.",
    listLabel: "Projets",
    viewProject: "Voir le projet",
    nextProject: "Projet suivant",
    scrollHint: "Faire défiler",
    swipeHint: "Glissez vers le haut",
    headphones: "Meilleure expérience avec un casque",
    lostTitle: "Vous dérivez dans une autre dimension.",
    lostHint: "Les projets flottent quelque part par ici…",
    lostHintDofus: "Un marais doré, quelque part dans le monde des Douze…",
    lostHintSouthPark: "Il neige sur une petite ville du Colorado…",
    disclaimerDofus: "Clin d'œil non officiel à Dofus (© Ankama). Sans usage commercial, sans affiliation.",
    disclaimerSouthPark:
      "Clin d'œil non officiel à South Park (© Comedy Central). Sans usage commercial, sans affiliation.",
    lostBack: "Retour",
    portal: "Autre dimension",
    secretHint: "Psst… tapez « destroy » sur l'accueil.",
  },
  projectNav: {
    label: "Autres projets",
    previous: "Projet précédent",
    next: "Projet suivant",
  },
  language: {
    switchTo: "Changer de langue",
    french: "Français",
    english: "English",
  },
  common: {
    back: "Retour",
    viewOnFigma: "Voir sur Figma",
    watchVideo: "Voir la vidéo",
    seeSite: "Voir le site",
    seeVideo: "Voir la vidéo",
  },
  method: {
    title: "Ma méthode",
    introTitle: "En bref",
    introOne:
      "Je suis Product Designer, et la conception ne commence pas dans Figma. Elle commence par comprendre le problème, chercher des pistes ailleurs que dans les solutions existantes, puis rendre les idées concrètes le plus tôt possible : maquette, prototype ou première version qui fonctionne.",
    introTwo:
      "Ces cinq temps ne forment pas une ligne droite. Ils se chevauchent, se répètent, et je les dose selon le projet, le temps disponible et ce qui est en jeu. L'IA m'accompagne à chacun d'eux, sans décider à ma place.",
    phasesLabel: "Les cinq temps de la méthode",
    loop: "et on y revient",
    aiLabel: "Avec l'IA",
    toolsLabel: "Méthodes et outils",
    loopNote:
      "Souvent, on repart d'un temps précédent : ce qu'on apprend en testant renvoie à la compréhension du besoin, et une expérimentation peut rouvrir l'exploration.",
    ai: {
      title: "L'IA, partenaire de conception",
      intro:
        "L'IA fait aujourd'hui partie de ma façon de travailler. Pas pour aller plus vite à tout prix : pour explorer plus de possibilités, et concrétiser des idées que je n'aurais pas eu le temps de construire.",
      partners: [
        {
          name: "GPT",
          use: "Structurer mes réflexions, explorer des pistes, approfondir un sujet, et construire des prompts précis, adaptés à ce que je cherche à obtenir.",
        },
        {
          name: "Claude et Claude Code",
          use: "M'accompagner dans l'implémentation et le développement : passer d'une idée à une première version, puis itérer sur le produit.",
        },
      ],
      mine: "Ce qui reste à moi : poser le problème, choisir la direction créative, évaluer les résultats et arbitrer. L'IA ne remplace pas mon raisonnement de Product Designer, elle l'outille.",
    },
    tools: {
      title: "Des outils choisis pour l'expérience visée",
      intro:
        "Je choisis les outils en fonction de l'expérience que je cherche à concevoir, et non l'inverse. Mon environnement de travail, selon les projets :",
      items: [
        { name: "GPT", use: "Réflexion, exploration de pistes, construction de prompts" },
        { name: "Claude, Claude Code", use: "Développement, implémentation, itérations sur le produit" },
        { name: "Figma", use: "Interfaces, wireframes, prototypes, design systems, parcours" },
        { name: "Blender", use: "Éléments 3D, quand un projet le justifie" },
        { name: "Unity", use: "Prototypes d'environnements interactifs, quand c'est pertinent" },
      ],
      note: "Je ne les utilise pas tous sur chaque projet, ni avec la même profondeur : ce sont des possibilités que je choisis, ou que j'explore.",
    },
  },
  methodSteps: [
    {
      id: "comprendre",
      phase: "Comprendre",
      title: "Comprendre avant de concevoir",
      lead: "Trouver le bon problème à résoudre compte plus que la première solution venue.",
      body: [
        "Je commence par le contexte : qui utilise le produit, dans quelle situation, avec quels objectifs métier et quelles contraintes. Je formule ensuite ce que je crois avoir compris sous forme d'hypothèses, pour les vérifier plutôt que les supposer.",
        "Pour trouver les besoins, les irritants et les opportunités, je choisis les outils selon le contexte : entretiens avec des utilisateurs, analyse des retours, tests sur l'existant, benchmark des solutions et des pratiques du marché. Chez UpikaJob, je recueille moi-même les retours des clients : c'est souvent là que se trouvent les vraies priorités. Quand le temps manque, je fais moins, mais je ne saute pas cette étape.",
        "J'en sors avec des pistes d'amélioration classées par priorité, partagées avec l'équipe.",
      ],
      ai: "Structurer ce que j'ai appris : regrouper des retours, faire ressortir des tendances, reformuler une problématique, lister les angles que j'aurais pu oublier. Les conclusions, elles, viennent du terrain.",
      tools: ["Entretiens", "Analyse des retours", "Tests", "Benchmark", "GPT"],
    },
    {
      id: "explorer",
      phase: "Explorer",
      title: "Nourrir la réflexion",
      lead: "Regarder ailleurs, pour ne pas reproduire mécaniquement ce qui existe.",
      body: [
        "Ma veille ne consiste pas à collectionner de jolies interfaces. Je suis l'évolution du Product Design et de l'UX/UI, les nouveaux usages et les interactions qui émergent, les expériences web immersives et l'animation, les outils de prototypage et de développement, et ce que l'IA rend possible.",
        "Face à un sujet, cette matière me sert à ouvrir plusieurs directions avant d'en retenir une : comparer des approches, voir comment d'autres produits ont résolu un problème proche, repérer ce qui peut surprendre sans dérouter. L'accueil en 3D de ce portfolio est né d'une exploration de ce genre.",
      ],
      ai: "Élargir le champ : confronter plusieurs approches, approfondir un sujet que je connais mal, générer des premières pistes créatives que je trie ensuite.",
      tools: ["Veille", "Références", "Systèmes de design", "GPT"],
    },
    {
      id: "concevoir",
      phase: "Concevoir",
      title: "Rendre les idées tangibles",
      lead: "Plus tôt une idée prend forme, plus tôt on voit si elle tient.",
      body: [
        "Je fais passer une idée par plusieurs niveaux de fidélité : formaliser le concept, esquisser des parcours et des wireframes, puis des maquettes et des prototypes interactifs dans Figma, appuyés sur un design system quand il existe.",
        "Chaque niveau sert à décider quelque chose : un wireframe valide une structure, un prototype valide une interaction. Je n'ajoute du détail que quand la question précédente est réglée.",
      ],
      ai: "Préparer le terrain : contenus réalistes, variantes de formulation, cas limites à prévoir dans les écrans.",
      tools: ["Croquis", "Wireframes", "Prototypes", "Design system", "Figma"],
    },
    {
      id: "experimenter",
      phase: "Expérimenter",
      title: "Expérimenter et construire",
      lead: "Entre la maquette et le produit, la frontière est devenue plus fluide.",
      body: [
        "Quand le projet le justifie, je pousse l'expérimentation plus loin : animations, éléments 3D, environnements interactifs. J'explore alors Blender pour créer des éléments 3D, ou Unity pour prototyper un environnement interactif.",
        "Je passe aussi de la conception à l'implémentation. Chez UpikaJob, je prends en charge le front-end en binôme avec le développeur. Avec Claude et Claude Code, je peux aller jusqu'à une première version qui fonctionne, la tester en conditions réelles et itérer dessus : ce portfolio a été construit ainsi.",
        "Tous les projets n'ont pas besoin de code, de 3D ou d'IA. Je choisis le niveau de réalisation selon ce qu'on cherche à apprendre.",
      ],
      ai: "C'est là que Claude intervient le plus : m'accompagner dans le développement, implémenter, corriger, et raccourcir la boucle entre une idée et sa version testable.",
      tools: ["Animation", "3D", "Front-end", "Claude", "Claude Code", "Blender", "Unity"],
    },
    {
      id: "valider",
      phase: "Valider",
      title: "Valider, itérer, améliorer",
      lead: "L'expérimentation reste au service de l'expérience utilisateur.",
      body: [
        "Je vérifie que la solution répond au besoin de départ : les interfaces et les interactions sont-elles comprises ? Où sont les points de friction ? Je recueille des retours, j'observe, et j'ajuste les choix de conception.",
        "Il s'agit de concilier la qualité d'usage, la cohérence visuelle, la faisabilité technique et les objectifs métier. Le travail ne s'arrête pas à la livraison d'une maquette ou d'un prototype : je suis la fonctionnalité jusqu'en production, puis je regarde comment elle vit.",
      ],
      ai: "Analyser des retours en volume et préparer des tests. L'évaluation finale reste la mienne, et celle des utilisateurs.",
      tools: ["Tests utilisateurs", "Retours", "Itérations", "Suivi en production"],
    },
  ],
  about: {
    title: "À propos",
    intro: [
      "Je m'appelle Paul Houdebine, Product Designer. Je conçois des produits de bout en bout : de la vision produit et de la recherche utilisateur jusqu'au front-end, livré en binôme avec les développeurs.",
      "Chez UpikaJob, j'en suis le seul designer depuis 2024. Je cadre les choix UX, je recueille moi-même les retours des clients, je fais vivre le design system et je prends en charge le front-end. J'y ai conçu et construit les écrans des fonctionnalités d'IA : chatbot et synthèses générées par l'IA. Je porte aussi l'image de la marque : site, print, motion, vidéo.",
      "Basé entre Bordeaux et Paris.",
    ],
    sections: [
      {
        title: "Parcours",
        body: "Diplômé du programme Grande École de HETIC (2016–2021), un master qui mêle web design, développement web et webmarketing. J'ai commencé par un stage UX/UI chez Fidesio, une agence web (2018), puis deux stages de consultant junior chez SÆGUS, en 2019 et en 2020, pour des clients comme Orange, Capgemini et la Fondation Sanofi Espoir. À HETIC, j'ai aussi réalisé un projet professionnalisant pour la Maison Yves Delorme (2019–2020). J'ai ensuite été le premier designer de Memento, une start-up où j'ai passé un an en alternance (2021–2022). Depuis 2024, je suis le seul designer d'UpikaJob.",
      },
      {
        title: "Ce que je fais",
        body: "Vision produit et cadrage, recherche et tests utilisateurs, conception UX/UI, fonctionnalités d'IA, design system, specs et front-end - puis l'identité de la marque : site, print, motion design et vidéo.",
      },
      {
        title: "Compétences",
        body: "Product discovery, interviews et tests utilisateurs, UX/UI, prototypage, design system et tokens, intégration front-end, travail en sprints avec les développeurs, motion design.",
      },
      {
        title: "Outils",
        body: "Figma, Miro et la suite Adobe pour concevoir ; HTML, CSS, JavaScript, Tailwind et Symfony pour livrer, avec Cursor, VS Code et Claude.",
      },
    ],
    photoAlt: "Portrait de Paul Houdebine, Product Designer",
    stack: {
      heading: "Outils & technologies",
      design: "Outils de conception",
      dev: "Développement",
      ai: "Modèles d'IA",
      os: "Systèmes d'exploitation",
      browsers: "Navigateurs web",
    },
  },
  contact: {
    title: "Contact",
    intro:
      "Un produit à faire grandir ? Parlons de votre équipe, de vos utilisateurs et de ce que vous voulez livrer.",
    emailLabel: "Écrire un e-mail",
    socialLabel: "Me retrouver ailleurs",
    locationLabel: "Basé entre",
    cvLabel: "Télécharger mon CV",
    write: "Écrire",
    copy: "Copier l'adresse",
    copied: "Adresse copiée",
    localTime: "heure locale",
  },
};
