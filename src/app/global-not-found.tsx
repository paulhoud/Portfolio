import type { Metadata } from "next";
import { lato } from "@/components/layout/fonts";
import { THEME_BOOT_SCRIPT } from "@/lib/themeBoot";
import "./globals.css";

/**
 * Page introuvable, pour tout le site : chaque langue a sa propre mise en page
 * racine (app/(fr), app/(en)), Next n'en a donc aucune commune pour composer
 * une 404. Celle-ci se suffit à elle-même, dans les deux langues.
 */
export const metadata: Metadata = {
  title: "Page introuvable - Page not found",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="fr" className={lato.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-page px-6 text-center text-ink">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-ink/65">404</p>
          <h1 className="text-2xl font-medium">Cette page n&apos;existe pas.</h1>
          <p lang="en" className="text-sm text-ink/70">
            This page does not exist.
          </p>
          {/* Liens simples : cette page est rendue hors de l'application (pas de routeur). */}
          {/* eslint-disable @next/next/no-html-link-for-pages */}
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm">
            <a href="/" className="rounded-full bg-ink px-5 py-2.5 font-bold text-page transition hover:opacity-90">
              Retour à l&apos;accueil
            </a>
            <a href="/en" lang="en" className="rounded-full border border-ink/20 px-5 py-2.5 text-ink/80 transition hover:border-ink/40 hover:text-ink">
              Back to home
            </a>
          </div>
          {/* eslint-enable @next/next/no-html-link-for-pages */}
        </main>
      </body>
    </html>
  );
}
