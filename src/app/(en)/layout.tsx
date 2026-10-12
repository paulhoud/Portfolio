import { RootDocument } from "@/components/layout/RootDocument";
import { rootMetadata } from "@/components/seo/rootMetadata";
import "../globals.css";

/** Mise en page racine des pages en anglais (adresses sous « /en »). */
export const metadata = rootMetadata("en");

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
