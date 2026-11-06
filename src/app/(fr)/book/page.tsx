import { DocumentPageView } from "@/components/pages/DocumentPageView";
import { documentMetadata } from "@/components/seo/pageMetadata";

export const metadata = documentMetadata("book", "fr");

export default function BookPage() {
  return <DocumentPageView id="book" />;
}
