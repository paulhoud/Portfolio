import type { StaticImageData } from "next/image";
import type { MediaKey } from "./generated/media-manifest";
// Vignettes des vidéos YouTube, servies localement plutôt que depuis les
// serveurs de YouTube : rien n'est chargé tant que la lecture n'a pas démarré.
import videoUpikajob from "../../assets/video-upikajob.jpg";
import videoUpikajobPitch from "../../assets/video-upikajob-pitch.jpg";
// Récit UpikaJob : l'ancienne application, l'identité et le système, la
// plateforme actuelle, puis le site vitrine.
import upikaOldDashboard from "../../assets/upika-old-dashboard.png";
import upikaOldTalents from "../../assets/upika-old-talents.png";
import upikaOldSuivi from "../../assets/upika-old-suivi.png";
import upikaOldCompetences from "../../assets/upika-old-competences.png";
import upikaLogotype from "../../assets/upika-logotype.png";
import upikaTypescale from "../../assets/upika-typescale.png";
import upikaFigmaComponents from "../../assets/upika-figma-components.png";
import upikaFigmaTokens from "../../assets/upika-figma-tokens.png";
import upikaNewDashboard from "../../assets/upika-new-dashboard.png";
import upikaNewLogin from "../../assets/upika-new-login.jpg";
import upikaNewPilotage from "../../assets/upika-new-pilotage.png";
import upikaNewEntretiens from "../../assets/upika-new-entretiens.png";
import upikaNewCompetences from "../../assets/upika-new-competences.png";
import upikaNewIndicateurs from "../../assets/upika-new-indicateurs.png";
import upikaNewProfil from "../../assets/upika-new-profil.png";
import upikaSiteHome from "../../assets/upika-site-home.png";
import upikaSiteSolution from "../../assets/upika-site-solution.png";
import upikaSiteTarifs from "../../assets/upika-site-tarifs.jpg";
import videoMemento from "../../assets/video-memento.jpg";
import videoYvesDelorme from "../../assets/video-yves-delorme.jpg";
import videoSanofiImpact from "../../assets/video-sanofi-impact.jpg";
import videoSanofiProject from "../../assets/video-sanofi-project.jpg";
import videoBaio from "../../assets/video-baio.jpg";
import videoOrangeAgile from "../../assets/video-orange-agile.jpg";
import mementoEvent from "../../assets/img-63.png";
import mementoLanding from "../../assets/img-64.png";
import mementoStoryboard from "../../assets/img-65.png";
import mementoStats from "../../assets/img-66.png";
import mementoPoster from "../../assets/img-67.png";
import mementoFlyer from "../../assets/img-68.png";
import mementoFaq from "../../assets/img-69.png";
import yvesDelormeWorkshop from "../../assets/img-57.png";
import yvesDelormeNeeds from "../../assets/img-58.png";
import yvesDelormeStrategy from "../../assets/img-59.png";
import yvesDelormeDesignSystem from "../../assets/img-60.png";
import yvesDelormePrototype from "../../assets/img-61.png";
import yvesDelormeTablet from "../../assets/img-62.png";
import jiveDesignSystem from "../../assets/img-54.png";
import jivePrototype from "../../assets/img-55.png";
import jiveMiro from "../../assets/img-56.png";
import sanofiField from "../../assets/img-48.png";
import sanofiCenters from "../../assets/img-49.png";
import sanofiSupport from "../../assets/img-50.png";
import sanofiWorkshop from "../../assets/img-51.png";
import sanofiStoryboard from "../../assets/img-52.png";
import sanofiExperienceMap from "../../assets/img-53.png";
import fidesioAppCalendar from "../../assets/img-42.png";
import fidesioAppWeek from "../../assets/img-43.png";
import fidesioWebsite from "../../assets/img-44.png";
import fidesioDashboard from "../../assets/img-45.png";
import fidesioBannerTeal from "../../assets/img-46.png";
import fidesioBannerRed from "../../assets/img-47.png";
import capgeminiOutlook from "../../assets/img-39.png";
import capgeminiOnedrive from "../../assets/img-40.png";
import capgeminiOfficeOnline from "../../assets/img-41.png";
import baioEcoCourses from "../../assets/img-32.png";
import baioCommunity from "../../assets/img-33.png";
import baioShoppingList from "../../assets/img-34.png";
import baioScanTicket from "../../assets/img-35.png";
import baioOffers from "../../assets/img-36.png";
import baioOnboarding from "../../assets/img-37.png";
import baioFigma from "../../assets/img-38.png";
import saegusVoeux from "../../assets/img-23.png";
import saegusWishes from "../../assets/img-25.png";
import saegusFigma from "../../assets/img-26.png";
import saegusRexSteps from "../../assets/img-30.png";
import saegusRexThanks from "../../assets/img-31.png";
import grandMenagePoster from "../../assets/img-19.png";
import grandMenageFilming from "../../assets/img-20.png";
import grandMenageEditing from "../../assets/img-21.png";
import grandMenageLobby from "../../assets/img-22.png";
import archiveFruits from "../../assets/archive-fruits.png";
import archiveBauhaus from "../../assets/img-11.png";
import archiveSpace from "../../assets/img-10.png";
import archiveDreamcatcher from "../../assets/img-9.png";
import archivePainting from "../../assets/img-8.png";
import archiveCitron from "../../assets/archive-citron-triptyque.png";
import archiveGecko from "../../assets/img-4.png";
import archiveSkate from "../../assets/img-3.png";

export type ProjectSection = {
  title: string;
  body: string;
};

export type ProjectMedia = {
  title: string;
  image: StaticImageData;
  /** Source vidéo optionnelle : si présente, le média s'ouvre en vidéo dans la visionneuse (l'image sert de poster). */
  video?: string;
  /**
   * Identifiant d'une vidéo YouTube. Le média s'ouvre alors dans la visionneuse
   * sous forme de lecteur intégré, sans quitter le portfolio (l'image sert de
   * vignette).
   */
  youtubeId?: string;
  size?: "narrow" | "regular" | "wide";
  variant?: "default" | "light";
  layout?: "single" | "row";
  link?: { label: string; href: string };
};

export type ProjectLink = {
  label: string;
  href: string;
};

export type ProjectBlock =
  | { type: "sections"; sections: ProjectSection[] }
  | {
      type: "media";
      media: ProjectMedia[];
      layout?: "stack" | "row" | "feature-grid";
      caption?: string;
    }
  | { type: "links"; links: ProjectLink[] };

/**
 * Emplacement de capture dans une page récit. Tant qu'aucune image n'est
 * fournie, un cadre vide est rendu à sa place : la mise en page est donc déjà
 * définitive, seules les captures manquent.
 */
