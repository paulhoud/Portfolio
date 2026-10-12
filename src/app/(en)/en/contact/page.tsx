import { ContactPageView } from "@/components/pages/ContactPageView";
import { contactMetadata } from "@/components/seo/pageMetadata";

export const metadata = contactMetadata("en");

export default function EnglishContactPage() {
  return <ContactPageView />;
}
