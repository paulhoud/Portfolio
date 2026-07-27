"use client";

import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from "@/components/motion/ScrollReveal";

type TextPageProps = {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
};

export function TextPage({ title, eyebrow, children }: TextPageProps) {
  return (
    <section className="min-h-screen bg-[linear-gradient(120deg,#172237_0%,#191820_46%,#17161d_100%)] px-6 py-8 md:px-20 md:py-12">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <header className="mb-16 pt-2 text-center md:mb-20">
            {eyebrow ? (
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-medium uppercase tracking-[0.06em] text-white/75 md:text-4xl">
              {title}
            </h1>
          </header>
        </ScrollReveal>

        <ScrollRevealGroup className="copy mx-auto max-w-3xl">{children}</ScrollRevealGroup>
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
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {children}
    </ScrollRevealItem>
  );
}