export type ProjectStoryShot = {
  caption: string;
  image?: StaticImageData;
  /**
   * `screen` habille la capture d'un châssis d'écran, qui lui donne l'allure
   * d'un logiciel plutôt que d'une image collée. Réservé aux captures
   * d'interface : une planche d'identité ou une page web entière n'y gagne rien.
   */
  frame?: "screen" | "plain";
  /**
   * Force le réencodage avec perte (AVIF/WebP) d'une capture qui serait sinon
   * servie telle quelle.
   *
   * Par défaut, un PNG est diffusé intact : ce format compresse les aplats et
   * le texte d'interface mieux que tout encodage avec perte, si bien que
   * l'optimiser abîmerait le texte *et*, mesure à l'appui, alourdirait souvent
   * le fichier. Les JPEG, eux, sont toujours réencodés — ils sont
   * photographiques, l'AVIF y gagne massivement.
   *
   * L'exception : les grandes planches (identité, bibliothèque de composants).
   * Elles pèsent plusieurs centaines de kilo-octets en PNG pour un gain de
   * netteté invisible à la taille où elles sont montrées, et le clic ouvre de
   * toute façon l'original dans la visionneuse.
   */
  optimize?: boolean;
};

/**
 * Une étape du récit : ce que devient le produit et ce que devient le rôle, au
 * même moment. Les deux sont montrés côte à côte, si bien que leur progression
 * conjointe se lit sans avoir à être commentée.
 */
export type ProjectStoryStage = {
  /** Repère temporel court (« Au départ », « Aujourd'hui »…). */
  period: string;
  product: { title: string; body: string };
  role: { title: string; body: string };
  shots: ProjectStoryShot[];
  /**
   * Présentation des captures. Faire varier ce mode d'une étape à l'autre évite
   * qu'une longue suite d'étapes ne devienne monotone.
   * - `stage` : une capture dominante, la seconde en incrustation ;
   * - `row` : deux captures de même poids, côte à côte ;
   * - `grid` : mosaïque régulière, pour une série homogène (planches d'identité,
   *   suite de fonctionnalités).
   */
  shotLayout?: "stage" | "row" | "grid";
};

/**
 * Une bascule stratégique. Rendue pleine largeur, hors de l'axe du récit, elle
 * interrompt volontairement le rythme : c'est ce qui distingue un changement de
 * cap d'une simple étape de plus.
 */
export type ProjectStoryPivot = {
  label: string;
  statement: string;
};

/** Temps fort du récit : une étape, ou une bascule entre deux étapes. */
export type ProjectStoryBeat =
  | ({ type: "stage" } & ProjectStoryStage)
  | ({ type: "pivot" } & ProjectStoryPivot);

/**
 * Récit d'un projet déroulé au fil du défilement. La liste des temps forts est
 * ouverte : ajouter une étape ou une bascule revient à ajouter une entrée.
 */
export type ProjectStory = {
  lead: string;
  /**
   * Mise en avant placée juste après l'en-tête : le produit tel qu'il est
   * aujourd'hui. Un visiteur qui ne fait que survoler la page voit ainsi
   * l'aboutissement avant que le récit ne remonte aux débuts.
   */
  highlight?: {
    label: string;
    title: string;
    body: string;
    shots: ProjectStoryShot[];
  };
  /** Phrase de bascule entre la mise en avant et le récit. */
  bridge?: string;
  /** Intitulés des deux trajectoires suivies en parallèle. */
  trackLabels: { product: string; role: string };
  beats: ProjectStoryBeat[];
  closing: { title: string; body: string; link?: ProjectLink };
};

export type ProjectHeaderLogo =
  | { kind: "image"; src: string; alt: string; width: number; height?: number; className?: string }
  | { kind: "jive-orange" };

export type Project = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  logo: string;
  logoKind?: "image" | "video";
  logoAlt: string;
  background: string;
  foreground: string;
  logoSize: "sm" | "md" | "lg" | "xl";
  logoScale?: number;
  /**
   * Grossissement appliqué à un logo vidéo dont l'image n'occupe qu'une partie
   * du cadre (export transparent avec de larges marges). Ne change pas la mise
   * en page : seule la vidéo est agrandie, ses marges transparentes débordent.
   */
  logoVideoZoom?: number;
  /**
   * Image animée transparente (WebP) affichée à la place d'un logo vidéo par
   * Safari et les navigateurs d'iPhone/iPad, qui ne gèrent pas la transparence
   * des vidéos WebM. Recadrée sur la zone utile : aucun grossissement requis.
   */
  logoFallback?: string;
  titleColor?: string;
  /**
   * Site officiel de l'entreprise ou de la marque concernée. Absent lorsqu'il
   * n'y en a pas (projet personnel, structure disparue).
   */
  companySite?: ProjectLink;
  /**
   * Cadre du projet, affiché sous l'en-tête de chaque page : type de contrat,
   * employeur, client, période (« Stage chez SÆGUS · Client : Orange »).
   *
   * Règle de nommage du site : le titre de la carte reprend la marque dont le
   * logo est animé sur la carte ; cette ligne dit pour qui et dans quel cadre
   * le travail a été fait. N'y écrire que des faits confirmés.
   */
  context?: string;
  detailVariant?: "default" | "editorial" | "case-study" | "story";
  /** Récit scrollé, utilisé par la variante « story ». */
  story?: ProjectStory;
  detailSubtitle?: string;
  headerLogo?: ProjectHeaderLogo;
  introParagraphs?: string[];
  sectionStyle?: "stacked" | "inline";
  blocks?: ProjectBlock[];
  animation: "orbit" | "float" | "sweep" | "pulse" | "tilt";
  /** Clé du média de la carte : image placeholder + animation .webm (cf. media-manifest). */
  mediaKey?: MediaKey;
  sections: ProjectSection[];
  gallery: string[];
  media?: ProjectMedia[];
};

const defaultSections: ProjectSection[] = [
  {
    title: "Vue d'ensemble",
    body: "Projet issu du portfolio Figma original. Le contenu est structurellement prêt pour accueillir les textes finaux, les visuels et les livrables propres à chaque mission.",
  },
  {
    title: "Enjeux",
    body: "Clarifier le positionnement, conserver l'identité graphique du projet et restituer une expérience fluide entre la grille de sélection et la page de détail.",
  },
  {
    title: "Solution",
    body: "Une page projet lisible, centrée sur le contexte, les décisions de design et les livrables. Les zones média sont préparées pour recevoir les photos exportées depuis Figma.",
  },
];

