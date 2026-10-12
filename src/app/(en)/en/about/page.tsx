import { AboutPageView } from "@/components/pages/AboutPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { aboutMetadata } from "@/components/seo/pageMetadata";
import { profilePageSchema } from "@/components/seo/schemas";

export const metadata = aboutMetadata("en");

export default function EnglishAboutPage() {
  return (
    <>
      <JsonLd schema={profilePageSchema("en")} />
      <AboutPageView />
    </>
  );
}
