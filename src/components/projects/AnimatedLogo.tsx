"use client";

import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Project } from "@/content/projects";
import { cn } from "@/lib/utils";
const sizes: Record<Project["logoSize"], string> = {
  sm: "w-16 md:w-20",
  md: "w-24 md:w-32",
  lg: "w-36 md:w-44",
  xl: "w-44 md:w-56",
};

const loopEase = "easeInOut" as const;

const noopSubscribe = () => () => {};

/**
 * Safari et tous les navigateurs d'iPhone/iPad (moteur WebKit) lisent les
 * vidéos WebM sans leur couche de transparence : le fond transparent y devient
 * noir. On leur sert l'image animée de secours.
 */
function isWebKitWithoutWebmAlpha() {
  const ua = navigator.userAgent;
  const isAppleTouch = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isDesktopSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua);
  return isAppleTouch || isDesktopSafari;
}

const logoMotions: Record<Project["animation"], TargetAndTransition> = {
  float: {
    y: [0, -10, 0],
    transition: { duration: 3, repeat: Infinity, ease: loopEase },
  },
  orbit: {
    rotate: [0, 1.5, -1.5, 0],
    transition: { duration: 3.8, repeat: Infinity, ease: loopEase },
  },
  sweep: {
    x: [0, 4, 0],
    transition: { duration: 2.9, repeat: Infinity, ease: loopEase },
  },
  pulse: {
    scale: [1, 1.04, 1],
    transition: { duration: 2.4, repeat: Infinity, ease: loopEase },
  },
  tilt: {
    rotate: [-1.8, 1.8, -1.8],
    transition: { duration: 3.4, repeat: Infinity, ease: loopEase },
  },
};

type AnimatedLogoProps = Pick<
  Project,
  | "animation"
  | "foreground"
  | "logo"
  | "logoAlt"
  | "logoKind"
  | "logoSize"
  | "logoScale"
  | "logoVideoZoom"
  | "logoFallback"
  | "logoLoop"
> & {
  priority?: boolean;
};

export function AnimatedLogo({
  animation,
  foreground,
  logo,
  logoAlt,
  logoKind,
  logoSize,
  logoScale = 1,
  logoVideoZoom = 1,
  logoFallback,
  logoLoop,
  priority = false,
}: AnimatedLogoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduceMotion = useReducedMotion();
  const isVideo =
    logoKind === "video" || logo.endsWith(".webm") || logo.endsWith(".mp4");
  // Faux au rendu serveur, puis évalué côté client : pas d'écart d'hydratation.
  const needsFallback = useSyncExternalStore(noopSubscribe, isWebKitWithoutWebmAlpha, () => false);
  const useFallback = isVideo && Boolean(logoFallback) && needsFallback;

  // Boucle partielle (cf. `logoLoop`) : retour à `from` dès `until` atteint.
  const loopFrom = logoLoop?.from;
  const loopUntil = logoLoop?.until;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || loopFrom === undefined || loopUntil === undefined) return;

    let frameHandle = 0;
    const rewind = () => {
      video.currentTime = loopFrom;
      const played = video.play();
      if (played && typeof played.catch === "function") played.catch(() => {});
    };
    const check = () => {
      if (video.currentTime >= loopUntil) rewind();
    };
    const watchFrames = "requestVideoFrameCallback" in video;
    const onFrame = () => {
      check();
      frameHandle = video.requestVideoFrameCallback(onFrame);
    };
    if (watchFrames) frameHandle = video.requestVideoFrameCallback(onFrame);

    video.addEventListener("timeupdate", check);
    video.addEventListener("ended", rewind);
    return () => {
      video.removeEventListener("timeupdate", check);
      video.removeEventListener("ended", rewind);
      if (watchFrames && frameHandle) video.cancelVideoFrameCallback(frameHandle);
    };
  }, [loopFrom, loopUntil, useFallback]);
  const logoMotion = reduceMotion ? undefined : logoMotions[animation];

  return (
    <motion.div
      className="relative flex items-center justify-center"
      whileHover={reduceMotion ? undefined : { scale: 1.06 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      style={{ color: foreground }}
    >
      {animation === "orbit" ? (
        <motion.span
          aria-hidden="true"
          className="absolute h-28 w-28 rounded-full bg-current opacity-15 blur-2xl md:h-40 md:w-40"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      ) : null}

      {animation === "sweep" ? (
        <motion.span
          aria-hidden="true"
          className="absolute h-20 w-44 -skew-x-12 bg-white/20 blur-2xl"
          animate={reduceMotion ? undefined : { x: [-120, 120] }}
          transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <motion.div
        animate={logoMotion}
        className={cn("relative", sizes[logoSize])}
        style={{ scale: logoScale }}
      >
        {useFallback && logoFallback ? (
          <Image
            src={logoFallback}
            alt={logoAlt}
            width={352}
            height={352}
            unoptimized
            priority={priority}
            className="h-auto w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)]"
          />
        ) : isVideo ? (
          // L'ombre est portée par l'enveloppe, et non par la vidéo agrandie :
          // elle garde ainsi la même taille quel que soit le zoom.
          <div className="drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)]">
            <video
              ref={videoRef}
              src={logo}
              autoPlay
              loop={!logoLoop}
              muted
              playsInline
              aria-label={logoAlt}
              // Les marges transparentes agrandies débordent sur le texte voisin :
              // elles ne doivent pas capter les clics.
              className="pointer-events-none block h-auto w-full object-contain"
              style={logoVideoZoom !== 1 ? { transform: `scale(${logoVideoZoom})` } : undefined}
            />
          </div>
        ) : (
          <Image
            src={logo}
            alt={logoAlt}
            width={260}
            height={180}
            priority={priority}
            className="h-auto w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)]"
          />
        )}
      </motion.div>    </motion.div>
  );
}
