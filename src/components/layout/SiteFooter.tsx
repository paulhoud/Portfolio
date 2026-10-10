"use client";

import { MODEL_CREDITS } from "@/content/modelCredits";
import { useTranslation } from "@/i18n/context";

/**
 * Pied de page discret, en bas de chaque page. Il reprend la mention de droits
 * qui se trouvait au bas de l'ancienne barre latérale, et cite les auteurs des
 * modèles 3D de la galerie dont la licence le demande.
 */
export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-ink/[0.08] bg-[var(--background)] px-5 py-6 lg:px-36">
      <p className="text-[0.6rem] uppercase tracking-[0.06em] text-ink/55">
        {t.site.footer.copyright} {t.site.footer.rights}
      </p>
      {MODEL_CREDITS.length > 0 ? (
      <p className="mt-2 text-[0.6rem] tracking-[0.04em] text-ink/45">
        {t.site.footer.models} :{" "}
        {MODEL_CREDITS.map((credit, index) => (
          <span key={credit.source}>
            {index > 0 ? " · " : null}
            <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-ink/75 hover:underline">
              <i>{credit.title}</i>
            </a>{" "}
            {t.site.footer.by} {credit.author} (
            <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-ink/75 hover:underline">
              {credit.license}
            </a>
            )
          </span>
        ))}
      </p>
      ) : null}
    </footer>
  );
}
