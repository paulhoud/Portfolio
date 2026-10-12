import { LegalPageView } from "@/components/pages/LegalPageView";
import { legalMetadata } from "@/components/seo/pageMetadata";

export const metadata = legalMetadata("fr");

export default function LegalPage() {
  return <LegalPageView />;
}
