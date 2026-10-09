"use client";

import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
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
  if (variant === "gradient") {
    return (
      <Link
        href="/"
        aria-label="Retour à l'accueil"
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
 * le déploie en lignes : contours empilés en profondeur, au dégradé orange,
 * parcourus de lumière, qui pivotent vers la souris (cf. logo/logoScene.ts).
 *
 * Tant que la scène n'est pas chargée, et en mode calme (pause demandée ou
 * animations réduites par le système), le survol reste le simple passage du
 * blanc au dégradé.
 */
function AnimatedLogoMark({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const [motionPaused] = useMotionPaused();
  const calm = Boolean(prefersReducedMotion) || motionPaused;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<LogoScene | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const lines = ready && !calm;

  // La scène se prépare quand le navigateur est libre, pour que le premier
  // survol soit immédiat ; rien n'est chargé en mode calme.
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
      aria-label="Retour à l'accueil"
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
          "transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]",
          // Avec les lignes, le logo blanc s'efface vite au survol et revient
          // pendant qu'elles se replient ; sinon, simple fondu vers le dégradé.
          lines ? (playing ? "opacity-0 duration-150" : "opacity-100 duration-300") : "duration-[400ms] group-hover:opacity-0",
        )}
        style={{ transitionTimingFunction: logoFillEase }}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-[400ms]",
          !lines && "group-hover:opacity-100",
        )}
        style={{
          transitionTimingFunction: logoFillEase,
          WebkitMaskImage: "url(/assets/Logo-0-1.svg)",
          maskImage: "url(/assets/Logo-0-1.svg)",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          background:
            "radial-gradient(circle at 35% 68%, #FF9A00 0%, #FF4D00 42%, #E20E0E 78%, #C40000 100%)",
        }}
      />
      {/* Scène des lignes : plus grande que le logo, pour qu'elles se déploient. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: -LINES_PAD,
          top: -LINES_PAD,
          width: 61 + LINES_PAD * 2,
          height: 70 + LINES_PAD * 2,
        }}
      />
    </Link>
  );
}
