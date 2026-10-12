import type { Metadata } from "next";

/**
 * Page introuvable, pour tout le site : chaque langue a sa propre mise en page
 * racine (app/(fr), app/(en)), Next n'en a donc aucune commune pour composer
 * une 404. Celle-ci se suffit à elle-même, dans les deux langues.
 *
 * Volontairement autonome (styles en ligne, police du système) : importer la
 * feuille de style du site ici faisait recompiler cette page en boucle par
 * le serveur de développement, jusqu'à épuiser sa mémoire.
 */
export const metadata: Metadata = {
  title: "Page introuvable - Page not found",
  robots: { index: false },
};

const css = `
  :root { color-scheme: dark; --ink: #f5f2f4; --page: #17161c; }
  @media (prefers-color-scheme: light) { :root { color-scheme: light; --ink: #18171c; --page: #e8e6e1; } }
  body { margin: 0; background: var(--page); color: var(--ink); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 0 24px; text-align: center; }
  .code { font-size: 11px; font-weight: 700; letter-spacing: 0.24em; opacity: 0.7; }
  h1 { margin: 0; font-size: 24px; font-weight: 500; }
  p { margin: 0; font-size: 14px; opacity: 0.75; }
  nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 8px; }
  a { border-radius: 999px; padding: 10px 20px; font-size: 14px; text-decoration: none; color: var(--ink); border: 1px solid color-mix(in srgb, var(--ink) 25%, transparent); }
  a.main { background: var(--ink); color: var(--page); border-color: transparent; font-weight: 700; }
`;

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <main>
          <span className="code">404</span>
          <h1>Cette page n&apos;existe pas.</h1>
          <p lang="en">This page does not exist.</p>
          {/* Liens simples : cette page est rendue hors de l'application (pas de routeur). */}
          {/* eslint-disable @next/next/no-html-link-for-pages */}
          <nav>
            <a href="/" className="main">
              Retour à l&apos;accueil
            </a>
            <a href="/en" lang="en">
              Back to home
            </a>
          </nav>
          {/* eslint-enable @next/next/no-html-link-for-pages */}
        </main>
      </body>
    </html>
  );
}
