import { DocumentPageView } from "@/components/pages/DocumentPageView";
import { documentMetadata } from "@/components/seo/pageMetadata";

export const metadata = documentMetadata("cv", "en");

export default function ResumePage() {
  return <DocumentPageView id="cv" />;
}
