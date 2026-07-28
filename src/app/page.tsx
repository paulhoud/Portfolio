import { HomePageView } from "@/components/pages/HomePageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { homePageSchema } from "@/components/seo/schemas";

export default function Home() {
  return (
    <>
      <JsonLd schema={homePageSchema()} />
      <HomePageView />
    </>
  );
}
