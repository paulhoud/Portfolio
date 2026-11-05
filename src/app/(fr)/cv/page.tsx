import { DocumentPageView } from "@/components/pages/DocumentPageView";
import { documentMetadata } from "@/components/seo/pageMetadata";

export const metadata = documentMetadata("cv", "fr");

export default function CvPage() {
  return <DocumentPageView id="cv" />;
}
