"use client";

import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "@/i18n/context";
import { requestIdle } from "@/lib/idle";
import { useMotionPaused } from "@/lib/motionPause";
import { cn } from "@/lib/utils";
import type { LogoScene } from "./logo/logoScene";

type LogoMarkProps = {
  variant?: "white" | "gradient";
  className?: string;
};

const logoFillEase = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Marge autour du logo (unités du dessin 61 × 70) où les lignes peuvent se déployer. */
const LINES_PAD = 34;

export function LogoMark({ variant = "white", className }: LogoMarkProps) {
  const { t } = useTranslation();
  if (variant === "gradient") {
    return (
      <Link
        href="/"
        aria-label={t.site.nav.home}
        className={cn("inline-flex w-fit items-center", className)}
      >
        {/* Pas de `priority` : il générerait un préchargement pour chacune des
            deux instances du logo (barre latérale et en-tête mobile), alors
            qu'une seule est affichée selon la largeur d'écran. Le préchargement
            inutilisé provoquait un avertissement du navigateur. `eager` suffit :
            le logo est au-dessus de la ligne de flottaison. */}
        <Image src="/assets/Logo-0-2.svg" alt="PH" width={61} height={70} loading="eager" />
      </Link>
    );
  }

  return <AnimatedLogoMark className={className} />;
}

/**
 * Logo blanc de l'en-tête. Au survol (ou au focus clavier), une scène three.js
 * le déploie en lignes : contours blancs empilés en profondeur, parcourus de
 * lumière, qui pivotent vers la souris (cf. logo/logoScene.ts).
 *
 * Tant que la scène n'est pas chargée, et en mode calme (pause demandée ou
 * animations réduites par le système), le survol est un simple halo blanc.
 */
function AnimatedLogoMark({ className }: { className?: string }) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [motionPaused] = useMotionPaused();
  const calm = Boolean(prefersReducedMotion) || motionPaused;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<LogoScene | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const lines = ready && !calm;

  // La scène se prépare quand le navigateur est libre, pour que le premier
  // survol soit immédiat ; rien n'est chargé en mode calme. À la mise en
  // pause, elle est détruite et rend son contexte graphique : la toile ne
  // peut plus en ouvrir un autre, d'où une toile neuve à chaque reprise (sa
  // clé, plus bas), et l'état remis à zéro pour que le logo reste visible.
  useEffect(() => {
    if (calm) return;
    let cancelled = false;
    let scene: LogoScene | null = null;
    const cancelIdle = requestIdle(() => {
      void import("./logo/logoScene").then(({ createLogoScene }) => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        scene = createLogoScene(canvas, LINES_PAD, () => {});
        sceneRef.current = scene;
        if (scene) setReady(true);
      });
    }, 3000);
    return () => {
      cancelled = true;
      cancelIdle();
      sceneRef.current = null;
      scene?.dispose();
      setReady(false);
      setPlaying(false);
    };
  }, [calm]);

  const play = (on: boolean) => {
    if (!lines || !sceneRef.current) return;
    setPlaying(on);
    sceneRef.current.setActive(on);
  };
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    sceneRef.current?.setPointer(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
  };

  return (
    <Link
      href="/"
      aria-label={t.site.nav.home}
      onMouseEnter={() => play(true)}
      onMouseLeave={() => play(false)}
      onMouseMove={follow}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) play(true);
      }}
      onBlur={() => play(false)}
      className={cn("group relative inline-flex h-[70px] w-[61px] items-center", className)}
    >
      <Image
        src="/assets/Logo-0-1.svg"
        alt="PH"
        width={61}
        height={70}
        loading="eager"
        className={cn(
          "logo-ink transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]",
          // Avec les lignes, le logo blanc s'efface vite au survol et revient
          // pendant qu'elles se replient ; sinon, un halo blanc l'entoure.
          lines
            ? playing
              ? "opacity-0 duration-150"
              : "opacity-100 duration-300"
            : "transition-[filter] duration-[400ms] group-hover:[filter:drop-shadow(0_0_6px_rgba(255,255,255,0.7))]",
        )}
        style={{ transitionTimingFunction: logoFillEase }}
      />
      {/* Scène des lignes : plus grande que le logo, pour qu'elles se déploient. */}
      <canvas
        key={calm ? "calm" : "lines"}
        ref={canvasRef}
        aria-hidden="true"
        className="logo-ink pointer-events-none absolute"
        style={{
          left: -LINES_PAD,
          top: -LINES_PAD,
          width: 61 + LINES_PAD * 2,
          height: 70 + LINES_PAD * 2,
          // Les lignes s'estompent avant le bord de la capsule du header, qui
          // les contient : pas de coupure nette en haut ni en bas.
          maskImage: "linear-gradient(to bottom, transparent 10%, #000 30%, #000 70%, transparent 90%)",
        }}
      />
    </Link>
  );
}
