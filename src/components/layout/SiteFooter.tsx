"use client";

import { useTranslation } from "@/i18n/context";

/**
 * Pied de page discret, en bas de chaque page. Il reprend la mention de droits
 * qui se trouvait au bas de l'ancienne barre latérale.
 */
export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/[0.06] bg-[#17161d] px-5 py-6 lg:px-8">
      <p className="text-[0.6rem] uppercase tracking-[0.06em] text-white/40">
        {t.site.footer.copyright} {t.site.footer.rights}
      </p>
    </footer>
  );
}
