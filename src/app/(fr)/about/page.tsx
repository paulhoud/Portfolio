import { AboutPageView } from "@/components/pages/AboutPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { aboutMetadata } from "@/components/seo/pageMetadata";
import { profilePageSchema } from "@/components/seo/schemas";

export const metadata = aboutMetadata("fr");

export default function AboutPage() {
  return (
    <>
      <JsonLd schema={profilePageSchema("fr")} />
      <AboutPageView />
    </>
  );
}
