"use client";

import { activeSocialLinks, profile } from "@/content/profile";
import { cn } from "@/lib/utils";

/**
 * Liens vers les profils professionnels externes.
 *
 * Rendus en ancres textuelles (et non en icônes seules) : le libellé constitue
 * l'ancre du lien, ce que les moteurs exploitent pour relier ce site à
 * l'identité professionnelle. Ces mêmes URLs alimentent le `sameAs` du schéma
 * Person — il est donc important qu'elles soient identiques des deux côtés,
 * d'où la source unique dans `profile.ts`.
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
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
        {activeSocialLinks.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="me noopener noreferrer"
              title={`${profile.name} sur ${link.label}`}
              className={cn(
                "text-[0.62rem] uppercase tracking-[0.12em] text-white/40 transition-colors",
                "hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/50",
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
