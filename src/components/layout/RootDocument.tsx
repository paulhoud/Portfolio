import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppFrame } from "@/components/layout/AppFrame";
import { JsonLd } from "@/components/seo/JsonLd";
import { personSchema, webSiteSchema } from "@/components/seo/schemas";
import { LanguageProvider } from "@/i18n/context";
import type { Locale } from "@/i18n/types";
import { THEME_BOOT_SCRIPT } from "@/lib/themeBoot";
import { lato } from "./fonts";

/**
 * Document HTML commun aux deux langues : chacune a sa mise en page racine
 * (app/(fr), app/(en)), qui lui donne sa langue. Passer de l'une à l'autre
 * recharge la page, avec le bon `lang` et les bonnes métadonnées.
 */
export function RootDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    // `data-theme` est posé par le script ci-dessous avant l'hydratation : React
    // ne doit pas s'étonner de le trouver sur <html>.
    <html lang={locale} className={lato.variable} suppressHydrationWarning>
      {/* Mise en page racine (appelée par app/(fr) et app/(en)) : <head> y est à sa place. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <JsonLd schema={personSchema()} />
        <JsonLd schema={webSiteSchema()} />
        <LanguageProvider locale={locale}>
          <AppFrame>{children}</AppFrame>
        </LanguageProvider>
        {/* Temps de chargement mesurés chez les visiteurs (anonyme, sans cookie),
            visibles dans Vercel une fois Speed Insights activé sur le projet. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
