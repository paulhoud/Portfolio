import { LegalPageView } from "@/components/pages/LegalPageView";
import { legalMetadata } from "@/components/seo/pageMetadata";

export const metadata = legalMetadata("en");

export default function EnglishLegalPage() {
  return <LegalPageView />;
}
