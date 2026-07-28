"use client";

import { activeSocialLinks, profile } from "@/content/profile";
import { cn } from "@/lib/utils";
import { brandIconPaths, type BrandIconId } from "./icons/brandIconPaths";

/**
 * Liens vers les profils professionnels externes.
 *
 * Chaque lien affiche l'icône de la marque et conserve un libellé textuel
 * masqué visuellement : celui-ci sert d'ancre pour les moteurs de recherche et
 * de nom accessible pour les lecteurs d'écran, sans alourdir la barre latérale.
 *
 * Ces mêmes URLs alimentent le `sameAs` du schéma Person — d'où la source
 * unique dans `profile.ts`.
 *
 * `rel="me"` déclare explicitement que ces profils appartiennent à la même
 * personne ; `noopener` sécurise l'ouverture dans un nouvel onglet. On évite
 * `nofollow` : ces liens sortants sont légitimes et voulus.
 *
 * Si aucun profil n'est renseigné dans `profile.ts`, le composant ne rend rien.
 */
export function SocialLinks({
  className,
  variant = "compact",
}: {
  className?: string;
  /** `compact` : icônes seules (barre latérale). `labelled` : icône + libellé visible. */
  variant?: "compact" | "labelled";
}) {
  if (activeSocialLinks.length === 0) return null;

  const labelled = variant === "labelled";

  return (
    <nav aria-label={`Profils professionnels de ${profile.name}`} className={className}>
      <ul className={cn("flex flex-wrap", labelled ? "gap-2.5" : "items-center gap-4")}>
        {activeSocialLinks.map((link) => {
          const path = brandIconPaths[link.id as BrandIconId];

          return (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="me noopener noreferrer"
                title={`${profile.name} sur ${link.label}`}
                className={cn(
                  "flex items-center transition duration-200",
                  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white/50",
                  labelled
                    ? "gap-2.5 rounded-full border border-white/12 px-4 py-2.5 text-white/70 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/5 hover:text-white"
                    : "text-white/40 hover:text-white focus-visible:text-white",
                )}
              >
                {path ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className={labelled ? "h-4 w-4 shrink-0" : "h-[1.05rem] w-[1.05rem]"}
                    fill="currentColor"
                  >
                    <path d={path} />
                  </svg>
                ) : null}
                {labelled ? (
                  <span className="text-xs uppercase tracking-[0.12em]">{link.label}</span>
                ) : (
                  // Ancre textuelle conservée pour le SEO et l'accessibilité.
                  <span className="sr-only">{link.label}</span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
