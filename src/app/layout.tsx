import { AppFrame } from "@/components/layout/AppFrame";
import { LanguageProvider } from "@/i18n/context";
import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Paul Houdebine - Portfolio",
  description:
    "Portfolio de Paul Houdebine, designer produit et identité digitale.",
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
        <LanguageProvider>
          <AppFrame>{children}</AppFrame>
        </LanguageProvider>
      </body>
    </html>
  );
}
