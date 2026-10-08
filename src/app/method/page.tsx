import type { Metadata } from "next";
import { MethodPageView } from "@/components/pages/MethodPageView";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Ma méthode",
  description: `La méthode de ${profile.name}, ${profile.jobTitle} : comprendre le besoin, aller sur le terrain, cadrer, concevoir, tester, livrer et suivre en production.`,
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
