"use client";

import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from "@/components/motion/ScrollReveal";
import { cn } from "@/lib/utils";

type TextPageProps = {
  title: string;
  eyebrow?: string;
  /** Élargit la colonne de contenu (mises en page riches, grilles). */
  wide?: boolean;
  /**
   * Enveloppe le contenu dans une animation d'apparition groupée. À désactiver
   * quand les enfants gèrent eux-mêmes leurs propres révélations au scroll.
   */
  revealChildren?: boolean;
  children: React.ReactNode;
};

export function TextPage({
  title,
  eyebrow,
  wide = false,
  revealChildren = true,
  children,
}: TextPageProps) {
  const contentClass = cn("mx-auto", wide ? "max-w-5xl" : "copy max-w-3xl");

  return (
    <section className="min-h-screen [background:var(--reading-surface)_fixed] page-top px-6 pb-8 md:px-20 md:pb-12">
      <div className={cn("mx-auto", wide ? "max-w-6xl" : "max-w-4xl")}>
        <ScrollReveal>
          <header className="mb-16 pt-2 text-center md:mb-20">
            {eyebrow ? (
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-ink/55">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-medium uppercase tracking-[0.06em] text-ink/75 md:text-4xl">
              {title}
            </h1>
          </header>
        </ScrollReveal>

        {revealChildren ? (
          <ScrollRevealGroup className={contentClass}>{children}</ScrollRevealGroup>
        ) : (
          <div className={contentClass}>{children}</div>
        )}
      </div>
    </section>
  );
}

export function TextPageSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollRevealItem className="space-y-4">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {children}
    </ScrollRevealItem>
  );
}
