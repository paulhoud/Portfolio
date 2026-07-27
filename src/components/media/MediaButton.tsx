"use client";

import type { ReactNode } from "react";
import type { ProjectMedia } from "@/content/projects";
import { useTranslation } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { useMediaViewer } from "./MediaViewerProvider";

/**
 * Enveloppe cliquable autour d'un média de projet : ouvre la visionneuse au clic.
 * Ajoute l'affordance (curseur zoom, léger survol, icône loupe) et l'accessibilité.
 * En l'absence de provider, rend simplement le contenu tel quel.
 */
export function MediaButton({
  media,
  className,
  children,
}: {
  media: ProjectMedia;
  className?: string;
  children: ReactNode;
}) {
  const viewer = useMediaViewer();
  const { locale } = useTranslation();

  if (!viewer) return <>{children}</>;

  const label = `${locale === "en" ? "Open" : "Ouvrir"} : ${media.title}`;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => viewer.openMedia(media)}
      className={cn(
        "group/media relative block w-full cursor-zoom-in transition duration-300 hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50",
        className,
      )}
    >
      {children}
      <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition duration-300 group-hover/media:opacity-100">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
        </svg>
      </span>
    </button>
  );
}
