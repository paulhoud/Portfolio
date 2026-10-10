"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODEL_CREDITS } from "@/content/modelCredits";
import { profile } from "@/content/profile";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { SocialLinks } from "./SocialLinks";

/**
 * Fin des pages de lecture (projets, À propos, Méthode, Contact). Une signature
 * sobre plutôt qu'une simple ligne de droits : nom et intitulé à gauche, liens
 * et réseaux à droite, droits en petit dessous, séparés du contenu par un
 * filet. Alignée sur la colonne de contenu des pages projet.
 *
 * Elle prend le fond de la page qu'elle termine, sinon une bande d'une autre
 * teinte apparaît (le dégradé des pages texte est fixé à l'écran : page et
 * pied de page n'en font qu'un). Sa marge basse laisse la place aux pastilles
 * fixes des coins de l'écran (langue, son, thème), qui ne la recouvrent jamais.
 * Les crédits des modèles 3D n'apparaissent que si une licence les demande.
 */
export function SiteFooter() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isProject = pathname.startsWith("/projects/");

  const links = [
    { href: "/method", label: t.site.nav.method },
    { href: "/about", label: t.site.nav.about },
    { href: "/contact", label: t.site.nav.contact },
  ];

  return (
    <footer
      className={cn(
        "px-6 pb-28 pt-12 md:px-20 lg:pb-32",
        isProject ? "bg-page" : "[background:var(--reading-surface)_fixed]",
      )}
    >
      <div className="mx-auto max-w-5xl border-t border-ink/10 pt-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-base font-medium text-ink">{profile.name}</p>
            <p className="mt-1 text-sm text-ink/60">{profile.jobTitle}</p>
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <nav aria-label={t.site.nav.footer}>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className={cn(
                        "transition-colors duration-300 hover:text-ink",
                        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink/50",
                        pathname === link.href ? "text-ink" : "text-ink/65",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="-ml-1.5 md:-mr-1.5 md:ml-0">
              <SocialLinks />
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-ink/55">
          {t.site.footer.copyright} {t.site.footer.rights}
        </p>
        {MODEL_CREDITS.length > 0 ? (
          <p className="mt-2 text-xs text-ink/55">
            {t.site.footer.models} :{" "}
            {MODEL_CREDITS.map((credit, index) => (
              <span key={credit.source}>
                {index > 0 ? " · " : null}
                <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-ink/80 hover:underline">
                  <i>{credit.title}</i>
                </a>{" "}
                {t.site.footer.by} {credit.author} (
                <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-ink/80 hover:underline">
                  {credit.license}
                </a>
                )
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </footer>
  );
}
