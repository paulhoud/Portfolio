import { MethodPageView } from "@/components/pages/MethodPageView";
import { methodMetadata } from "@/components/seo/pageMetadata";

export const metadata = methodMetadata("fr");

export default function MethodPage() {
  return <MethodPageView />;
}
