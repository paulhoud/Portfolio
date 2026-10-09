"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { getTileEdge } from "@/content/projectMedia";
import { projects } from "@/content/projects";
import { useTranslation } from "@/i18n/context";
import { requestGalleryReturn, setNextTransition, showVeil } from "@/lib/immersion";
import { playSfx } from "@/lib/sound/sound";

/**
 * Bouton retour fixe, rendu hors de la zone animée (dans AppFrame) afin de
 * rester réellement épinglé au viewport pendant le scroll et les transitions.
 * Positionné en haut à gauche de la zone de contenu, avec une marge cohérente
 * et sans recouvrir le contenu (qui est centré).
 *
 * Depuis une page projet, le retour se fait à reculons dans la galerie 3D :
 * un voile à la couleur du projet couvre l'écran, l'accueil se met en place
 * devant sa plaque, et la caméra en ressort (cf. GalleryHome).
 */
export function FixedBackButton({ href = "/" }: { href?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const slug = pathname.startsWith("/projects/") ? pathname.split("/")[2] : null;
  const index = slug ? projects.findIndex((item) => item.slug === slug) : -1;

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (index < 0 || href !== "/") return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    playSfx("return");
    const project = projects[index];
    // La galerie reprendra devant ce projet : une tranche de défilement par
    // projet, 35 % de la hauteur d'écran sur ordinateur, un écran entier sur mobile —
    // la hauteur barre d'adresse affichée (100svh), comme dans la galerie.
    const slot = window.matchMedia("(min-width: 1024px)").matches ? 0.35 : 1;
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:100svh;visibility:hidden;pointer-events:none";
    document.body.append(probe);
    const screenHeight = probe.offsetHeight || window.innerHeight;
    probe.remove();
    try {
      window.sessionStorage.setItem("scroll-memory:/", String(Math.round(index * slot * screenHeight)));
    } catch {
      /* ignore */
    }
    void showVeil(getTileEdge(project.mediaKey, project.background), 240).then(() => {
      requestGalleryReturn(project.slug);
      setNextTransition("/", "cut");
      router.push("/", { scroll: false });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      // Sur l'axe du logo de la capsule, juste en dessous.
      className="fixed left-6 top-[calc(var(--header-height)+0.75rem)] z-40 lg:left-[42px]"
    >
      <Link
        href={href}
        // Next repositionne en haut à chaque navigation : on le laisse à
        // `useScrollMemory`, qui restaure la position précédente du damier.
        scroll={false}
        onClick={goBack}
        aria-label={t.site.common.back}
        className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
    </motion.div>
  );
}
