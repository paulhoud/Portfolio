import { RootDocument } from "@/components/layout/RootDocument";
import { rootMetadata } from "@/components/seo/rootMetadata";
import "../globals.css";

/** Mise en page racine des pages en français (adresses sans préfixe). */
export const metadata = rootMetadata("fr");

export default function FrenchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="fr">{children}</RootDocument>;
}
