/**
 * Source unique de vérité pour l'identité du site.
 *
 * Alimente : les metadata Next (title/description/Open Graph/Twitter), les
 * données structurées JSON-LD (Person / ProfilePage / CreativeWork), le
 * sitemap, le robots.txt et les liens vers les profils externes.
 *
 * ⚠️ Les entrées marquées « À COMPLÉTER » sont vides par défaut : elles sont
 * simplement ignorées tant qu'elles ne sont pas renseignées (aucun lien mort,
 * aucune donnée structurée invalide). Remplis-les pour activer les signaux SEO
 * correspondants.
 */

/** URL canonique du site, sans slash final. Surchargeable au déploiement. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://paulhoudebine.com"
).replace(/\/$/, "");

export type SocialLink = {
  /** Identifiant technique (sert de clé et d'icône). */
  id: "linkedin" | "behance" | "github" | "youtube" | "figma" | "dribbble" | "instagram" | "malt";
  /** Libellé affiché et ancre du lien. */
  label: string;
  /** URL complète du profil. Laisser "" pour masquer le lien partout. */
  url: string;
};

/**
 * Profils externes. Ils remplissent le `sameAs` du schéma Person, qui est le
 * signal permettant à Google de relier ce site à ton identité professionnelle.
 */
export const socialLinks: SocialLink[] = [
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/paul-houdebine" },
  { id: "behance", label: "Behance", url: "https://www.behance.net/paulhoud" },
  { id: "figma", label: "Figma", url: "https://www.figma.com/@paulhoudebine" },
  { id: "github", label: "GitHub", url: "https://github.com/paulhoud" },
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@paulhdbn" },
];

/** Profils réellement renseignés (les autres sont ignorés partout). */
export const activeSocialLinks = socialLinks.filter((link) => link.url.trim() !== "");

export const profile = {
  name: "Paul Houdebine",
  /** Intitulé principal, affiché dans les titres, l'image de partage et le JSON-LD. */
  jobTitle: "Product Designer",

  /**
   * Autres intitulés exercés. Ils ne sont pas affichés (l'interface reste
   * lisible avec un seul titre) mais sont déclarés dans le schéma Person, afin
   * que les recherches portant sur ces métiers puissent aussi remonter le site.
   */
  alternateJobTitles: ["UI Designer"],
  email: "contact@paulhoudebine.com",

  /**
   * Villes d'exercice. La première sert d'adresse principale, l'ensemble
   * alimente le `workLocation` du schéma Person.
   */
  localities: ["Paris", "Bordeaux"],
  country: "FR",

  /** Employeur actuel. Vide = omis. */
  worksFor: "UpikaJob",

  /** Établissement de formation. Vide = omis. */
  alumniOf: "HETIC",

  /**
   * Phrase de description courte (150-160 caractères idéalement) utilisée comme
   * meta description de la page d'accueil et dans le JSON-LD.
   */
  description:
    "Paul Houdebine, Product Designer : conception d'interfaces, design system, identité digitale et accompagnement produit de la recherche utilisateur à la livraison.",

  /** Spécialités, utilisées dans le `knowsAbout` du schéma Person. */
  expertise: [
    "Product design",
    "UX research",
    "UI design",
    "Design system",
    "Prototypage",
    "Identité visuelle",
    "Direction artistique",
  ],

  /**
   * Portrait utilisé par le schéma Person et par l'image de partage social.
   * (L'image Open Graph 1200×630 est générée automatiquement à partir de ces
   * données — voir `src/app/opengraph-image.tsx`.)
   */
  photo: "/assets/paul-houdebine.jpg",

  /**
   * Visuel de marque carré, déclaré comme image principale de la page d'accueil.
   *
   * Les vignettes affichées dans les résultats de recherche sont choisies par le
   * moteur parmi les images de la page : la page d'accueil n'étant qu'une grille
   * de miniatures de projets, l'une d'elles était retenue. Ce visuel donne un
   * candidat explicite, au format carré attendu par ces vignettes — le format
   * paysage de l'image Open Graph s'y recadrant mal.
   */
  brandImage: "/assets/brand-square.png",
} as const;

/** URL absolue à partir d'un chemin relatif. */
export function absoluteUrl(path = "/") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
