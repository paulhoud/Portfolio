import { DocumentPageView } from "@/components/pages/DocumentPageView";
import { documentMetadata } from "@/components/seo/pageMetadata";

export const metadata = documentMetadata("book", "en");

export default function EnglishBookPage() {
  return <DocumentPageView id="book" />;
}
