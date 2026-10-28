"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, type MouseEvent } from "react";
import { getProjectMedia, getTileEdge } from "@/content/projectMedia";
import { projects } from "@/content/projects";
import { getLocalizedProject } from "@/i18n/catalog";
import { useTranslation } from "@/i18n/context";
import { revealWhenOn, setNextTransition, showVeil } from "@/lib/immersion";
import { playSfx } from "@/lib/sound/sound";
import { track } from "@/lib/stats/track";
import { cn } from "@/lib/utils";

/**
 * Fin d'une page projet : le projet précédent et le suivant, dans l'ordre de
 * la galerie (le dernier mène au premier). Chacun avec la miniature de sa
 * plaque, son numéro, son nom et son accroche.
 *
 * Le passage d'un projet à l'autre reprend celui de la galerie : un voile à
 * la couleur du projet d'arrivée couvre l'écran, la page change dessous, puis
 * il s'efface. Au clavier, les flèches gauche et droite font de même.
 */
export function ProjectPager({ slug }: { slug: string }) {
  const { t, locale, href: localHref } = useTranslation();
  const router = useRouter();
  const index = projects.findIndex((project) => project.slug === slug);
  const count = projects.length;
  const previous = index < 0 ? null : projects[(index - 1 + count) % count];
  const next = index < 0 ? null : projects[(index + 1) % count];

  const travel = useCallback(
    (target: (typeof projects)[number], side: "previous" | "next") => {
      const href = localHref(`/projects/${target.slug}`);
      track("pager", side);
      playSfx("enter");
      void showVeil(getTileEdge(target.mediaKey, target.background), 240).then(() => {
        setNextTransition(href, "cut");
        router.push(href);
        revealWhenOn(href, 520);
      });
    },
    [router, localHref],
  );

  // Flèches du clavier : jamais dans un champ, ni quand une image est ouverte
  // en grand (la visionneuse a ses propres flèches).
  useEffect(() => {
    if (!previous || !next) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (document.querySelector("[aria-modal='true']")) return;
      if (event.key === "ArrowLeft") travel(previous, "previous");
      else travel(next, "next");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previous, next, travel]);

  if (!previous || !next) return null;

  const copy = t.site.projectNav;
  const card = (target: (typeof projects)[number], side: "previous" | "next") => {
    const localized = getLocalizedProject(target.slug, locale) ?? target;
    const media = getProjectMedia(target.mediaKey);
    const number = String(projects.indexOf(target) + 1).padStart(2, "0");
    const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      travel(target, side);
    };
    return (
      <Link
        href={localHref(`/projects/${target.slug}`)}
        onClick={onClick}
        className={cn(
          // min-w-0 : l'accroche coupée (truncate) ne doit pas élargir la case de la
          // grille au-delà de l'écran (téléphone).
          "group flex min-w-0 items-center gap-4 rounded-2xl border border-ink/10 p-4 transition duration-300 md:gap-5 md:p-5",
          "hover:-translate-y-0.5 hover:border-ink/25 hover:bg-ink/[0.03]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60",
          side === "next" && "md:flex-row-reverse md:text-right",
        )}
      >
        <span
          data-grid-hole
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-ink/10 md:h-20 md:w-20"
          style={{ backgroundColor: target.background }}
        >
          {media ? (
            <Image
              src={media.placeholder}
              alt=""
              fill
              sizes="80px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ink/55",
              side === "next" && "md:justify-end",
            )}
          >
            {side === "previous" ? <Arrow back /> : null}
            {side === "previous" ? copy.previous : copy.next}
            {side === "next" ? <Arrow /> : null}
          </span>
          <span className="mt-1.5 block text-lg font-bold text-ink">
            <span className="mr-2 font-normal tabular-nums text-ink/55">{number}</span>
            {localized.title}
          </span>
          <span className="mt-0.5 block truncate text-sm text-ink/55">{localized.eyebrow}</span>
        </span>
      </Link>
    );
  };

  return (
    <nav aria-label={copy.label} className="px-6 pt-6 md:px-20 md:pt-8">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 md:gap-5">
        {card(previous, "previous")}
        {card(next, "next")}
      </div>
    </nav>
  );
}

function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn(
        "h-3.5 w-3.5 transition-transform duration-300",
        back ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5",
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={back ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"} />
    </svg>
  );
}
