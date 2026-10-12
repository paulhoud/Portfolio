import { MethodPageView } from "@/components/pages/MethodPageView";
import { methodMetadata } from "@/components/seo/pageMetadata";

export const metadata = methodMetadata("en");

export default function EnglishMethodPage() {
  return <MethodPageView />;
}
