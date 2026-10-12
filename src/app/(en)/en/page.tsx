import { HomePageView } from "@/components/pages/HomePageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { EN_DESCRIPTION } from "@/components/seo/rootMetadata";
import { homePageSchema } from "@/components/seo/schemas";

/** Accueil en anglais : la même galerie, ses textes traduits. */
export default function EnglishHome() {
  return (
    <>
      <JsonLd schema={homePageSchema("en", EN_DESCRIPTION)} />
      <HomePageView />
    </>
  );
}
