import { DocumentPageView } from "@/components/pages/DocumentPageView";
import { documentMetadata } from "@/components/seo/pageMetadata";

export const metadata = documentMetadata("cv-print", "en");

export default function ResumePrintPage() {
  return <DocumentPageView id="cv-print" />;
}
