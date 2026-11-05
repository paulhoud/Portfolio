import { DocumentPageView } from "@/components/pages/DocumentPageView";
import { documentMetadata } from "@/components/seo/pageMetadata";

export const metadata = documentMetadata("cv-print", "fr");

export default function CvPrintPage() {
  return <DocumentPageView id="cv-print" />;
}
