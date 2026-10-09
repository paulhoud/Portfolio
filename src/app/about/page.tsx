import type { Metadata } from "next";
import { AboutPageView } from "@/components/pages/AboutPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { profilePageSchema } from "@/components/seo/schemas";
import { shareMetadata } from "@/components/seo/shareMetadata";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "À propos",
  description: `${profile.jobTitle}, ${profile.name} conçoit des produits de bout en bout : vision produit, recherche utilisateur, UX/UI, design system et front-end.`,
  alternates: { canonical: "/about" },
  ...shareMetadata({
    type: "profile",
    title: `À propos - ${profile.name}`,
    description: `Le parcours, les compétences et la façon de travailler de ${profile.name}, ${profile.jobTitle}.`,
    url: "/about",
  }),
};

export default function AboutPage() {
  return (
    <>
      <JsonLd schema={profilePageSchema()} />
      <AboutPageView />
    </>
  );
}
