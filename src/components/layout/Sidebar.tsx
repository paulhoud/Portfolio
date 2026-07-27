"use client";

import { LanguageFlags } from "./LanguageFlags";
import { LogoMark } from "./LogoMark";
import { SidebarNavLink } from "./SidebarNavLink";
import { SocialLinks } from "./SocialLinks";
import { useTranslation } from "@/i18n/context";

export function Sidebar() {
  const { t } = useTranslation();

  const navigation = [
    { href: "/method", label: t.site.nav.method },
    { href: "/about", label: t.site.nav.about },
    { href: "/contact", label: t.site.nav.contact },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] flex-col justify-between bg-[#17161d] px-12 py-16 text-white md:flex">
      <div>
        <LogoMark className="mb-24" />
        <nav aria-label={t.site.nav.main} className="flex flex-col gap-2">
          {navigation.map((item) => (
            <SidebarNavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </div>

      <div className="space-y-5">
        <SocialLinks />
        <LanguageFlags />
        <p className="text-[0.58rem] uppercase leading-relaxed tracking-[0.02em] text-white/35">
          {t.site.footer.copyright}
          <br />
          {t.site.footer.rights}
        </p>
      </div>
    </aside>
  );
}
