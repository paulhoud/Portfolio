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
import saegusAgile from "../../assets/img-28.png";
import saegusTeamCards from "../../assets/img-30.png";
import saegusPolaroids from "../../assets/img-31.png";
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
  titleColor?: string;
  /**
   * Site officiel de l'entreprise ou de la marque concernée. Absent lorsqu'il
   * n'y en a pas (projet personnel, structure disparue).
   */
  companySite?: ProjectLink;
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
    eyebrow: "Plateforme d'accompagnement de carrière",
    description:
      "Mon expérience actuelle : design produit pour une plateforme de coaching professionnel.",
    logo: "/assets/upikajob.webm",
    logoKind: "video",
    logoAlt: "Logo UpikaJob",
    background: "#ffffff",
    foreground: "#ffffff",
    titleColor: "#1897fe",
    logoSize: "lg",
    logoScale: 1.05,
    animation: "float",
    detailVariant: "story",
    story: {
      lead: "Une plateforme née pour accompagner les jeunes talents, devenue un SIRH. J'ai grandi avec elle.",
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
            { caption: "Le tableau de bord à mon arrivée", image: upikaOldDashboard },
            { caption: "Les jeunes talents en chiffres", image: upikaOldTalents },
            { caption: "Fiche de suivi d'un alternant", image: upikaOldSuivi },
            { caption: "Validation des compétences", image: upikaOldCompetences },
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
            body: "J'accompagne les refontes successives, je fais évoluer l'identité graphique et je pose avec l'équipe les fondations du design system.",
          },
          shots: [
            { caption: "Déclinaisons du logotype", image: upikaLogotype },
            { caption: "Échelle typographique et tokens", image: upikaTypescale },
            { caption: "Bibliothèque de composants", image: upikaFigmaComponents },
            { caption: "Organisation du fichier et styles partagés", image: upikaFigmaTokens },
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
            body: "Je conçois l'interface du nouveau produit et j'installe, écran après écran, les repères d'une plateforme destinée à des professionnels des RH.",
          },
          shots: [
            { caption: "Le tableau de bord de la nouvelle plateforme", image: upikaNewDashboard },
            { caption: "Nouvelle identité, nouvelle interface", image: upikaNewLogin },
            { caption: "Pilotage RH et managérial", image: upikaNewPilotage },
          ],
          shotLayout: "stage",
        },
        {
          type: "stage",
          period: "En profondeur",
          product: {
            title: "Des fonctionnalités à part entière",
            body: "Entretiens annuels, cartographie des compétences, indicateurs de pilotage, profils collaborateurs : chaque brique demande son propre cadrage.",
          },
          role: {
            title: "Conception de bout en bout",
            body: "Du cadrage du besoin jusqu'à la mise en production, en travaillant chaque jour avec les développeurs.",
          },
          shots: [
            { caption: "Campagnes d'entretiens annuels", image: upikaNewEntretiens },
            { caption: "Cartographie des compétences", image: upikaNewCompetences },
            { caption: "Indicateurs et filtres globaux", image: upikaNewIndicateurs },
            { caption: "Profil collaborateur", image: upikaNewProfil },
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
            body: "Le site vitrine, je l'ai conçu puis développé seul. Le Vibe Coding me permet désormais de livrer moi-même une partie de ce que je dessine.",
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
        body: "La plateforme telle qu'elle est en ligne aujourd'hui, et le site vitrine que j'ai conçu puis développé seul.",
        link: { label: "Voir le site", href: "https://www.upikajob.com/" },
      },
    },
    sectionStyle: "inline",
    sections: [
      {
        title: "Vue d'ensemble",
        body: "UpikaJob est aujourd'hui un SIRH : une plateforme qui outille les équipes RH et les managers dans le suivi de leurs collaborateurs — entretiens, compétences, objectifs, indicateurs de pilotage. Elle est née tout autrement, comme un outil destiné aux organismes de formation pour accompagner l'insertion des jeunes talents. J'y suis Product Designer et j'ai vécu cette transformation de l'intérieur, des premières refontes jusqu'au produit actuel.",
      },
      {
        title: "Enjeu",
        body: "L'entreprise a compris que son savoir-faire — structurer un accompagnement, objectiver une progression, outiller un référent — dépassait largement le cadre de l'alternance. Il fallait donc s'adresser à une population bien plus exigeante, celle des professionnels RH, sans renier l'expertise qui faisait la force du produit. Un changement d'échelle autant que de public : plus de données, plus de rôles, plus de règles métier, et des attentes d'ergonomie propres à un outil utilisé toute la journée.",
      },
      {
        title: "Solution",
        body: "Plusieurs refontes successives, chacune accompagnant un changement de vision plutôt qu'un simple rafraîchissement. Une identité graphique reprise en profondeur, puis un design system partagé avec les développeurs — primitives, tokens, composants documentés — pour que la cohérence tienne à mesure que le produit grossit. Et des fonctionnalités menées de bout en bout : cadrage du besoin, arbitrages, conception, suivi jusqu'à la mise en production.",
      },
      {
        title: "Résultat",
        body: "Une plateforme RH complète, dont je conçois aujourd'hui les fonctionnalités et dont j'ai dessiné puis développé seul le site vitrine. Mon rôle a suivi la même trajectoire que le produit : d'abord les écrans, puis le produit, jusqu'à l'implémentation — le Vibe Coding me permettant désormais de livrer moi-même une partie de ce que je conçois.",
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
    eyebrow: "Designer le service de redistribution de photo de demain",
    description:
      "Une SaaS de récupération et redistribution de photos individuelles pour événements.",
    logo: "/assets/Logo-1-1.svg",
    logoAlt: "Logo Memento",
    background: "#1a1921",
    foreground: "#ffffff",
    logoSize: "xl",
    animation: "orbit",
    sections: [
      {
        title: "Vue d'ensemble",
        body: "J'ai eu la chance de travailler un an en alternance pour la start-up Memento. Memento est une SaaS qui propose un service de récupération de photos individualisé utilisant le cloud et la reconnaissance faciale. Le service s'adresse aux créateurs d'événements pour redistribuer toutes les photos prises sur leur événement à chacun des invités. La start-up a depuis poussé cette intuition plus loin : la reconnaissance a laissé place à un agent photo propulsé par l'IA, qui remet automatiquement à chaque participant les clichés sur lesquels il apparaît.",
      },
      {
        title: "Enjeux",
        body: "J'ai été recruté par l'entreprise car ils n'avaient pas encore de designer et leur désir de grandir impliquait de créer beaucoup de contenus différents. J'étais en charge de la création de nouvelles maquettes d'interface pour améliorer leur application, des visuels pour les publications sur les réseaux sociaux, des vidéos pour expliquer le fonctionnement de leur service, mais aussi des flyers ou kakémonos pour des événements.",
      },
      {
        title: "Solution",
        body: "Grâce à mon expertise de Figma, j'ai pu réaliser beaucoup d'interfaces et de prototypes pour les besoins de l'entreprise. J'ai appliqué le design atomique et j'ai pu créer et maintenir un design system pour améliorer le scaling de notre application. Mes compétences sur la suite Adobe m'ont également permis de réaliser des vidéos animées avec du Motion Design dans After Effect ou de créer des Kakemono, des affiches et des flyers sur InDesign.",
      },
      {
        title: "Résultat",
        body: "Le résultat de mon travail a modernisé l'identité de Memento. Aujourd'hui encore, la vidéo de présentation sert de support aux associés pour présenter la solution et sa diffusion a permis de convertir 3 fois plus de clients durant les 3 mois qui ont suivi.",
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
    logo: "/assets/Logo-2-2.svg",
    logoAlt: "Logo Yves Delorme Paris",
    background: "#deebec",
    foreground: "#7f7f82",
    logoSize: "lg",
    animation: "float",
    detailVariant: "editorial",
    introParagraphs: [
      "L'Odyssée est un projet de refonte globale de l'écosystème digital de la Maison Yves Delorme. Il vise à harmoniser l'expérience client entre la boutique, le conseil et les outils numériques.",
      "En collaboration avec les équipes marketing et commerciales, j'ai participé à la réflexion autour du parcours client, de l'architecture des interfaces et des scénarios prioritaires à prototyper.",
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
        body: "Lors de mon second stage chez SÆGUS, j'ai travaillé en tant que consultant junior design au sein d'une équipe Orange. L'objectif était d'améliorer l'usage de Jive, la solution intranet utilisée au quotidien par les collaborateurs.",
      },
      {
        title: "Enjeux",
        body: "Orange avait besoin d'organiser des ateliers d'idéation au format Kanban directement dans Jive, sans multiplier les outils externes ni perdre les participants dans des interfaces complexes.",
      },
      {
        title: "Solution",
        body: "Nous avons conçu un add-on Jive fondé sur une démarche de design thinking : atelier Figma pour recueillir les besoins, puis création d'un outil final composé de modules réutilisables.",
      },
      {
        title: "Résultat",
        body: "L'équipe Orange dispose aujourd'hui d'un outil clé en main pour organiser son travail en méthode Kanban au sein même de Jive.",
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
        title: "Retour d'expérience sur la formation Agile",
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
    slug: "odyssey",
    companySite: { label: "Sanofi", href: "https://www.sanofi.com/" },
    mediaKey: "SANOFI",
    title: "Sanofi Espoir",
    eyebrow: "Projet pour la santé des enfants au Sénégal : renforcer l'impact local",
    description:
      "Mission de design pour la Fondation Sanofi Espoir autour de la santé maternelle et néonatale au Sénégal.",
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
        body: "Mission menée pour la Fondation Sanofi Espoir autour de la santé maternelle et néonatale au Sénégal. L'objectif était de mieux comprendre les parcours de soins locaux pour renforcer l'impact des actions de la fondation.",
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
        title: "Une cartographie visuelle de la structure et de l'organisation",
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
    slug: "unicorn",
    companySite: { label: "Fidesio", href: "https://www.fidesio.com/" },
    mediaKey: "FIDESIO",
    title: "Fidesio",
    eyebrow: "Sanofi – esprit de solidarité",
    detailSubtitle: "Professionnels de santé en mission",
    description:
      "Professionnels de santé en mission : refonte d'outils digitaux et sélection design pour Sanofi Espoir.",
    logo: "/assets/Logo-5-1.svg",
    logoAlt: "Logo Fidesio",
    background: "#ff3345",
    foreground: "#ffffff",
    logoSize: "md",
    animation: "pulse",
    detailVariant: "case-study",
    headerLogo: {
      kind: "image",
      src: "/assets/Logo-4-2.svg",
      alt: "Sanofi Espoir",
      width: 260,
      height: 57,
      className: "h-auto w-48 md:w-56",
    },
    sectionStyle: "inline",
    blocks: [
      {
        type: "sections",
        sections: [
          {
            title: "Vue d'ensemble",
            body: "Mission réalisée pour Sanofi Espoir autour de la gestion de créneaux professionnels et de la sélection design d'outils destinés aux professionnels de santé en mission.",
          },
          {
            title: "Enjeux",
            body: "Il fallait clarifier les usages, structurer les parcours et proposer des interfaces plus lisibles pour accompagner les équipes dans leur activité quotidienne.",
          },
          {
            title: "Solution",
            body: "J'ai participé à la conception d'interfaces applicatives, à la définition d'un site éditorial et à la production de visuels de communication cohérents avec l'identité Sanofi Espoir.",
          },
        ],
      },
      {
        type: "media",
        layout: "row",
        media: [
          {
            title: "Organisation de l'application de gestion",
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
            title: "Direction design",
            body: "La sélection design a porté sur un univers sobre, institutionnel et rassurant, avec une hiérarchie claire entre contenus éditoriaux, données chiffrées et actions principales.",
          },
          {
            title: "Site éditorial",
            body: "Le site public met en avant la performance, les actualités et les messages institutionnels de Sanofi Espoir dans une mise en page modulaire et responsive.",
          },
          {
            title: "Espace professionnel",
            body: "L'espace dédié aux professionnels de santé propose tableaux de bord, indicateurs et visualisations pour suivre l'activité et faciliter la prise de décision.",
          },
        ],
      },
      {
        type: "media",
        media: [
          {
            title: "Landing page et architecture éditoriale",
            image: fidesioWebsite,
            size: "wide",
            variant: "light",
          },
          {
            title: "Tableau de bord professionnel de santé",
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
            title: "Communication",
            body: "Les déclinaisons visuelles reprennent les codes Sanofi Espoir à travers des blocs colorés, des visuels produits et des messages d'appel à l'action forts.",
          },
          {
            title: "Résultat",
            body: "L'ensemble des livrables offre une base cohérente pour déployer une expérience digitale plus claire, plus engageante et mieux alignée avec les missions de solidarité de la marque.",
          },
        ],
      },
      {
        type: "media",
        layout: "row",
        media: [
          {
            title: "Déclinaison visuelle esprit de solidarité",
            image: fidesioBannerTeal,
            size: "wide",
          },
          {
            title: "Support de communication institutionnel",
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
        body: "Lors de mon stage chez SÆGUS, j'ai travaillé pour Capgemini sur la création de vidéos animées mettant en scène des personnages et des décors à l'aide d'After Effects et du plugin Duik.",
      },
      {
        title: "Enjeux",
        body: "Il fallait produire quatre cas d'usage animés, avec de nombreuses scènes et une charge d'animation importante, dans un délai court pour un client de longue date.",
      },
      {
        title: "Solution",
        body: "J'ai gagné en autonomie sur la production, en m'appuyant sur mes compétences en design graphique et direction artistique, ainsi que sur mon intérêt pour la vidéo et l'animation.",
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
    slug: "lemon",
    mediaKey: "BAIO",
    title: "Baio",
    eyebrow: "Créer une application gamifiée qui encourage la consommation de produits healthy",
    description:
      "Conception d'une application mobile gamifiée pour encourager une alimentation plus saine.",
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
        caption: "Screens de l'ancienne version d'application pour Lemon",
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
      {
        type: "links",
        links: [{ label: "Voir sur Figma", href: "#" }],
      },
    ],
    sections: [],
    gallery: [],
  },
  {
    slug: "alpha",
    companySite: { label: "SÆGUS", href: "https://www.saegus.com/" },
    mediaKey: "SAEGUS",
    title: "SÆGUS",
    eyebrow: "10ème anniversaire Saegus x Le Trianon",
    description:
      "Conception de la carte de vœux digitale et des supports de communication pour les 10 ans de SÆGUS.",
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
            body: "Mission de conception pour le 10ème anniversaire de SÆGUS : carte de vœux digitale, déclinaisons desktop/mobile et supports de communication pour l'événement au Trianon.",
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
          { title: "Carte de vœux digitale 2021", image: saegusVoeux, size: "wide" },
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
        type: "media",
        media: [
          {
            title: "Accompagnement agile — filé au long cours",
            image: saegusAgile,
            size: "wide",
          },
        ],
      },
      {
        type: "media",
        layout: "row",
        media: [
          { title: "Moments clés du projet", image: saegusTeamCards, size: "wide" },
          { title: "Remerciements aux équipes", image: saegusPolaroids, size: "wide" },
        ],
      },
    ],
    sections: [],
    gallery: [],
  },
  {
    slug: "studio",
    mediaKey: "LGM",
    title: "Film Amateur",
    eyebrow: "Réaliser un court métrage sur une courte période pour encourager le travail d'équipe digitale",
    description:
      "Court métrage « Le Grand Ménage » réalisé en équipe sur deux semaines, de l'écriture au montage.",
    logo: "/assets/Logo-9-2.svg",
    logoAlt: "Logo Film Amateur",
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
      {
        type: "links",
        links: [
          { label: "Les voix les traits", href: "#" },
          { label: "Le dossier de production", href: "#" },
        ],
      },
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
        link: { label: "Voir le site", href: "#" },
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
