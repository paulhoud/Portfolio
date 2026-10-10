"use client";

import Image from "next/image";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/motion/ScrollReveal";
import { techCategories, type Tech } from "@/content/techStack";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";

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
          className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.28em] text-ink/55 md:mb-14"
        >
          {copy.heading}
        </h2>
      </ScrollReveal>

      <div className="grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12">
        {techCategories.map((category) => (
          <ScrollRevealGroup key={category.id} className="space-y-4">
            <ScrollRevealItem>
              <h3 className="text-sm font-bold text-ink">{copy[category.id]}</h3>
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
  const light = icon.kind === "path" ? icon.light : undefined;

  return (
    <a
      href={tech.url}
      target="_blank"
      rel="noopener noreferrer"
      title={tech.label}
      // Thème clair : chaque logo sur sa propre tuile presque blanche, en
      // relief sur le fond gris (sur la page même, les couleurs claires des
      // marques se perdaient).
      className={cn(
        "group/tech relative flex h-12 w-12 items-center justify-center rounded-xl border border-ink/10 transition duration-300 hover:-translate-y-0.5 hover:border-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/60",
        "[background:var(--tile)] light:shadow-[0_1px_2px_rgba(24,23,28,0.08)]",
        icon.kind !== "mono" && "light:[background:var(--tile-light)]",
      )}
      style={
        {
          "--tile": icon.kind === "mono" ? icon.background : "rgba(255,255,255,0.04)",
          "--tile-light": light?.background ?? "var(--glass)",
        } as React.CSSProperties
      }
    >
      {icon.kind === "mono" ? (
        <span
          aria-hidden="true"
          className="text-[0.9375rem] font-bold leading-none tracking-tight"
          style={{ color: icon.color }}
        >
          {icon.text}
        </span>
      ) : icon.kind === "image" ? (
        // Logo bitmap : la marque repose sur un dégradé qu'un tracé vectoriel
        // ne saurait restituer.
        <Image
          src={icon.src}
          alt=""
          width={64}
          height={64}
          className="h-[1.35rem] w-[1.35rem] object-contain opacity-90 transition-opacity duration-300 group-hover/tech:opacity-100 light:opacity-100"
        />
      ) : icon.kind === "multi" ? (
        // Logo multicolore : la hauteur est contrainte et la largeur suit le
        // ratio d'origine, pour ne pas déformer les marques non carrées.
        <svg
          aria-hidden="true"
          viewBox={icon.viewBox}
          className="h-[1.45rem] w-auto opacity-90 transition-opacity duration-300 group-hover/tech:opacity-100 light:opacity-100"
        >
          {icon.paths.map((shape) => (
            <path key={shape.d} d={shape.d} fill={shape.fill} />
          ))}
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox={icon.viewBox ?? "0 0 24 24"}
          className={cn(
            "opacity-80 transition-opacity duration-300 group-hover/tech:opacity-100 light:opacity-100",
            // Logotype en toutes lettres : plus large que haut.
            icon.viewBox ? "h-auto w-[2.1rem]" : "h-[1.35rem] w-[1.35rem]",
            light?.color && "light:[fill:var(--icon-light)]",
          )}
          style={light?.color ? ({ "--icon-light": light.color } as React.CSSProperties) : undefined}
          // Logo blanc (Cursor, ChatGPT, macOS…) : à l'encre du thème, sinon il
          // disparaît sur le fond clair.
          fill={/^#f{3}(f{3})?$/i.test(icon.color) ? "var(--ink)" : icon.color}
        >
          {icon.backdrop ? <rect x="1.5" y="1.5" width="21" height="21" fill={icon.backdrop} /> : null}
          <path d={icon.d} />
        </svg>
      )}
      {/* Nom accessible du lien : une icône seule n'en fournit aucun. */}
      <span className="sr-only">{tech.label}</span>
    </a>
  );
}
