import type { Metadata } from "next";
import { shareMetadata } from "@/components/seo/shareMetadata";
import { profile } from "@/content/profile";
import { getLocalizedProject } from "@/i18n/catalog";
import { languageAlternates, localePath } from "@/i18n/paths";
import type { Locale } from "@/i18n/types";

/**
 * Métadonnées des pages, dans les deux langues : les pages françaises
 * (app/(fr)) et anglaises (app/(en)/en) en tirent les leurs. Chaque page
 * déclare son adresse canonique et sa version dans l'autre langue (hreflang).
 */

function alternates(path: string, locale: Locale) {
  return { canonical: localePath(path, locale), languages: languageAlternates(path) };
}

export function methodMetadata(locale: Locale): Metadata {
  const en = locale === "en";
  return {
    title: en ? "My method" : "Ma méthode",
    description: en
      ? `The method of ${profile.name}, ${profile.jobTitle}: understand, explore, design, experiment and validate, with AI as a design partner and tools chosen for the experience in mind.`
      : `La méthode de ${profile.name}, ${profile.jobTitle} : comprendre, explorer, concevoir, expérimenter et valider, avec l'IA comme partenaire de conception et des outils choisis pour l'expérience visée.`,
    alternates: alternates("/method", locale),
    ...shareMetadata({
      locale,
      title: en ? `My method - ${profile.name}` : `Ma méthode - ${profile.name}`,
      description: en
        ? `From understanding the problem to a working version: the design approach of ${profile.name}.`
        : `De la compréhension du problème à une version qui fonctionne : la démarche de conception de ${profile.name}.`,
      url: localePath("/method", locale),
    }),
  };
}

export function aboutMetadata(locale: Locale): Metadata {
  const en = locale === "en";
  return {
    title: en ? "About" : "À propos",
    description: en
      ? `${profile.jobTitle}, ${profile.name} designs products end to end: product vision, user research, UX/UI, design systems and front-end.`
      : `${profile.jobTitle}, ${profile.name} conçoit des produits de bout en bout : vision produit, recherche utilisateur, UX/UI, design system et front-end.`,
    alternates: alternates("/about", locale),
    ...shareMetadata({
      locale,
      type: "profile",
      title: en ? `About - ${profile.name}` : `À propos - ${profile.name}`,
      description: en
        ? `The background, skills and way of working of ${profile.name}, ${profile.jobTitle}.`
        : `Le parcours, les compétences et la façon de travailler de ${profile.name}, ${profile.jobTitle}.`,
      url: localePath("/about", locale),
    }),
  };
}

export function contactMetadata(locale: Locale): Metadata {
  const en = locale === "en";
  return {
    title: "Contact",
    description: en
      ? `Contact ${profile.name}, ${profile.jobTitle}: assignments, collaborations and product design projects.`
      : `Contacter ${profile.name}, ${profile.jobTitle} : missions, collaborations et projets de conception produit.`,
    alternates: alternates("/contact", locale),
    ...shareMetadata({
      locale,
      title: `Contact - ${profile.name}`,
      description: en
        ? `Talk with ${profile.name} about a project, an assignment or a collaboration.`
        : `Échanger avec ${profile.name} autour d'un projet, d'une mission ou d'une collaboration.`,
      url: localePath("/contact", locale),
    }),
  };
}

export function legalMetadata(locale: Locale): Metadata {
  const en = locale === "en";
  return {
    title: en ? "Legal notice" : "Mentions légales",
    description: en
      ? `Legal notice and privacy of the portfolio of ${profile.name}: publisher, hosting, intellectual property and anonymous audience measurement.`
      : `Mentions légales et confidentialité du portfolio de ${profile.name} : éditeur, hébergement, propriété intellectuelle et mesure d'audience anonyme.`,
    alternates: alternates("/legal", locale),
    ...shareMetadata({
      locale,
      title: en ? `Legal notice - ${profile.name}` : `Mentions légales - ${profile.name}`,
      description: en ? "Publisher, hosting and privacy of this portfolio." : "Éditeur, hébergement et confidentialité de ce portfolio.",
      url: localePath("/legal", locale),
    }),
  };
}

export function projectMetadata(slug: string, locale: Locale): Metadata {
  const project = getLocalizedProject(slug, locale);
  if (!project) return { title: locale === "en" ? "Project not found" : "Projet introuvable" };
  const path = `/projects/${project.slug}`;
  const url = localePath(path, locale);
  return {
    // Le nom est ajouté par le template défini dans le layout racine.
    title: `${project.title} - ${project.eyebrow}`,
    description: project.description,
    alternates: alternates(path, locale),
    ...shareMetadata({
      locale,
      type: "article",
      title: `${project.title} - ${profile.name}`,
      description: project.description,
      url,
      // Générée au build (app/share-image), dans la langue de la page.
      image: {
        url: `/share-image/${locale}/${project.slug}`,
        alt: `${project.title} - ${project.eyebrow}`,
      },
    }),
  };
}
