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
    <footer className="border-t border-white/[0.06] bg-[#17161d] px-5 py-6 lg:px-36">
      <p className="text-[0.6rem] uppercase tracking-[0.06em] text-white/40">
        {t.site.footer.copyright} {t.site.footer.rights}
      </p>
      <p className="mt-2 text-[0.6rem] tracking-[0.04em] text-white/30">
        {t.site.footer.models} :{" "}
        {MODEL_CREDITS.map((credit, index) => (
          <span key={credit.source}>
            {index > 0 ? " · " : null}
            <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-white/60 hover:underline">
              <i>{credit.title}</i>
            </a>{" "}
            {t.site.footer.by} {credit.author} (
            <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-white/60 hover:underline">
              {credit.license}
            </a>
            )
          </span>
        ))}
      </p>
    </footer>
  );
}
