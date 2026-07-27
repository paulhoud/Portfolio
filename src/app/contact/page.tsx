import type { Metadata } from "next";
import { ContactPageView } from "@/components/pages/ContactPageView";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contacter ${profile.name}, ${profile.jobTitle} : missions, collaborations et projets de conception produit.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact — ${profile.name}`,
    description: `Échanger avec ${profile.name} autour d'un projet, d'une mission ou d'une collaboration.`,
    url: "/contact",
  },
};

export default function ContactPage() {
  return <ContactPageView />;
}
