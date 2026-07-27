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
export function SocialLinks({ className }: { className?: string }) {
  if (activeSocialLinks.length === 0) return null;

  return (
    <nav aria-label={`Profils professionnels de ${profile.name}`} className={className}>
      <ul className="flex flex-wrap items-center gap-4">
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
                  "flex text-white/40 transition-colors duration-200",
                  "hover:text-white focus-visible:text-white",
                  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white/50",
                )}
              >
                {path ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-[1.05rem] w-[1.05rem]"
                    fill="currentColor"
                  >
                    <path d={path} />
                  </svg>
                ) : null}
                {/* Ancre textuelle conservée pour le SEO et l'accessibilité. */}
                <span className="sr-only">{link.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