export const projects: Project[] = [
  {
    slug: "upikajob",
    companySite: { label: "UpikaJob", href: "https://www.upikajob.com/" },
    mediaKey: "UPIKAJOB",
    title: "UpikaJob",
    eyebrow: "SIRH pour les équipes RH et les managers",
    description:
      "Seul designer d'un SIRH depuis 2024 : vision produit, recherche utilisateur, UX/UI, design system et front-end, en binôme avec le développeur.",
    context: "Poste actuel · depuis janvier 2024 · seul designer",
    // Export transparent sans la feuille blanche (Paul, 8 oct. 2026). L'icône
    // occupe le centre d'un cadre de 960 px : le zoom lui rend sa taille
    // d'avant. La version WebP est recadrée sur 424 px autour de l'icône.
    logo: "/assets/upikajob-logo.webm",
    logoKind: "video",
    logoVideoZoom: 960 / 424,
    logoFallback: "/assets/upikajob-logo.webp",
    logoAlt: "Logo UpikaJob",
    background: "#ffffff",
    foreground: "#ffffff",
    titleColor: "#1897fe",
    logoSize: "lg",
    logoScale: 1.05,
    animation: "float",
    detailVariant: "story",
    story: {
      lead: "Une plateforme née pour accompagner les jeunes talents, devenue un SIRH. J'en suis le seul designer, de la vision produit jusqu'au front-end.",
      highlight: {
        label: "Le produit aujourd'hui",
        title: "Un SIRH qui outille les équipes RH et les managers au quotidien",
        body: "Pilotage des collaborateurs, campagnes d'entretiens, cartographie des compétences, indicateurs de suivi : conçus écran par écran, puis livrés en binôme avec le développeur.",
        shots: [
          { caption: "Le tableau de bord", image: upikaNewDashboard, frame: "screen" },
          { caption: "Pilotage RH et managérial", image: upikaNewPilotage, frame: "screen" },
          { caption: "Cartographie des compétences", image: upikaNewCompetences, frame: "screen" },
        ],
      },
      bridge: "Le produit n'a pas toujours eu ce visage.",
      trackLabels: { product: "Le produit", role: "Mon rôle" },
      beats: [
        {
          type: "stage",
          period: "Au départ",
          product: {
            title: "Un outil pour les organismes de formation",
            body: "UpikaJob accompagne l'insertion professionnelle des jeunes talents : suivi des alternants, des stagiaires et des jeunes collaborateurs, dans une logique d'assistance au quotidien.",
          },
          role: {
            title: "UI/UX Designer",
            body: "Je reprends les parcours existants, je fiabilise les écrans et j'harmonise les composants.",
          },
          shots: [
            { caption: "Le tableau de bord à mon arrivée", image: upikaOldDashboard, frame: "screen" },
            { caption: "Les jeunes talents en chiffres", image: upikaOldTalents, frame: "screen" },
            { caption: "Fiche de suivi d'un alternant", image: upikaOldSuivi, frame: "screen" },
            { caption: "Validation des compétences", image: upikaOldCompetences, frame: "screen" },
          ],
          shotLayout: "stage",
        },
        {
          type: "pivot",
          label: "Premier virage",
          statement:
            "L'expertise acquise auprès des jeunes talents intéresse bien au-delà des organismes de formation.",
        },
        {
          type: "stage",
          period: "Puis",
          product: {
            title: "Le périmètre s'élargit",
            body: "Équipes RH et managers deviennent des utilisateurs à part entière. Le produit sort du cadre de la formation pour entrer dans la gestion des talents.",
          },
          role: {
            title: "Designer des refontes",
            body: "Je mène les refontes successives, je reprends l'identité graphique et le logotype, et je pose les fondations d'un design system partagé avec le développeur.",
          },
          shots: [
            // Planches montrées en petit : l'original PNG pèse ici 5 à 10 fois
            // le réencodage, pour un gain de netteté qu'on ne voit pas.
            { caption: "Déclinaisons du logotype", image: upikaLogotype, optimize: true },
            { caption: "Échelle typographique et tokens", image: upikaTypescale, optimize: true },
            { caption: "Bibliothèque de composants", image: upikaFigmaComponents, optimize: true },
            {
              caption: "Organisation du fichier et styles partagés",
              image: upikaFigmaTokens,
              optimize: true,
            },
          ],
          shotLayout: "grid",
        },
        {
          type: "pivot",
          label: "Changement de cap",
          statement:
            "UpikaJob devient un SIRH — une plateforme RH complète, sans renoncer à ce qu'elle sait faire de mieux.",
        },
        {
          type: "stage",
          period: "Ensuite",
          product: {
            title: "Une plateforme RH",
            body: "Gestion des talents, suivi des équipes, outils pour les managers : le produit gagne en profondeur fonctionnelle et en exigence.",
          },
          role: {
            title: "Product Designer",
            body: "Je cadre la vision produit et les choix UX, puis je conçois l'interface du nouveau produit, écran après écran, pour des professionnels des RH.",
          },
          shots: [
            { caption: "Le tableau de bord de la nouvelle plateforme", image: upikaNewDashboard },
            { caption: "Nouvelle identité, nouvelle interface", image: upikaNewLogin, frame: "screen" },
            { caption: "Pilotage RH et managérial", image: upikaNewPilotage },
          ],
          shotLayout: "stage",
        },
        {
          type: "stage",
          period: "En profondeur",
          product: {
            title: "Des fonctionnalités à part entière",
            body: "Entretiens annuels, synthèses générées par l'IA, chatbot, cartographie des compétences, indicateurs de pilotage, profils collaborateurs : chaque brique demande son propre cadrage.",
          },
          role: {
            title: "Conception de bout en bout",
            body: "Interviews et tests utilisateurs, retours clients recueillis en direct, specs, sprints : chaque fonctionnalité, écrans d'IA compris, va du cadrage à la mise en production, en binôme quotidien avec le développeur.",
          },
          shots: [
            { caption: "Campagnes d'entretiens annuels", image: upikaNewEntretiens, frame: "screen" },
            { caption: "Cartographie des compétences", image: upikaNewCompetences },
            { caption: "Indicateurs et filtres globaux", image: upikaNewIndicateurs, frame: "screen" },
            { caption: "Profil collaborateur", image: upikaNewProfil, frame: "screen" },
          ],
          shotLayout: "grid",
        },
        {
          type: "stage",
          period: "Aujourd'hui",
          product: {
            title: "Un SIRH assumé",
            body: "La plateforme sert les équipes RH et les managers — et s'adresse à elles jusque dans sa vitrine : offre, tarifs, documentation.",
          },
          role: {
            title: "Product Designer — conception & implémentation",
            body: "Je prends en charge le front-end du produit en binôme avec le développeur. Le site vitrine, je l'ai conçu puis développé seul.",
          },
          shots: [
            { caption: "Page d'accueil du site", image: upikaSiteHome },
            { caption: "Présentation de la solution", image: upikaSiteSolution },
            { caption: "Grille tarifaire", image: upikaSiteTarifs },
          ],
          shotLayout: "stage",
        },
      ],
      closing: {
        title: "Ce que ça donne",
        body: "La plateforme telle qu'elle est en ligne aujourd'hui, ses vidéos de présentation, et le site vitrine que j'ai conçu puis développé seul.",
        link: { label: "Voir le site", href: "https://www.upikajob.com/" },
      },
    },
    sectionStyle: "inline",
    sections: [
      {
        title: "Vue d'ensemble",
        body: "UpikaJob est aujourd'hui un SIRH : une plateforme qui outille les équipes RH et les managers dans le suivi de leurs collaborateurs — entretiens, compétences, objectifs, indicateurs de pilotage. Elle est née tout autrement, comme un outil destiné aux organismes de formation pour accompagner l'insertion des jeunes talents. J'en suis le seul designer depuis janvier 2024 et j'ai vécu cette transformation de l'intérieur, des premières refontes jusqu'au produit actuel.",
      },
      {
        title: "Enjeu",
        body: "L'entreprise a compris que son savoir-faire — structurer un accompagnement, objectiver une progression, outiller un référent — dépassait largement le cadre de l'alternance. Il fallait donc s'adresser à une population bien plus exigeante, celle des professionnels RH, sans renier l'expertise qui faisait la force du produit. Un changement d'échelle autant que de public : plus de données, plus de rôles, plus de règles métier, et des attentes d'ergonomie propres à un outil utilisé toute la journée.",
      },
      {
        title: "Solution",
        body: "Plusieurs refontes successives, chacune accompagnant un changement de vision plutôt qu'un simple rafraîchissement. Une identité graphique reprise en profondeur, puis un design system partagé avec le développeur — primitives, tokens, composants documentés — pour que la cohérence tienne à mesure que le produit grossit. Et des fonctionnalités menées de bout en bout : interviews et tests utilisateurs, cadrage, arbitrages, specs, conception, puis front-end en binôme jusqu'à la mise en production.",
      },
      {
        title: "Résultat",
        body: "Une plateforme RH complète, dont je porte aujourd'hui la conception de bout en bout : vision produit, UX/UI, design system et front-end. J'ai aussi conçu puis développé seul le site vitrine, avec des outils de code assistés par l'IA, et je produis les contenus de la marque : vidéo, motion design, print, réseaux sociaux.",
      },
      {
        // Source : profil LinkedIn de Paul (octobre 2026), retenu par Paul le
        // 8 oct. 2026 à la place des relevés du tableau de bord admin. À tenir à
        // jour en même temps que LinkedIn.
        title: "En chiffres",
        body: "Les entretiens assistés par l'IA, dont j'ai conçu les parcours et construit les écrans, sont au cœur du produit : 200 000 entretiens ont été réalisés à ce jour. UpikaJob est utilisé par 50 000 collaborateurs dans de grands groupes, avec un taux d'utilisation supérieur à 80 %. En 2025, le produit a reçu avec SPIE le Prix de l'innovation IA & RH de Sopra Steria.",
      },
    ],
    gallery: [],
    media: [
      {
        title: "La plateforme en une minute trente",
        image: videoUpikajobPitch,
        size: "wide",
        youtubeId: "-P4zZUIqNAk",
      },
      {
        title: "Trailer de présentation de la plateforme",
        image: videoUpikajob,
        size: "wide",
        youtubeId: "w5McH1Ib1jI",
      },
    ],
  },
  {
    slug: "memento",
    companySite: { label: "Memento", href: "https://event.memento.photo/" },
    mediaKey: "MEMENTO",
    title: "Memento",
    eyebrow: "Premier designer d'une start-up : produit, design system et contenus",
    description:
      "Un an d'alternance comme premier designer de Memento, SaaS de redistribution de photos pour événements : interfaces, design system, vidéos et supports.",
    context: "Alternance · janvier 2021 – janvier 2022",
    logo: "/assets/Logo-1-1.svg",
    logoAlt: "Logo Memento",
    background: "#1a1921",
    foreground: "#ffffff",
    logoSize: "xl",
    animation: "orbit",
    sections: [
      {
        title: "Vue d'ensemble",
        body: "Memento est une SaaS qui redistribue à chaque invité les photos prises sur un événement, grâce au cloud et à la reconnaissance faciale. J'y ai passé un an en alternance, de janvier 2021 à janvier 2022. La start-up a depuis poussé l'idée plus loin : un agent photo propulsé par l'IA remet automatiquement à chaque participant les clichés sur lesquels il apparaît.",
      },
      {
        title: "Enjeux",
        body: "Memento n'avait pas encore de designer. Pour grandir, l'équipe devait à la fois améliorer son application et produire beaucoup de contenus : visuels pour les réseaux sociaux, vidéos expliquant le service, supports pour les événements.",
      },
      {
        title: "Solution",
        body: "J'ai conçu dans Figma les nouvelles maquettes et les prototypes de l'application, et créé puis maintenu un design system en design atomique pour qu'elle puisse grandir sans perdre en cohérence. En parallèle, j'ai réalisé les vidéos en motion design sous After Effects et les supports print — kakémonos, affiches, flyers — sous InDesign.",
      },
      {
        // Source : profil LinkedIn (« La vidéo de présentation a accompagné une
        // multiplication par trois du nombre de clients sur trois mois »).
        title: "Résultat",
        body: "Mon travail a modernisé l'identité de Memento. La vidéo de présentation est devenue le support des associés pour présenter la solution, et sa diffusion a accompagné un triplement du nombre de clients en trois mois.",
      },
    ],
    gallery: ["Prototype produit", "Design system", "Supports social media"],
    media: [
      {
        title: "Reportage photo événementiel",
        image: mementoEvent,
        size: "wide",
      },
      {
        title: "Landing page Memento",
        image: mementoLanding,
        size: "narrow",
      },
      {
        title: "Storyboards de présentation",
        image: mementoStoryboard,
        size: "wide",
      },
      {
        title: "Statistiques vidéo",
        image: mementoStats,
        size: "regular",
      },
      {
        title: "Affiche commerciale",
        image: mementoPoster,
        size: "regular",
      },
      {
        title: "Support événementiel QR code",
        image: mementoFlyer,
        size: "regular",
      },
      {
        title: "Synthèse offre et FAQ",
        image: mementoFaq,
        size: "wide",
      },
      {
        title: "Vidéo de présentation B2B",
        image: videoMemento,
        size: "wide",
        youtubeId: "DkHwGQkWkfs",
      },
    ],
  },
  {
    slug: "yves-delorme",
    companySite: { label: "Yves Delorme", href: "https://france.yvesdelorme.com/" },
    mediaKey: "YDL",
    title: "Yves Delorme",
    eyebrow: "L'Odyssée — refonte de l'écosystème digital",
    description:
      "Refonte globale de l'expérience client pour la Maison Yves Delorme, de la recherche en boutique au prototypage haute fidélité.",
    // Période : CV (« Yves Delorme — Ld. Designer, 2019-2020 »). Cadre : projet
    // professionnalisant de HETIC, mené avec l'entreprise (Paul, 8 oct. 2026).
    context: "Projet professionnalisant HETIC · Client : Maison Yves Delorme · 2019–2020",
    logo: "/assets/Logo-2-2.svg",
    logoAlt: "Logo Yves Delorme Paris",
    background: "#deebec",
    foreground: "#7f7f82",
    logoSize: "lg",
    animation: "float",
    detailVariant: "editorial",
    introParagraphs: [
      "L'Odyssée est un projet de refonte globale de l'écosystème digital de la Maison Yves Delorme. Il vise à harmoniser l'expérience client entre la boutique, le conseil et les outils numériques.",
      // À PRÉCISER : ta part exacte parmi immersion, ateliers, charte et prototypes.
      "Avec les équipes marketing et commerciales, j'ai travaillé sur le parcours client, l'architecture des interfaces et les scénarios prioritaires à prototyper.",
      "La démarche a combiné immersion terrain, formalisation UX/UI et production de livrables concrets pour faire émerger une expérience plus cohérente, premium et orientée service.",
    ],
    sections: [],
    gallery: [],
    media: [
      {
        title: "Session de travail en boutique avec l'équipe de vente",
        image: yvesDelormeWorkshop,
        size: "wide",
      },
      {
        title: "Point sur les attentes et les besoins des clients",
        image: yvesDelormeNeeds,
        size: "wide",
      },
      {
        title: "Détermination des objectifs et de la stratégie de communication",
        image: yvesDelormeStrategy,
        size: "wide",
      },
      {
        title: "Création de la charte graphique et de l'identité visuelle",
        image: yvesDelormeDesignSystem,
        size: "wide",
      },
      {
        title: "Prototypage haute fidélité des différentes pages du site",
        image: yvesDelormePrototype,
        size: "wide",
      },
      {
        title: "Mise en situation du site sur tablette",
        image: yvesDelormeTablet,
        size: "wide",
        variant: "light",
      },
      {
        title: "Configurateur produit en vidéo",
        image: videoYvesDelorme,
        size: "wide",
        youtubeId: "Y6ov9iYdWIk",
      },
    ],
  },
  {
    slug: "jive",
    companySite: { label: "Orange", href: "https://www.orange.com/" },
    mediaKey: "JIVE",
    title: "Jive",
    eyebrow: "Améliorer un logiciel intranet grâce à un add-on de design thinking",
    description:
      "Conception d'un add-on Jive pour Orange afin d'organiser des ateliers de design thinking directement dans l'intranet.",
    context: "Stage chez SÆGUS · Client : Orange · 2020",
    logo: "/assets/Logo-3.svg",
    logoAlt: "Logo Jive",
    background: "#ffb800",
    foreground: "#ffffff",
    logoSize: "lg",
    animation: "sweep",
    detailVariant: "case-study",
    headerLogo: { kind: "jive-orange" },
    sectionStyle: "inline",
    sections: [
      {
        title: "Vue d'ensemble",
        body: "Lors de mon second stage chez SÆGUS, j'ai rejoint une équipe Orange comme consultant junior design. L'objectif : améliorer l'usage de Jive, l'intranet utilisé au quotidien par les collaborateurs.",
      },
      {
        title: "Enjeux",
        body: "Orange avait besoin d'organiser des ateliers d'idéation au format Kanban directement dans Jive, sans multiplier les outils externes ni perdre les participants dans des interfaces complexes.",
      },
      {
        title: "Solution",
        // Sources : Paul (8 oct. 2026 : projet qu'il a mené chez SÆGUS) et LinkedIn
        // (pôle Factory, juil.-déc. 2020 : plug-in conçu en binôme avec un
        // développeur, de la maquette à l'intégration ; ateliers de design thinking).
        body: "J'ai mené la conception d'un add-on Jive selon une démarche de design thinking : un atelier de design thinking (Miro, Figma) pour recueillir les besoins, puis un outil composé de modules réutilisables, conçu en binôme avec un développeur, de la maquette jusqu'à l'intégration.",
      },
      {
        title: "Résultat",
        body: "À l'issue de la mission, l'équipe Orange disposait d'un outil clé en main pour organiser son travail en Kanban au sein même de Jive.",
      },
    ],
    gallery: [],
    media: [
      {
        title: "Organisation du design system",
        image: jiveDesignSystem,
        size: "wide",
      },
      {
        title: "Organisation du prototype",
        image: jivePrototype,
        size: "wide",
      },
      {
        title: "Retour d'expérience sur la formation Agile, réalisé pour Orange lors de mon premier stage (2019)",
        image: videoOrangeAgile,
        size: "wide",
        youtubeId: "9jyKLH6kMH4",
      },
      {
        title: "Organisation du Miro",
        image: jiveMiro,
        size: "wide",
      },
    ],
  },
  {
    // Ancien slug : « odyssey » (redirigé dans next.config.ts).
    slug: "sanofi-espoir",
    companySite: { label: "Sanofi", href: "https://www.sanofi.com/" },
    mediaKey: "SANOFI",
    title: "Sanofi Espoir",
    eyebrow: "Santé maternelle et néonatale au Sénégal : renforcer l'impact local",
    description:
      "Mission de design pour la Fondation Sanofi Espoir autour de la santé maternelle et néonatale au Sénégal.",
    // Sources : Paul (8 oct. 2026 : mission SÆGUS) et LinkedIn (stage SÆGUS, pôle
    // Acceleration Tactics, juil.-déc. 2019 : contenus de restitution d'ateliers UX
    // pour Sanofi, experience map construite avec des consultants data).
    // L'experience map de la page porte d'ailleurs le logo SÆGUS.
    context: "Stage chez SÆGUS · Client : Fondation Sanofi Espoir · 2019",
    logo: "/assets/Logo-4-1.svg",
    logoAlt: "Logo Sanofi Espoir",
    background: "#f3efed",
    foreground: "#c9a66f",
    logoSize: "md",
    animation: "tilt",
    detailVariant: "case-study",
    headerLogo: {
      kind: "image",
      src: "/assets/Logo-4-2.svg",
      alt: "Sanofi Espoir Foundation",
      width: 260,
      height: 57,
      className: "h-auto w-52 md:w-64",
    },
    sectionStyle: "inline",
    sections: [
      {
        title: "Vue d'ensemble",
        body: "Lors de mon premier stage chez SÆGUS, j'ai travaillé sur une mission pour la Fondation Sanofi Espoir autour de la santé maternelle et néonatale au Sénégal. L'objectif était de mieux comprendre les parcours de soins locaux pour renforcer l'impact des actions de la fondation. J'y ai produit les contenus de restitution des ateliers et participé à l'experience map du parcours des femmes.",
      },
      {
        title: "Enjeu",
        body: "Les équipes devaient concilier contraintes terrain, attentes des professionnels de santé et besoins des patientes dans un environnement complexe, avec peu de visibilité sur l'expérience réelle vécue sur place.",
      },
      {
        title: "Solution",
        body: "Une démarche immersive combinant immersion terrain, entretiens, ateliers et restitution visuelle pour cartographier les parcours, structurer les insights et proposer des recommandations centrées utilisateur.",
      },
      {
        title: "Résultat",
        body: "L'équipe a pu s'appuyer sur des livrables concrets — cartographies, storyboards et experience maps — pour orienter ses décisions et renforcer la cohérence de ses actions sur le terrain.",
      },
    ],
    gallery: [],
    media: [
      {
        title: "Une étape de terrain avec les acteurs pour mieux comprendre les besoins",
        image: sanofiField,
        size: "wide",
      },
      {
        title: "L'identification et le recours à des structures de santé locales",
        image: sanofiCenters,
        size: "wide",
      },
      {
        title: "Accompagner et soutenir les équipes locales pour améliorer leurs services",
        image: sanofiSupport,
        size: "wide",
      },
      {
        title: "Un processus d'idéation collectif et collaboratif avec les équipes de la Fondation Sanofi Espoir",
        image: sanofiWorkshop,
        size: "wide",
      },
      {
        title: "Storyboard du film",
        image: sanofiStoryboard,
        size: "wide",
      },
      {
        title: "Accelerating Local Impact — film de restitution",
        image: videoSanofiImpact,
        size: "wide",
        youtubeId: "M0JuT4dlrGg",
      },
      {
        title: "Présentation du projet en vidéo",
        image: videoSanofiProject,
        size: "wide",
        youtubeId: "tsqkmX-ZNsE",
      },
      {
        title: "Une analyse détaillée de l'expérience patiente et des points de douleur dans le parcours",
        image: sanofiExperienceMap,
        size: "wide",
      },
    ],
  },
  {
    // Ancien slug : « unicorn » (redirigé dans next.config.ts).
    slug: "fidesio",
    companySite: { label: "Fidesio", href: "https://www.fidesio.com/" },
    mediaKey: "FIDESIO",
    title: "Fidesio",
    eyebrow: "Stage UX/UI en agence : site web, outil interne et newsletters",
    detailSubtitle: "Missions UX/UI et branding en agence web",
    description:
      "Stage UX/UI à l'agence web Fidesio : maquettes du site de Montaigne Capital, outil interne de suivi des projets et bannières de newsletters pour une boutique de musée.",
    // Sources : profil LinkedIn (« Fidesio — Stagiaire UX/UI, juillet - septembre
    // 2018 ») et précisions de Paul du 8 oct. 2026 : missions UX/UI et branding
    // pour Montaigne Capital, une boutique de musée et l'agence elle-même.
    // Sanofi Espoir, longtemps attribué à cette page, était une mission SÆGUS.
    context: "Stage UX/UI à l'agence Fidesio · juil.–sept. 2018",
    logo: "/assets/Logo-5-1.svg",
    logoAlt: "Logo Fidesio",
    background: "#ff3345",
    foreground: "#ffffff",
    logoSize: "md",
    animation: "pulse",
    detailVariant: "case-study",
    headerLogo: {
      kind: "image",
      src: "/assets/Logo-5-2.svg",
      alt: "Logo Fidesio",
      width: 251,
      height: 252,
      className: "h-auto w-24 md:w-28",
    },
    sectionStyle: "inline",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Vue d'ensemble",
            body: "À l'été 2018, j'ai passé trois mois en stage UX/UI chez Fidesio, une agence web parisienne. J'y ai travaillé sur des missions d'interface et de branding pour plusieurs clients, et sur les outils internes de l'agence.",
          },
          {
            title: "Enjeux",
            body: "Concevoir des interfaces web et logicielles cohérentes d'un projet à l'autre, aussi bien pour des réponses à appels d'offres que pour des outils développés en interne.",
          },
          {
            title: "Solution",
            body: "J'ai conçu ces interfaces selon une convention de design atomique, et animé des ateliers UX « How Might We », avec entretiens et tests utilisateurs.",
          },
        ],
      },
      {
        type: "media",
        layout: "row",
        media: [
          {
            title: "Outil interne de suivi des projets",
            image: fidesioAppCalendar,
            size: "wide",
          },
          {
            title: "Vue hebdomadaire et suivi des activités",
            image: fidesioAppWeek,
            size: "wide",
          },
        ],
      },
      {
        type: "sections",
        sections: [
          {
            title: "Outil interne",
            body: "Pour l'agence, une application de suivi des projets : tickets par client et par collaborateur, temps passé, vues par semaine et par mois.",
          },
          {
            title: "Montaigne Capital",
            body: "Des maquettes pour le site d'une société de gestion : page d'accueil, fiches de fonds avec indicateurs de performance, documents réglementaires à télécharger et simulation des cours historiques.",
          },
        ],
      },
      {
        type: "media",
        media: [
          {
            title: "Montaigne Capital — page d'accueil",
            image: fidesioWebsite,
            size: "wide",
            variant: "light",
          },
          {
            title: "Montaigne Capital — fiche d'un fonds",
            image: fidesioDashboard,
            size: "wide",
            variant: "light",
          },
        ],
      },
      {
        type: "sections",
        sections: [
          {
            title: "Newsletters",
            body: "Des bannières pour les newsletters d'une boutique de musée : offres promotionnelles à durée limitée sur des produits inspirés d'œuvres de Van Gogh et de Monet, avec un appel à l'action fort.",
          },
        ],
      },
      {
        type: "media",
        layout: "row",
        media: [
          {
            title: "Newsletter — offre mode",
            image: fidesioBannerTeal,
            size: "wide",
          },
          {
            title: "Newsletter — sélection impressionniste",
            image: fidesioBannerRed,
            size: "wide",
          },
        ],
      },
    ],
    sections: [],
    gallery: [],
  },
  {
    slug: "capgemini",
    companySite: { label: "Capgemini", href: "https://www.capgemini.com/" },
    mediaKey: "CAPGEMINI",
    title: "Capgemini",
    eyebrow: "Illustrer des cas d'usages afin de toucher une large cible",
    description:
      "Création de vidéos animées pour Capgemini afin d'illustrer des cas d'usage Microsoft 365.",
    // Source : LinkedIn (stage SÆGUS, pôle Acceleration Tactics, juil.-déc. 2019 :
    // Capgemini parmi les clients). Premier des deux stages ; Jive est le second.
    context: "Stage chez SÆGUS · Client : Capgemini · 2019",
    logo: "/assets/Logo-6-1.svg",
    logoAlt: "Logo Capgemini",
    background: "#e5f1f3",
    foreground: "#0b82bd",
    logoSize: "md",
    animation: "float",
    detailVariant: "case-study",
    headerLogo: {
      kind: "image",
      src: "/assets/Logo-6-1.svg",
      alt: "Logo Capgemini",
      width: 220,
      height: 80,
      className: "h-auto w-44 md:w-52",
    },
    sectionStyle: "inline",
    sections: [
      {
        title: "Vue d'ensemble",
        body: "Lors de mon premier stage chez SÆGUS, j'ai travaillé pour Capgemini sur la création de vidéos animées mettant en scène des personnages et des décors, sous After Effects avec le plugin Duik.",
      },
      {
        title: "Enjeux",
        body: "Il fallait produire quatre cas d'usage animés — trois sont présentés ci-dessous —, avec de nombreuses scènes et une charge d'animation importante, dans un délai court pour un client de longue date.",
      },
      {
        title: "Solution",
        body: "J'ai mené la production de plus en plus en autonomie, en m'appuyant sur mes compétences en design graphique, en direction artistique et en animation.",
      },
      {
        title: "Résultat",
        body: "Le projet a été livré dans les temps et a permis à l'équipe design de SÆGUS de conserver la confiance du client sur une mission exigeante.",
      },
    ],
    gallery: [],
    media: [
      {
        title: "Cas d'usage 1 : comment travailler en collaboration avec Teams et SharePoint ?",
        image: capgeminiOutlook,
        size: "wide",
        youtubeId: "r91TdLUeQPE",
      },
      {
        title: "Cas d'usage 2 : comment améliorer sa productivité avec OneDrive ?",
        image: capgeminiOnedrive,
        size: "wide",
        youtubeId: "G7whaTB6e_0",
      },
      {
        title: "Cas d'usage 3 : comment travailler de n'importe où en utilisant Office Online ?",
        image: capgeminiOfficeOnline,
        size: "wide",
        youtubeId: "iqyDW3P5uK4",
      },
    ],
  },
  {
    // Ancien slug : « lemon » (redirigé dans next.config.ts).
    slug: "baio",
    mediaKey: "BAIO",
    title: "Baio",
    eyebrow: "Créer une application gamifiée qui encourage la consommation de produits sains",
    description:
      "Conception d'une application mobile gamifiée pour encourager une alimentation plus saine.",
    // À COMPLÉTER : cadre (école, client, perso ?), année, seul ou en équipe.
    context: "Concept d'application mobile",
    logo: "/assets/Logo-7-1.svg",
    logoAlt: "Logo Baio",
    background: "#58e000",
    foreground: "#fff36d",
    logoSize: "lg",
    animation: "tilt",
    detailVariant: "case-study",
    headerLogo: {
      kind: "image",
      src: "/assets/Logo-7-1.svg",
      alt: "Logo Baio",
      width: 120,
      height: 120,
      className: "h-auto w-24 md:w-28",
    },
    sectionStyle: "inline",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Vue d'ensemble",
            body: "Projet de conception d'une application mobile gamifiée visant à encourager les utilisateurs à consommer des produits plus sains au quotidien.",
          },
          {
            title: "Enjeu",
            body: "Proposer une expérience simple et engageante pour aider les consommateurs à mieux choisir leurs produits et à suivre leurs habitudes alimentaires.",
          },
          {
            title: "Solution",
            body: "J'ai conçu un parcours mobile complet : onboarding, recherche, listes de courses, scan de tickets et système de points avec offres partenaires.",
          },
          {
            title: "Résultat",
            body: "L'application a été structurée en écrans clés et organisée dans Figma pour faciliter les itérations et la présentation du concept.",
          },
        ],
      },
      {
        type: "media",
        layout: "feature-grid",
        // À PRÉCISER : ancienne légende « … pour Lemon ». Qu'est-ce que Lemon ?
        caption: "Écrans de la version précédente de l'application",
        media: [
          { title: "Courses éco-responsables", image: baioEcoCourses, size: "wide" },
          { title: "Communauté avisée", image: baioCommunity, size: "wide" },
          { title: "Listes de courses", image: baioShoppingList, size: "wide" },
          { title: "Scan de ticket", image: baioScanTicket, size: "wide" },
          { title: "Offres exclusives", image: baioOffers, size: "wide" },
        ],
      },
      {
        type: "media",
        media: [
          {
            title: "Parcours d'onboarding dans l'application",
            image: baioOnboarding,
            size: "wide",
          },
        ],
      },
      {
        type: "media",
        media: [
          {
            title: "Présentation animée de l'application",
            image: videoBaio,
            size: "wide",
            youtubeId: "xYF8CUZPjHw",
          },
        ],
      },
      {
        type: "media",
        media: [
          {
            title: "Organisation des vues et filtre dans Figma",
            image: baioFigma,
            size: "wide",
          },
        ],
      },
      // Lien « Voir sur Figma » retiré : il pointait vers « # ». Le remettre
      // ici avec l'URL publique du fichier :
      // { type: "links", links: [{ label: "Voir sur Figma", href: "https://www.figma.com/…" }] },
    ],
    sections: [],
    gallery: [],
  },
  {
    // Ancien slug : « alpha » (redirigé dans next.config.ts).
    slug: "saegus",
    companySite: { label: "SÆGUS", href: "https://www.saegus.com/" },
    mediaKey: "SAEGUS",
    title: "SÆGUS",
    eyebrow: "Carte de vœux 2021 : landing page, e-mailing et réseaux sociaux",
    description:
      "Conception de la carte de vœux digitale 2021 de SÆGUS : landing page desktop et mobile, e-mail personnalisé, version imprimée et visuels pour LinkedIn.",
    // Sources : LinkedIn (stage SÆGUS, pôle Factory, juil.-déc. 2020 : « refonte de
    // la communication interne par le design de landing pages ») et CV (« carte
    // de voeux 2020 format web, emailing et print »). Cette page regroupe le
    // travail mené pour SÆGUS en interne ; les missions clients (Orange, Sanofi
    // Espoir, Capgemini) ont chacune leur page.
    context: "Stages chez SÆGUS · projets internes",
    logo: "/assets/Logo-8-1.svg",
    logoAlt: "Logo SÆGUS",
    background: "#111111",
    foreground: "#ffffff",
    logoSize: "sm",
    animation: "orbit",
    detailVariant: "case-study",
    headerLogo: {
      kind: "image",
      src: "/assets/Logo-8-1.svg",
      alt: "Logo SÆGUS",
      width: 120,
      height: 120,
      className: "h-auto w-24 md:w-28",
    },
    sectionStyle: "inline",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Vue d'ensemble",
            body: "Pendant mon second stage chez SÆGUS, en 2020, j'ai conçu la carte de vœux digitale du cabinet pour l'année 2021 : une landing page en versions desktop et mobile, déclinée pour l'e-mailing, l'impression et LinkedIn.",
          },
          {
            title: "Enjeux",
            body: "Créer une expérience premium et festive qui reflète l'identité de SÆGUS tout en mettant en avant les succès de l'année et les perspectives de l'équipe.",
          },
          {
            title: "Solution",
            body: "J'ai travaillé sur une direction visuelle forte autour du violet, des chiffres clés et des témoignages, avec une architecture modulaire pensée pour le web et l'email.",
          },
          {
            title: "Résultat",
            body: "Les livrables ont permis de déployer une campagne cohérente sur plusieurs supports, de la landing page aux visuels réseaux sociaux.",
          },
        ],
      },
      {
        type: "media",
        media: [
          { title: "Carte de vœux digitale", image: saegusVoeux, size: "wide" },
          { title: "Version éditoriale des vœux", image: saegusWishes, size: "wide" },
        ],
      },
      {
        type: "media",
        media: [
          {
            title: "Organisation des écrans dans Figma",
            image: saegusFigma,
            size: "wide",
          },
        ],
      },
      {
        type: "sections",
        sections: [
          {
            // Paul a créé la vidéo REX de cet atelier ; les planches montrent
            // comment il en a construit le storyboard (précision du 8 oct. 2026).
            title: "Vidéo REX",
            body: "J'ai aussi créé la vidéo de retour d'expérience (REX) d'un atelier. Ces planches montrent comment j'en ai construit le storyboard.",
          },
        ],
      },
      {
        type: "media",
        layout: "row",
        media: [
          {
            title: "Storyboard de la vidéo REX : les étapes de l'atelier",
            image: saegusRexSteps,
            size: "wide",
          },
          {
            title: "Storyboard de la vidéo REX : l'écran de remerciements",
            image: saegusRexThanks,
            size: "wide",
          },
        ],
      },
    ],
    sections: [],
    gallery: [],
  },
  {
    // Ancien slug : « studio » (redirigé dans next.config.ts).
    slug: "le-grand-menage",
    mediaKey: "LGM",
    title: "Le Grand Ménage",
    eyebrow: "Réaliser un court métrage en deux semaines, de l'écriture au montage",
    description:
      "Court métrage « Le Grand Ménage » réalisé en équipe sur deux semaines, de l'écriture au montage.",
    // À COMPLÉTER : cadre (projet d'école HETIC ?), année, ton rôle précis.
    context: "Court métrage · équipe pluridisciplinaire · 2 semaines",
    logo: "/assets/Logo-9-2.svg",
    logoAlt: "Logo Le Grand Ménage",
    titleColor: "#BA090B",
    background: "#d6c6a9",
    foreground: "#202020",
    logoSize: "lg",
    animation: "sweep",
    detailVariant: "case-study",
    headerLogo: {
      kind: "image",
      src: "/assets/Logo-9-1.png",
      alt: "Le Grand Ménage",
      width: 320,
      height: 180,
      className: "h-auto w-56 md:w-72",
    },
    sectionStyle: "inline",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Vue d'ensemble",
            body: "Projet de court métrage réalisé de A à Z en deux semaines avec une équipe pluridisciplinaire, dans le cadre d'une expérience de production audiovisuelle amateur.",
          },
          {
            title: "Enjeux",
            body: "Organiser une équipe, tenir un calendrier de tournage serré et converger vers un film cohérent malgré des contraintes techniques et humaines fortes.",
          },
          {
            title: "Solution",
            body: "Nous avons réparti les rôles, structuré les étapes de production — écriture, préparation, tournage, montage — et maintenu une coordination continue sur le plateau.",
          },
          {
            title: "Résultat",
            body: "Le film a été livré dans les délais et a constitué une expérience formatrice pour toute l'équipe autour du travail collectif.",
          },
        ],
      },
      {
        type: "media",
        media: [
          {
            title: "Affiche du court métrage",
            image: grandMenagePoster,
            size: "wide",
            youtubeId: "CDM8p7Ixegg",
          },
        ],
      },
      // Liens « Les voix les traits » et « Le dossier de production » retirés :
      // ils pointaient vers « # ». Les remettre ici avec leurs vraies URL :
      // { type: "links", links: [{ label: "…", href: "https://…" }] },
      {
        type: "media",
        media: [
          {
            title: "Équipe et moi-même pendant le tournage d'une scène de meurtre",
            image: grandMenageFilming,
            size: "wide",
          },
          {
            title: "Moi en train de monter le court métrage sur Mac",
            image: grandMenageEditing,
            size: "wide",
          },
          {
            title: "Le perchman et moi en train de filmer un lobby",
            image: grandMenageLobby,
            size: "wide",
          },
        ],
      },
    ],
    sections: [],
    gallery: [],
  },
  {
    slug: "archive",
    mediaKey: "PERSO",
    title: "Archive",
    eyebrow: "Dessins personnels et créations",
    description:
      "Sélection de créations graphiques, illustrations et expérimentations personnelles.",
    logo: "/assets/Logo-archive.png",
    logoAlt: "Logo Archive",
    background: "#ece8df",
    foreground: "#333333",
    logoSize: "md",
    logoScale: 1.12,
    titleColor: "#BE1E2D",
    animation: "pulse",
    detailVariant: "case-study",
    sectionStyle: "inline",
    sections: [],
    gallery: [],
    media: [
      {
        title: "Illustrations réalisées pour des stickers",
        image: archiveFruits,
        size: "wide",
      },
      {
        title: "Projet de recherche graphique autour d'une exposition sur le Bauhaus",
        image: archiveBauhaus,
        size: "wide",
      },
      {
        title: "Recherche graphique pour un projet de jeu vidéo dans l'espace",
        image: archiveSpace,
        size: "wide",
      },
      {
        title: "Illustration d'un attrapeur de rêves",
        image: archiveDreamcatcher,
        size: "wide",
      },
      {
        title: "Peinture digitale de paysage au crépuscule",
        image: archivePainting,
        size: "wide",
      },
      {
        title: "Expérimentation graphique sous forme de petit comic strip",
        image: archiveCitron,
        size: "wide",
      },
      {
        title: "Proposition de charte graphique pour un studio de production audiovisuel",
        image: archiveGecko,
        size: "wide",
        // Lien « Voir le site » retiré : il pointait vers « # ».
      },
      {
        title: "Réalisation et montage d'une vidéo de skate",
        image: archiveSkate,
        size: "wide",
        youtubeId: "jqaKMLXqmb4",
      },
    ],
  },
];

export const methodSteps = [
  {
    title: "Comprendre le contexte et les besoins du client",
    body: "La première étape consiste à comprendre les objectifs, les besoins, le public cible et l'environnement concurrentiel du projet.",
  },
  {
    title: "Rechercher et collecter des informations",
    body: "Je mène une recherche approfondie sur le marché, les tendances, les utilisateurs, les besoins réels et la concurrence.",
  },
  {
    title: "Synthétiser et analyser les données",
    body: "Les informations sont triées et analysées pour produire des conclusions utiles, des insights et une direction claire.",
  },
  {
    title: "Concevoir, prototyper et tester",
    body: "Je transforme les hypothèses en interfaces, prototypes et supports testables pour valider rapidement les décisions.",
  },
  {
    title: "Livrer et accompagner",
    body: "Les livrables sont préparés proprement, documentés et pensés pour être repris ou déployés par les équipes.",
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
