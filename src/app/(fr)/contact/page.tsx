import { ContactPageView } from "@/components/pages/ContactPageView";
import { contactMetadata } from "@/components/seo/pageMetadata";

export const metadata = contactMetadata("fr");

export default function ContactPage() {
  return <ContactPageView />;
}
