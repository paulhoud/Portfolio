import { AppFrame } from "@/components/layout/AppFrame";
import { JsonLd } from "@/components/seo/JsonLd";
import { personSchema, webSiteSchema } from "@/components/seo/schemas";
import { profile, siteUrl } from "@/content/profile";
import { LanguageProvider } from "@/i18n/context";
import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
});

const siteTitle = `${profile.name} — ${profile.jobTitle}`;

export const metadata: Metadata = {
  // Indispensable pour que les URLs Open Graph / canonical soient absolues.
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    // Les pages ne déclarent que leur propre titre : le nom est ajouté ici.
    template: `%s — ${profile.name}`,
  },
  description: profile.description,
  applicationName: siteTitle,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  publisher: profile.name,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: siteTitle,
    title: siteTitle,
    description: profile.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: profile.description,
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon/black/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/white/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon/black/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/white/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/favicon/black/apple-touch-icon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/white/apple-touch-icon.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={lato.variable}>
      <body>
        <JsonLd schema={personSchema()} />
        <JsonLd schema={webSiteSchema()} />
        <LanguageProvider>
          <AppFrame>{children}</AppFrame>
        </LanguageProvider>
      </body>
    </html>
  );
}
