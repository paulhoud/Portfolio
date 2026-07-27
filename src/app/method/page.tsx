import type { Metadata } from "next";
import { MethodPageView } from "@/components/pages/MethodPageView";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Ma méthode",
  description: `La méthode de travail de ${profile.name}, ${profile.jobTitle} : comprendre le contexte, rechercher, synthétiser, prototyper, tester et accompagner la livraison.`,
  alternates: { canonical: "/method" },
  openGraph: {
    title: `Ma méthode — ${profile.name}`,
    description: `De la compréhension du besoin à la livraison : la démarche de conception de ${profile.name}.`,
    url: "/method",
  },
};

export default function MethodPage() {
  return <MethodPageView />;
}
