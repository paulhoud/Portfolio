"use client";

import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/motion/ScrollReveal";
import { techCategories, type Tech } from "@/content/techStack";
import { useTranslation } from "@/i18n/context";

/**
 * Grille des outils et technologies, regroupés par catégorie.
 *
 * Chaque logo est un lien vers le site officiel de la technologie : ouverture
 * dans un nouvel onglet, `rel` sécurisé, et libellé accessible (les icônes
 * seules n'ont pas de nom accessible).
 */
export function TechStack() {
  const { t } = useTranslation();
  const copy = t.site.about.stack;

  return (
    <section aria-labelledby="stack-heading" className="mt-20 md:mt-28">
      <ScrollReveal>
        <h2
          id="stack-heading"
          className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.28em] text-white/35 md:mb-14"
        >
          {copy.heading}
        </h2>
      </ScrollReveal>

      <div className="grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12">
        {techCategories.map((category) => (
          <ScrollRevealGroup key={category.id} className="space-y-4">
            <ScrollRevealItem>
              <h3 className="text-sm font-bold text-white">{copy[category.id]}</h3>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <ul className="flex flex-wrap gap-2.5">
                {category.items.map((tech) => (
                  <li key={tech.id}>
                    <TechLink tech={tech} />
                  </li>
                ))}
              </ul>
            </ScrollRevealItem>
          </ScrollRevealGroup>
        ))}
      </div>
    </section>
  );
}

function TechLink({ tech }: { tech: Tech }) {
  const { icon } = tech;
  const isMono = icon.kind === "mono";

  return (
    <a
      href={tech.url}
      target="_blank"
      rel="noopener noreferrer"
      title={tech.label}
      className="group/tech relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 transition duration-300 hover:-translate-y-0.5 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      style={{ backgroundColor: isMono ? icon.background : "rgba(255,255,255,0.04)" }}
    >
      {isMono ? (
        <span
          aria-hidden="true"
          className="text-[0.92rem] font-bold leading-none tracking-tight"
          style={{ color: icon.color }}
        >
          {icon.text}
        </span>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-[1.35rem] w-[1.35rem] opacity-80 transition-opacity duration-300 group-hover/tech:opacity-100"
          fill={icon.color}
        >
          <path d={icon.d} />
        </svg>
      )}
      {/* Nom accessible du lien : une icône seule n'en fournit aucun. */}
      <span className="sr-only">{tech.label}</span>
    </a>
  );
}
